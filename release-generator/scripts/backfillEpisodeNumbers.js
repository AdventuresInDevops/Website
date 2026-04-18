/* eslint-disable no-console */

const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const yaml = require('js-yaml');
const { parseStringPromise: parseXml } = require('xml2js');

const episodesDir = path.resolve(__dirname, '../../episodes');
const archiveDir = path.join(episodesDir, '0-archive');

async function fetchRssSlugToNumber() {
  const response = await fetch('https://adventuresindevops.com/episodes/rss.xml');
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  const parsed = await parseXml(xml, { explicitArray: false });
  const items = [parsed.rss.channel.item].flat();

  return items.reduce((acc, item) => {
    const slug = item.link.split('/').filter(Boolean).slice(-1)[0];
    if (item['itunes:episode']) {
      acc[slug] = String(item['itunes:episode']);
    }
    return acc;
  }, {});
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw Error('NO FRONTMATTER');
  }
  return {
    frontmatter: yaml.load(match[1]),
    hasFrontmatter: true,
    fmEndIndex: match.index + match[0].length
  };
}

function injectEpisodeNumber(content, episodeNumber) {
  const lines = content.split('\n');
  // Find closing --- (second occurrence of ---)
  const closingIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  const dateIdx = lines.findIndex(l => l.startsWith('date:'));
  const insertAt = dateIdx !== -1 ? dateIdx + 1 : closingIdx;
  lines.splice(insertAt, 0, `episode_number: ${episodeNumber}`);
  return lines.join('\n');
}

function deriveExpectedNumber(dirName, slugToNumber) {
  // Date-prefixed must come first: 2025-01-21-qa-testing-strategies-...
  // (4-digit year would otherwise match the \d{3,} numbered-prefix rule)
  const dateMatch = dirName.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  if (dateMatch) {
    const slug = dateMatch[1];
    const episodeNumber = slugToNumber[slug];
    if (!episodeNumber) {
      throw new Error(`[FAIL] Cannot resolve episode number for dir: ${dirName} (slug: ${slug} not found in RSS)`);
    }
    return episodeNumber;
  }

  // Numbered prefix: 269-some-slug or 230-ai-powered-advertising
  const numberedMatch = dirName.match(/^(\d{3,})-/);
  if (numberedMatch) {
    return numberedMatch[1];
  }

  // Plain archive slug: mcp-servers-and-agent-interactions
  const episodeNumber = slugToNumber[dirName];
  if (!episodeNumber) {
    throw new Error(`[FAIL] Cannot resolve episode number for dir: ${dirName} (slug: ${dirName} not found in RSS)`);
  }
  return episodeNumber;
}

async function processEpisode(dirName, archivePrefix, slugToNumber, counts) {
  const fullDirPath = path.join(archivePrefix ? archiveDir : episodesDir, dirName);
  const indexPath = path.join(fullDirPath, 'index.md');

  let content;
  try {
    content = await fsPromises.readFile(indexPath, 'utf8');
  } catch {
    // No index.md — skip silently
    return;
  }

  const { frontmatter, hasFrontmatter } = parseFrontmatter(content);
  if (!hasFrontmatter) {
    console.warn(`[warn] No frontmatter in ${dirName}/index.md — skipping`);
    return;
  }

  if (frontmatter.episode === false) {
    console.log(`[skip] ${dirName} (episode: false)`);
    return;
  }

  const expectedNumber = deriveExpectedNumber(dirName, slugToNumber);
  const existingNumber = frontmatter.episode_number != null ? String(frontmatter.episode_number) : null;

  if (existingNumber !== null) {
    if (existingNumber === expectedNumber) {
      console.log(`[ok] ${expectedNumber} ${dirName}`);
      counts.ok++;
    } else {
      throw new Error(`[FAIL] Mismatch in ${dirName}: frontmatter has episode_number=${existingNumber}, expected ${expectedNumber}`);
    }
    return;
  }

  const updated = injectEpisodeNumber(content, expectedNumber);
  await fsPromises.writeFile(indexPath, updated, 'utf8');
  console.log(`[added] ${expectedNumber} ${dirName}`);
  counts.added++;
}

async function collectLocalEpisodeNumbers() {
  const result = new Map(); // episodeNumber → [dirName, ...]

  const addEntry = async (dirName, isArchive) => {
    const fullDirPath = path.join(isArchive ? archiveDir : episodesDir, dirName);
    const indexPath = path.join(fullDirPath, 'index.md');
    let content;
    try {
      content = await fsPromises.readFile(indexPath, 'utf8');
    } catch {
      return;
    }
    const { frontmatter, hasFrontmatter } = parseFrontmatter(content);
    if (!hasFrontmatter) { return; }
    if (frontmatter.episode === false) { return; }

    let num = null;
    if (frontmatter.episode_number != null) {
      num = String(frontmatter.episode_number);
    } else {
      const m = dirName.match(/^(\d{3,})-/);
      if (m) num = m[1];
    }
    if (!num) return;

    if (!result.has(num)) result.set(num, []);
    result.get(num).push((isArchive ? '0-archive/' : '') + dirName);
  };

  const [mainEntries, archiveEntries] = await Promise.all([
    fsPromises.readdir(episodesDir, { withFileTypes: true }),
    fsPromises.readdir(archiveDir, { withFileTypes: true })
  ]);

  await Promise.all([
    ...mainEntries.filter(e => e.isDirectory() && e.name !== '0-archive').map(e => addEntry(e.name, false)),
    ...archiveEntries.filter(e => e.isDirectory()).map(e => addEntry(e.name, true))
  ]);

  return result;
}

async function verifyAgainstRss(slugToNumber, localNumbers) {
  let failed = false;

  // Check for duplicates locally
  for (const [num, dirs] of localNumbers) {
    if (dirs.length > 1) {
      console.error(`[verify-fail] Duplicate episode_number ${num} found in: ${dirs.join(', ')}`);
      failed = true;
    }
  }

  // RSS numbers not found locally (old episodes may not be in the repo)
  const rssNumbers = new Set(Object.values(slugToNumber));
  for (const rssNum of rssNumbers) {
    if (!localNumbers.has(rssNum)) {
      console.warn(`[verify-warn] RSS episode ${rssNum} has no matching local episode (may be archived)`);
    }
  }

  // Local numbers not in RSS
  for (const [localNum] of localNumbers) {
    if (!rssNumbers.has(localNum)) {
      console.warn(`[verify-warn] Local episode ${localNum} not found in published RSS (may be unreleased)`);
    }
  }

  // Print full sorted list
  const sorted = [...localNumbers.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  console.log('\n[all episodes]');
  for (const [num, dirs] of sorted) {
    console.log(`  ${num.padStart(4)} — ${dirs.join(', ')}`);
  }

  if (!failed) {
    console.log(`\n[verify] All ${localNumbers.size} local episode numbers checked. No duplicates.`);
  }
  return !failed;
}

async function main() {
  console.log('Fetching published RSS feed...');
  const slugToNumber = await fetchRssSlugToNumber();
  console.log(`RSS feed loaded: ${Object.keys(slugToNumber).length} entries\n`);

  const [mainEntries, archiveEntries] = await Promise.all([
    fsPromises.readdir(episodesDir, { withFileTypes: true }),
    fsPromises.readdir(archiveDir, { withFileTypes: true })
  ]);

  const counts = { ok: 0, added: 0 };
  const errors = [];

  const processAll = [
    ...mainEntries.filter(e => e.isDirectory() && e.name !== '0-archive').map(e =>
      processEpisode(e.name, false, slugToNumber, counts).catch(err => errors.push(err.message))
    ),
    ...archiveEntries.filter(e => e.isDirectory()).map(e =>
      processEpisode(e.name, true, slugToNumber, counts).catch(err => errors.push(err.message))
    )
  ];
  await Promise.all(processAll);

  if (errors.length) {
    console.error('\nErrors encountered:');
    errors.forEach(e => console.error(' ', e));
  }

  console.log(`\n[summary] ok: ${counts.ok}, added: ${counts.added}, failed: ${errors.length}`);

  // Verification pass
  console.log('\nRunning verification pass...');
  const localNumbers = await collectLocalEpisodeNumbers();
  const verifyOk = await verifyAgainstRss(slugToNumber, localNumbers);

  if (errors.length || !verifyOk) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
