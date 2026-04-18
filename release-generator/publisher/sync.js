/* eslint-disable no-console */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { DateTime } = require('luxon');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const os = require('os');
const ApplicationError = require('error-object-polyfill');

const util = require('util');
const { exec } = require('child_process');
const sharp = require('sharp');
const execAsync = util.promisify(exec);
const { parseStringPromise: parseXml } = require('xml2js');

// https://www.spreaker.com/cms/statistics/downloads/shows/6102036
const UPLOAD_BUCKET = 'storage.adventuresindevops.com';
const episodesReleasePath = path.resolve(__dirname, '../../', 'episodes');

const s3Client = new S3Client({ region: 'us-east-1' });

const contentTypeMap = {
  srt: 'application/x-subrip',
  txt: 'text/plain',
  vtt: 'text/vtt',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp'
};

/**
 * Parses the YAML frontmatter from a Markdown string.
 * @param {string} mdContent - The full Markdown content.
 * @returns {object} An object containing 'frontmatter' (parsed YAML) and 'content' (remaining Markdown).
 * @throws {Error} If YAML frontmatter parsing fails.
 */
function parseMarkdownFrontmatter(mdContent, episodeFileName) {
  const frontmatterMatch = mdContent.match(/^---\s*\n(.*)\n---\s*\n(.*)/s);
  if (!frontmatterMatch) {
    // If no frontmatter, treat entire content as raw markdown with empty frontmatter
    return { frontmatter: {}, content: mdContent.trim(), date: null };
  }
  const frontmatterStr = frontmatterMatch[1];
  const content = frontmatterMatch[2].trim();
  try {
    const frontmatter = yaml.load(frontmatterStr);
    const date = frontmatter?.date?.toISOString() ?? episodeFileName.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
    return { frontmatter, content, date };
  } catch (e) {
    throw new Error(`Failed to parse YAML frontmatter: ${e.message}`);
  }
}

/**
 * Cleans Markdown content for Spreaker description field.
 * Strips HTML/JSX, images, and preserves only valid Markdown text and links.
 * @param {string} episodeLink - Link to specific episode
 * @param {string} markdownContent - The raw Markdown content.
 * @returns {string} Cleaned content suitable for Spreaker.
 */
async function cleanDescriptionForPublishing(episodeLink, markdownContent) {
  const initialCleanedContent = markdownContent.replace(/^import .* from '.*?'(?:;|\n)/gm, '');

  // Extract the Speaker Callout component and replace them with markdown
  const sponsorRegex = /<SponsorCallout\b[^>]*\/>/g;
  const attrRegex = /name="([^"]+)"|link="([^"]+)"/g;

  const sponsor = {};
  for (const callout of initialCleanedContent.matchAll(sponsorRegex)) {
    let match;
    while ((match = attrRegex.exec(callout[0])) !== null) {
      if (match[1]) {sponsor.name = match[1];}
      if (match[2]) {sponsor.link = match[2];}
    }
  }

  let cleanedContent = initialCleanedContent;
  // 1. We cannot trust ourselves to use HTTPS everywhere, and we also cannot trust the providers to do it., so let's just make sure all links are HTTPS
  cleanedContent = cleanedContent.replace(/http:\/\//g, 'https://');

  // 2. Remove all HTML/JSX components and their content (e.g., <GuestCallout ... />, <div>...</div>)
  // This regex targets any HTML-like tags, including custom JSX ones.
  cleanedContent = cleanedContent.replace(/<[^>]*>.*?<\/[^>]*>/gs, ''); // Paired tags with content
  cleanedContent = cleanedContent.replace(/<[^>]*?\/>/g, ''); // Self-closing tags

  // 3. Remove Images (e.g., ![alt text](./path/to/image.jpeg))
  cleanedContent = cleanedContent.replace(/!\[.*?\]\(.*?\)/g, '');

  // 4. Reduce multiple blank lines to at most two newlines
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  const shareLink = `[Share Episode](${episodeLink})`;
  const sponsorContent = sponsor.name && sponsor.link && `Episode Sponsor: [${sponsor.name}](${sponsor.link}) - ${sponsor.link}` || '';
  // https://en.wikibooks.org/wiki/Unicode/List_of_useful_symbols
  const header = [shareLink, sponsorContent].filter(v => v).join(' ⸺ ');
  cleanedContent = `${header}<br /><br />${cleanedContent}`;

  const { marked } = await import('marked');
  marked.use({
    extensions: [{
      // Remove header sections and prefer bolding the header name since podcast descriptions on podcast sites won't understand them
      name: 'heading',
      renderer(token) {
        return `<b>${this.parser.parseInline(token.tokens)}</b><br />`;
      }
    }],

    renderer: {
      text(token) {
        // Parse text elements with tokens as normal tokens
        if (token.tokens) {
          return false;
        }

        // but all other text elements should just be used exactly as is.
        return token.text;
      },
      link(token) {
        const text = this.parser.parseInline(token.tokens);
        if (token.href.startsWith('../')) {
          console.error('************************************************************************');
          console.error(`Episode content that needs to be fixed: ${markdownContent}`);
          throw Error(`We cannot create a [link]() correctly when the path starts with ../ because that will not be resolved by podcast platforms, update the link to be absolute.`);
        }

        if (token.href.includes('adventuresindevops.com') || token.href.includes('dev0ps.fyi')) {
          return `<a href="${token.href}" target="_blank">${text}</a>`;
        }

        return `<a href="${token.href}" target="_blank" rel="noreferrer noopener">${text}</a>`;
      }
    }
  });
  const markdownResult = marked.parse(cleanedContent);

  return markdownResult.trim()
  // Include non-breaking spaces so that it still looks good on mobile spotify
  .replace(/<br \/>/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br />')
  .replace(/<\/p>(?!<p>)/g, '</p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br />')
  .replace(/<\/p><p>/g, '</p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
  // Remove whitespace from published html
  .split('\n').join('');
}

/**
 * Reads content from all 'index.md' files found in subdirectories of episodesReleasePath.
 * Assumes Docusaurus structure where each episode is a subdirectory with index.md.
 * @returns {Promise<Array<Episode>>} A promise that resolves to an array of Markdown file contents.
 * @throws {Error} If the base directory cannot be read.
 */
async function getEpisodesFromDirectory() {
  const allMdContents = [];
  try {
    const entries = await fs.readdir(episodesReleasePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slugContainsEpisodeNumber = entry.name.match(/^(\d{3,})-[^\d].*$/);
      if (!slugContainsEpisodeNumber) {
        continue;
      }

      const indexPath = path.join(episodesReleasePath, entry.name, 'index.md');
      const mdContent = await fs.readFile(indexPath, 'utf-8');

      const { frontmatter, content, date } = parseMarkdownFrontmatter(mdContent, entry.name);

      if (!date) {
        throw Error(`Missing 'date' in frontmatter for episode in file '${indexPath}'`);
      }

      const episodeDate = DateTime.fromISO(date, { zone: 'UTC' });
      // Skip old episodes before automation and before episodes had numbers in them.
      if (episodeDate < DateTime.fromISO('2025-11-11')) {
        continue;
      }

      const linkSlug = entry.name;
      const episodeLink = `https://adventuresindevops.com/episodes/${linkSlug}`;
      const sanitizedBody = await cleanDescriptionForPublishing(episodeLink, content);

      // Spreaker description max length is 4000 characters, and realistically this is the standard across many platforms as well.
      if (sanitizedBody.length > 4000) {
        console.warn(`WARNING: Description for '${entry.name}' truncated to 4000 characters (${sanitizedBody.length} chars originally).`);
        throw Error(`WARNING: Description for '${entry.name}' truncated to 4000 characters (${sanitizedBody.length} chars originally).`);
      }

      allMdContents.push({
        fullSlug: entry.name,
        slug: entry.name?.match(/^[\d-]+([^\d].*)$/)[1],
        episodeNumber: slugContainsEpisodeNumber ? parseInt(slugContainsEpisodeNumber[1], 10) : null,
        date: episodeDate,
        linkSlug,
        episodeLink,
        title: frontmatter.title,
        sanitizedBody
      });
      console.log(`    ${indexPath}`);
    }
  } catch (dirError) {
    console.error(dirError);
    throw new Error(`Failed to read directory '${episodesReleasePath}': ${dirError.message}`);
  }
  return allMdContents;
}


async function ensureS3Episode() {
  const completeDirectory = `${process.env.HOME}/git/podcast/Podcast Episodes Completed`;
  console.log(`[ensureS3Episode] Reading completed directory: ${completeDirectory}`);
  const entries = await fs.readdir(completeDirectory, { withFileTypes: true });
  const filesFromDirectory = entries.map(e => e.name);
  console.log(`[ensureS3Episode] Files found: ${filesFromDirectory.join(', ')}`);

  const transcriptFileNames = filesFromDirectory.filter(f => f.match('transcript.'));
  console.log(`[ensureS3Episode] Transcripts found: ${transcriptFileNames.join(', ')}`);
  if (transcriptFileNames.length !== 2) {
    throw Error('Transcripts not found in the completed directory');
  }
  const videoFileNames = filesFromDirectory.filter(f => f.match(/(mp4|mov|avi|mkv)$/));
  console.log(`[ensureS3Episode] Video files found: ${videoFileNames.join(', ')}`);
  if (!videoFileNames.length) {
    throw Error('No Episodes found in the completed directory');
  }
  const actualVideoPath = path.join(completeDirectory, videoFileNames.find(f => !f.includes('.raw.')));
  console.log(`[ensureS3Episode] Using video file: ${actualVideoPath}`);

  const episodeSlug = path.basename(actualVideoPath).replace(/[.]\w+$/, '');
  console.log(`[ensureS3Episode] Episode slug: ${episodeSlug}`);

  const episodeNumber = episodeSlug.match(/^(\d{3,})-/)?.[1];
  if (!episodeNumber) {
    console.error('');
    console.error('');
    console.error('Files in completed directory do not currently start with the episode number.');
    throw Error('Files in completed directory do not currently start with the episode number.');
  }
  console.log(`[ensureS3Episode] Episode number: ${episodeNumber}`);

  const episodeDirectory = path.join(episodesReleasePath, episodeSlug);
  console.log(`[ensureS3Episode] Looking for post image in episode directory: ${episodeDirectory}`);
  let postImageFile;
  try {
    const episodeDirectoryEntries = await fs.readdir(episodeDirectory, { withFileTypes: true });
    console.log(`[ensureS3Episode] Episode directory files: ${episodeDirectoryEntries.map(e => e.name).join(', ')}`);
    postImageFile = episodeDirectoryEntries.map(e => e.name).find(name => name.startsWith('post')
      && (name.endsWith('.webp') || name.endsWith('.jpeg') || name.endsWith('.jpg') || name.endsWith('.png')));
  } catch (error) {
    console.error('');
    console.error('');
    console.error('Failed to get files in episode directory', error);
    throw ApplicationError({ title: 'Error does not exist', error }, 'DIRECTORY_NOT_FOUND');
  }
  if (!postImageFile) {
    throw Error(`No post image (post.png) file is present in the completed directory. Found files ${filesFromDirectory.join(', ')}`);
  }
  const postImageFilePath = path.join(episodeDirectory, postImageFile);
  console.log(`[ensureS3Episode] Post image: ${postImageFilePath}`);
  await fs.copy(postImageFilePath, path.join(completeDirectory, postImageFile));
  console.log(`[ensureS3Episode] Uploading post images to S3...`);
  await savePostImagesToS3(episodeNumber, postImageFilePath);
  console.log(`[ensureS3Episode] Post images uploaded.`);

  // Run ffmpeg to extract audio
  let audioFilePath;
  const audioFile = filesFromDirectory.find(f => f.endsWith('mp3'));
  if (audioFile) {
    audioFilePath = path.join(completeDirectory, audioFile);
    console.log(`[ensureS3Episode] Using existing audio file: ${audioFilePath}`);
  } else {
    audioFilePath = path.join(completeDirectory, 'episode.mp3');
    console.log('Audio MP3 not found, generating');
    const command = `ffmpeg -i "${actualVideoPath}" -q:a 0 -map a "${audioFilePath}"`;
    const { stdout, stderr } = await execAsync(command);
    console.log('FFmpeg Output:', stdout, stderr);
  }

  console.log(`[ensureS3Episode] Uploading transcripts...`);
  await Promise.all(transcriptFileNames.map(async transcriptFileName => {
    const extension = transcriptFileName.split('.').slice(-1)[0];
    console.log(`[ensureS3Episode] Processing transcript: ${transcriptFileName} (${extension})`);

    let transcriptBuffer;
    try {
      transcriptBuffer = Buffer.concat(await fs.createReadStream(path.join(completeDirectory, transcriptFileName)).toArray());
    } catch (error) {
      console.error(`[GetEpisodesFromDirectory] Could not find transcripts for episode`);
      throw error;
    }

    const transcriptParams = {
      Bucket: UPLOAD_BUCKET,
      Key: `storage/episodes/${episodeNumber}/transcript.${extension}`,
      Body: transcriptBuffer,
      ContentType: contentTypeMap[extension] || 'text/plain',
      CacheControl: `public, max-age=864000`
    };
    console.log(`[ensureS3Episode] Uploading transcript to: ${transcriptParams.Key}`);
    await s3Client.send(new PutObjectCommand(transcriptParams));

  }));
  console.log(`[ensureS3Episode] Transcripts uploaded.`);

  const audioFileS3Key = `storage/episodes/${episodeNumber}/episode.mp3`;
  console.log(`[ensureS3Episode] Checking if audio already exists in S3: ${audioFileS3Key}`);
  const checkAudioFileCommand = {
    Bucket: UPLOAD_BUCKET,
    Key: audioFileS3Key
  };
  try {
    await s3Client.send(new HeadObjectCommand(checkAudioFileCommand));
    console.log(`[ensureS3Episode] Audio already exists in S3, skipping upload.`);
  } catch (error) {
    if (error.message !== 'NotFound') {
      throw error;
    }

    console.log(`[ensureS3Episode] Audio not found in S3, uploading from: ${audioFilePath}`);
    let audioBuffer;
    try {
      audioBuffer = Buffer.concat(await fs.createReadStream(audioFilePath).toArray());
    } catch (uploadError) {
      console.error(`[EnsureS3Episode] Failed to upload audio for episode`, uploadError);
      throw uploadError;
    }

    const audioParams = {
      Bucket: UPLOAD_BUCKET,
      Key: audioFileS3Key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
      CacheControl: `public, max-age=864000`

    };
    await s3Client.send(new PutObjectCommand(audioParams));
    console.log(`[ensureS3Episode] Audio uploaded.`);
  }

  /** ** VIDEO UPLOAD ********/
  const videoFileS3Key = `storage/episodes/${episodeNumber}/episode.mkv`;
  console.log(`[ensureS3Episode] Checking if video already exists in S3: ${videoFileS3Key}`);
  const checkVideoFileCommand = {
    Bucket: UPLOAD_BUCKET,
    Key: videoFileS3Key
  };
  try {
    await s3Client.send(new HeadObjectCommand(checkVideoFileCommand));
    console.log(`[ensureS3Episode] Video already exists in S3, skipping upload.`);
  } catch (error) {
    if (error.message !== 'NotFound') {
      throw error;
    }

    console.log(`[ensureS3Episode] Video not found in S3, uploading from: ${actualVideoPath}`);
    let videoBuffer;
    try {
      videoBuffer = Buffer.concat(await fs.createReadStream(actualVideoPath).toArray());
    } catch (uploadError) {
      console.error(`[EnsureS3Episode] Could not upload video for episode`, uploadError);
      throw uploadError;
    }

    const videoParams = {
      Bucket: UPLOAD_BUCKET,
      Key: videoFileS3Key,
      Body: videoBuffer,
      ContentType: 'video/matroska',
      CacheControl: `public, max-age=864000`
    };
    await s3Client.send(new PutObjectCommand(videoParams));
    console.log(`[ensureS3Episode] Video uploaded.`);
  }
  /** *********/

  const googleDriveLocation = 'https://drive.google.com/drive/folders/1o-hrzPQIwNmjeukmKfg9bSyoolneJkzD';
  console.log('**** Success, now upload the raw video to the google drive location *****', googleDriveLocation);
}

async function buildFeedImage(inputPath) {
  const size = 3000;
  const blurredBg = await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .blur(40)
    .toBuffer();

  const foreground = await sharp(inputPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp(blurredBg)
    .composite([{ input: foreground, gravity: 'center' }])
    .withMetadata({ density: 72 })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function savePostImagesToS3(episodeNumber, originalPostImageFilePath) {
  const ext = path.extname(originalPostImageFilePath).toLowerCase();
  const baseName = path.basename(originalPostImageFilePath, ext);

  const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), `temp-directory-for-uploads-${Date.now()}`);
  await fs.ensureDir(TEMP_UPLOAD_DIR);

  const images = [originalPostImageFilePath];

  if (ext !== '.webp') {
    const webpDest = path.join(TEMP_UPLOAD_DIR, `${baseName}.webp`);
    await sharp(originalPostImageFilePath)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpDest);
    images.push(webpDest);
  }

  const feedImageBuffer = await buildFeedImage(originalPostImageFilePath);
  const feedImagePath = path.join(TEMP_UPLOAD_DIR, 'feed.jpg');
  await fs.writeFile(feedImagePath, feedImageBuffer);
  images.push(feedImagePath);

  await Promise.all(images.map(async imageFilePath => {
    const imageBuffer = Buffer.concat(await fs.createReadStream(imageFilePath).toArray());
    await s3Client.send(new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: `storage/episodes/${episodeNumber}/${path.basename(imageFilePath)}`,
      Body: imageBuffer,
      ContentType: contentTypeMap[path.extname(imageFilePath).substring(1)],
      CacheControl: `public, max-age=864000`
    }));
  }));
}

async function getAudioBlobFromEpisode(episode) {
  const audioFileS3Key = `storage/episodes/${episode.episodeNumber}/episode.mp3`;
  const checkAudioFileCommand = {
    Bucket: UPLOAD_BUCKET,
    Key: audioFileS3Key
  };

  try {
    const audioFileFromS3 = await s3Client.send(new GetObjectCommand(checkAudioFileCommand));
    const arrayBuffer = Buffer.concat(await audioFileFromS3.Body.toArray());
    const audioBlob = new Blob([arrayBuffer], { type: audioFileFromS3.ContentType });
    return audioBlob;
  } catch (error) {
    console.error('');
    console.error('');
    console.error(`Failed to fetch audio file from S3 to sync to Spreaker: ${audioFileS3Key}`, error);
    throw error;
  }
}

async function getLocalRssData() {
  const localRssData = await fs.readFile(path.join(__dirname, '../base-rss.xml'));
  const localXmlObject = await parseXml(localRssData, { explicitArray: false });
  return localXmlObject;
}

module.exports.getEpisodesFromDirectory = getEpisodesFromDirectory;
module.exports.ensureS3Episode = ensureS3Episode;
module.exports.savePostImagesToS3 = savePostImagesToS3;
module.exports.getAudioBlobFromEpisode = getAudioBlobFromEpisode;
module.exports.getLocalRssData = getLocalRssData;
