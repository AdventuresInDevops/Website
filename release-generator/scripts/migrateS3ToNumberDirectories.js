const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const { S3Client, HeadObjectCommand, CopyObjectCommand, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { parseStringPromise: parseXml } = require('xml2js');
const { getCurrentlySyncedS3EpisodeSlugs } = require('../publisher/sync.js');

const UPLOAD_BUCKET = 'storage.adventuresindevops.com';
const episodesDir = path.resolve(__dirname, '../../episodes');
const archiveDir = path.join(episodesDir, '0-archive');

const s3Client = new S3Client({ region: 'us-east-1' });

const logFilePath = path.resolve(__dirname, '../../migrate-s3-to-number-dirs.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  process.stdout.write(`${line}\n`);
  logStream.write(`${line}\n`);
}

function logError(msg) {
  const line = `[${new Date().toISOString()}] ERROR: ${msg}`;
  process.stderr.write(`${line}\n`);
  logStream.write(`${line}\n`);
}

const REQUIRED_FILES = ['episode.mp3', 'post.webp', 'transcript.txt', 'transcript.srt'];
const REQUIRED_IMAGE_VARIANTS = ['post.png', 'post.webp', 'post.jpg', 'post.jpeg'];

async function fetchPublishedEpisodeNumbers() {
  const rssUrl = 'https://adventuresindevops.com/episodes/rss.xml';
  const xml = await new Promise((resolve, reject) => {
    https.get(rssUrl, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
  const parsed = await parseXml(xml);
  const items = parsed?.rss?.channel?.[0]?.item ?? [];
  const numbers = new Set();
  for (const item of items) {
    const episodeNumber = item['itunes:episode']?.[0];
    if (episodeNumber) {
      numbers.add(String(episodeNumber));
    }
  }
  return numbers;
}

async function uploadFileToS3(localPath, destKey, contentType) {
  const fileBuffer = await fsPromises.readFile(localPath);
  await s3Client.send(new PutObjectCommand({
    Bucket: UPLOAD_BUCKET,
    Key: destKey,
    Body: fileBuffer,
    ContentType: contentType
  }));
}

async function listAllObjects(prefix) {
  const objects = [];
  let continuationToken;
  do {
    const data = await s3Client.send(new ListObjectsV2Command({
      Bucket: UPLOAD_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken || undefined
    }));
    if (data.Contents) {
      objects.push(...data.Contents);
    }
    continuationToken = data.NextContinuationToken;
  } while (continuationToken);
  return objects;
}

async function headObject(key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: UPLOAD_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyObject(sourceKey, destKey) {
  await s3Client.send(new CopyObjectCommand({
    Bucket: UPLOAD_BUCKET,
    CopySource: `${UPLOAD_BUCKET}/${sourceKey}`,
    Key: destKey
  }));
}

async function phaseACopy(oldStyleDirs) {
  log(`\n=== Phase A: Copy ${oldStyleDirs.length} slug-path directories to number-only paths ===\n`);
  let copied = 0;
  let skipped = 0;

  for (const dir of oldStyleDirs) {
    const episodeNumber = dir.match(/^(\d+)-/)[1];
    const objects = await listAllObjects(`storage/episodes/${dir}/`);

    for (const obj of objects) {
      const filename = obj.Key.split('/').slice(-1)[0];
      if (!filename) { continue; }
      const destKey = `storage/episodes/${episodeNumber}/${filename}`;
      const exists = await headObject(destKey);
      if (exists) {
        log(`[skip] ${destKey}`);
        skipped++;
      } else {
        await copyObject(obj.Key, destKey);
        log(`[copied] ${obj.Key} → ${destKey}`);
        copied++;
      }
    }
  }

  log(`\n[phase-a-summary] copied: ${copied}, skipped: ${skipped}`);
}

async function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) { return {}; }
  return yaml.load(match[1]) || {};
}

async function collectLocalEpisodes() {
  const episodes = [];

  const addEpisodes = async (dir, isArchive) => {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    await Promise.all(entries.filter(e => e.isDirectory()).map(async e => {
      const indexPath = path.join(dir, e.name, 'index.md');
      let content;
      try {
        content = await fsPromises.readFile(indexPath, 'utf8');
      } catch {
        return;
      }
      const frontmatter = await parseFrontmatter(content);
      if (frontmatter.episode === false) { return; }
      const episodeNumber = frontmatter.episode_number != null
        ? String(frontmatter.episode_number)
        : e.name.match(/^(\d{3,})-/)?.[1];
      if (!episodeNumber) { return; }
      episodes.push({ episodeNumber, dirName: `${isArchive ? '0-archive/' : ''}${e.name}` });
    }));
  };

  await addEpisodes(episodesDir, false);
  await addEpisodes(archiveDir, true);
  return episodes;
}

async function phaseBValidate(localEpisodes, publishedEpisodeNumbers) {
  log(`\n=== Phase B: Validate ${localEpisodes.length} episodes have required files in S3 ===\n`);

  let okCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const missing = [];

  await Promise.all(localEpisodes.map(async ({ episodeNumber, dirName }) => {
    if (!publishedEpisodeNumbers.has(episodeNumber)) {
      log(`[skip-unreleased] ${episodeNumber} (${dirName})`);
      skippedCount++;
      return;
    }

    const prefix = `storage/episodes/${episodeNumber}/`;
    const objects = await listAllObjects(prefix);
    const presentFiles = new Set(objects.map(o => o.Key.split('/').slice(-1)[0]));

    const episodeMissing = [];

    for (const required of REQUIRED_FILES) {
      if (!presentFiles.has(required)) {
        if (required === 'post.webp') {
          const hasAnyImage = REQUIRED_IMAGE_VARIANTS.some(v => presentFiles.has(v));
          if (!hasAnyImage) {
            episodeMissing.push(required);
          }
        } else {
          episodeMissing.push(required);
        }
      }
    }

    if (episodeMissing.length === 0) {
      log(`[validate] ${episodeNumber} (${dirName}): ✓`);
      okCount++;
    } else {
      logError(`[validate-fail] ${episodeNumber} (${dirName}): missing ${episodeMissing.join(', ')}`);
      missing.push({ episodeNumber, dirName, missing: episodeMissing });
      failCount++;
    }
  }));

  log(`\n[phase-b-summary] ok: ${okCount}, skipped-unreleased: ${skippedCount}, failed: ${failCount}`);
  if (missing.length) {
    logError('\nMissing files detail:');
    for (const { episodeNumber, dirName, missing: m } of missing) {
      logError(`  ${episodeNumber} (${dirName}): ${m.join(', ')}`);
    }
  }
  return missing.length === 0;
}

const LOGO_LOCAL_PATH = path.resolve(__dirname, '../../static/img/logo-1400x1400.png');
const LOGO_UPLOAD_EPISODES = ['232'];

async function phaseUploadMissingImages() {
  log('\n=== Phase: Upload missing post images for specific episodes ===\n');
  for (const episodeNumber of LOGO_UPLOAD_EPISODES) {
    for (const filename of ['post.png', 'post.webp']) {
      const destKey = `storage/episodes/${episodeNumber}/${filename}`;
      const exists = await headObject(destKey);
      if (exists) {
        log(`[skip] ${destKey} already exists`);
      } else {
        await uploadFileToS3(LOGO_LOCAL_PATH, destKey, filename.endsWith('.png') ? 'image/png' : 'image/webp');
        log(`[uploaded] ${destKey}`);
      }
    }
  }
}

async function main() {
  const episodeFilter = process.argv[2] ? String(process.argv[2]) : null;

  log(`=== S3 Migration Run: ${new Date().toISOString()} ===`);
  log(`Log file: ${logFilePath}`);
  if (episodeFilter) {
    log(`Episode filter: ${episodeFilter} (skipping bulk copy phase)`);
  }

  log('\nFetching published episode numbers from RSS...');
  const publishedEpisodeNumbers = await fetchPublishedEpisodeNumbers();
  log(`Found ${publishedEpisodeNumbers.size} published episodes in RSS`);

  if (!episodeFilter) {
    const allDirs = await getCurrentlySyncedS3EpisodeSlugs();
    const oldStyleDirs = allDirs.filter(d => /^\d+-[a-z]/.test(d));
    log(`Found ${allDirs.length} total S3 dirs, ${oldStyleDirs.length} with slug suffix to copy`);
    await phaseACopy(oldStyleDirs);
  }

  await phaseUploadMissingImages();

  log('\nLoading local episode list...');
  let localEpisodes = await collectLocalEpisodes();
  if (episodeFilter) {
    localEpisodes = localEpisodes.filter(e => e.episodeNumber === episodeFilter);
    log(`Filtered to ${localEpisodes.length} episode(s) matching ${episodeFilter}`);
  } else {
    log(`Found ${localEpisodes.length} local episodes to validate`);
  }

  const valid = await phaseBValidate(localEpisodes, publishedEpisodeNumbers);

  if (!valid) {
    logError('[FAIL] Validation failed — some episodes are missing required files in S3');
    logStream.end();
    process.exit(1);
  }

  log('[SUCCESS] All episodes have required files at number-only S3 paths');
  logStream.end();
}

main().catch(err => {
  logError(`Fatal: ${err.message}`);
  logStream.end();
  process.exit(1);
});
