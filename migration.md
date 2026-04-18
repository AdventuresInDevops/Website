# Episode Number Migration Plan

Consolidate episode numbers so every episode has a canonical, reliable source of truth in its frontmatter, and every asset in S3 lives in a predictable number-only directory.

## Context

Right now episode numbers come from three different places depending on the episode:

| Episode type | Directory name | Episode number source |
|---|---|---|
| Numbered (recent) | `269-infrastructure-as-code-...` | Parsed from directory name prefix |
| Date-prefixed (older) | `2025-01-21-qa-testing-strategies-...` | Looked up at runtime from RSS feed |
| Archive | `0-archive/mcp-servers-and-agent-interactions` | Looked up at runtime from RSS feed |

This forces every consumer (`BlogPostItem/Content`, `llmDiscoverabilityPlugin`, `podcastS3Storage`) to implement its own episode number resolution logic. S3 assets for older episodes live at `/${episodeNumber}-${slug}/` paths; new episodes upload to both `/${episodeNumber}/` and `/${episodeNumber}-${slug}/` (see `ensureS3Episode` lines 325–339).

The goal is to make `episode_number` in frontmatter the single source of truth, and `/${episodeNumber}/` the only S3 directory that matters.

---

## Step 1 — Validate and back-populate `episode_number` in all episode frontmatter

**Write an idempotent validation script** (`release-generator/scripts/backfillEpisodeNumbers.js`) that can be run repeatedly — on first run it populates missing values; on subsequent runs it validates correctness. The same script acts as both backfill and ongoing sanity check.

### Build the RSS lookup

```js
// slug → episodeNumber (string)
// slug = last path segment of the <link> URL
const slugToNumber = items.reduce((acc, item) => {
  const slug = item.link.split('/').slice(-1)[0];
  acc[slug] = item['itunes:episode'];
  return acc;
}, {});
```

Source: `release-generator/base-rss.xml` via `getLocalRssData()` from `sync.js`.

### Per-directory logic (run for ALL episode directories)

For every directory in `episodes/` and `episodes/0-archive/`, regardless of name format:

1. Derive the **expected episode number**:
   - If directory matches `/^\d{3,}-/`: extract the numeric prefix → `expectedNumber`.
   - Else: strip leading date prefix (`/^\d{4}-\d{2}-\d{2}-(.+)$/`) to get slug, look up in `slugToNumber` → `expectedNumber`. If not found in RSS: **FAIL** (throw, do not continue).

2. Read `index.md` and parse frontmatter.

3. **If `episode_number` is already in frontmatter:**
   - Compare to `expectedNumber`.
   - If they match: log `[ok] NNN slug` and skip.
   - If they differ: **FAIL** with a clear message — do not silently overwrite.

4. **If `episode_number` is missing from frontmatter:**
   - Inject `episode_number: NNN` into the frontmatter block (after the `date:` field, or appended before the closing `---`).
   - Write the file back.
   - Log `[added] NNN slug`.

5. Log a final summary: counts of `[ok]`, `[added]`, and any failures.

This means the script is safe to re-run after adding new episodes, and doubles as CI validation that no episode is missing a number or has a mismatched one.

---

## Step 2 — Make frontmatter the source of truth in source code

After step 1, all date-prefixed and archive episodes have `episode_number:` in frontmatter. Update consumers in this order:

### `src/theme/BlogPostItem/Content/index.tsx`

Current logic (lines 28–36):
```ts
const episodeNumber = episodeStorageData[episodeSlug]?.episodeNumber || rssFeedStorageData[episodeSlug]?.episodeNumber;
const episodeNumberFromSlug = episodeSlug.match(/^(\d+)-[^\d]/)?.[1];

if (episodeNumberFromSlug) {
  transcriptLinkUrl = `.../${episodeSlug}/transcript.txt`;  // old path
} else if (episodeNumber) {
  transcriptLinkUrl = `.../${episodeNumber}-${episodeSlug}/transcript.txt`;  // old path
}
```

Replace with:
```ts
const episodeNumber =
  blogPost.frontMatter.episode_number           // set by backfill script (date-prefixed episodes)
  ?? episodeSlug.match(/^(\d+)-[^\d]/)?.[1];    // prefix for numbered episodes

if (episodeNumber) {
  transcriptLinkUrl = `https://links.adventuresindevops.com/storage/episodes/${episodeNumber}/transcript.txt`;
}
```

This eliminates the dependency on `podcastS3Storage` global data for transcript URL construction.

### `src/plugins/llmDiscoverabilityPlugin.ts`

Current `getTranscriptUrl()` fetches RSS at build time to resolve episode numbers. After step 1, episode numbers are in frontmatter:

```ts
function getTranscriptUrl(permalink: string, frontMatter: Record<string, unknown>): string | null {
  const slug = permalink.split('/').slice(-1)[0];
  const episodeNumber =
    (frontMatter.episode_number as string | number | undefined)
    ?? slug.match(/^(\d+)-[^\d]/)?.[1];
  if (!episodeNumber) return null;
  return `https://links.adventuresindevops.com/storage/episodes/${episodeNumber}/transcript.txt`;
}
```

Remove the RSS fetch from `allContentLoaded` entirely — it was only needed for episode number resolution.

Pass `post.metadata.frontMatter` into `getTranscriptUrl` from both `writeLlmsTxt` and `writeEpisodeMarkdownFiles`.

### `src/plugins/podcastS3Storage.ts`

Currently builds `episodeStorageData` (S3 slug → episodeNumber) and `rssFeedStorageData` (slug → episodeNumber from RSS) specifically so `BlogPostItem/Content` can look up episode numbers. Once step 2a is done, neither map is needed for transcript URLs.

Evaluate whether `episodeStorageData` / `rssFeedStorageData` are used anywhere else. If the only consumer was transcript URL construction: **delete the plugin entirely** or reduce it to only what is still needed.

---

## Step 3 — S3 migration: copy assets to number-only directories

**Write a script** (e.g. `release-generator/scripts/migrateS3ToNumberDirectories.js`) that:

1. Calls `getCurrentlySyncedS3EpisodeSlugs()` to list all directories under `storage/episodes/`.

2. Filters for directories that match `/^\d+-[a-z]/` (have a slug suffix — these are the old-style paths).

3. For each old directory `${episodeNumber}-${slug}`:
   - Extract `episodeNumber` from the prefix.
   - List all objects under `storage/episodes/${episodeNumber}-${slug}/`.
   - For each object, check if `storage/episodes/${episodeNumber}/${filename}` already exists (use `HeadObjectCommand`).
   - If it does not exist: copy it (`CopyObjectCommand` with `CopySource`).
   - If it already exists: log "already exists, skipping".
   - **Do not delete or move** anything.

4. Log a full summary of what was copied vs skipped.

Files to copy per directory: `transcript.txt`, `transcript.srt`, `episode.mp3`, `episode.mkv`, `post.webp`, `post.jpg`, `post.png` — or just list all objects rather than hardcoding extensions.

**Note:** `ensureS3Episode` (lines 325–339) already uploads transcripts to both paths for new episodes. `savePostImagesToS3` already uses number-only paths for images. Audio and video uploads still use the slug-based path (lines 343, 379) — covered in step 4.

---

## Step 4 — Update publishing/sync code to use number-only S3 paths

After step 3 is verified (all historical assets exist at number-only paths), update `release-generator/publisher/sync.js`:

### `ensureS3Episode` — remove the duplicate slug-path write

Delete lines 333–339 (the second `PutObjectCommand` that writes to `storage/episodes/${episodeSlug}/transcript.${extension}`). Keep only the number-only write.

### `ensureS3Episode` — update audio path (line 343)

```js
// Before:
const audioFileS3Key = `storage/episodes/${episodeSlug}/episode.mp3`;
// After:
const audioFileS3Key = `storage/episodes/${episodeNumber}/episode.mp3`;
```

### `ensureS3Episode` — update video path (line 379)

```js
// Before:
const videoFileS3Key = `storage/episodes/${episodeSlug}/episode.mkv`;
// After:
const videoFileS3Key = `storage/episodes/${episodeNumber}/episode.mkv`;
```

### `getAudioBlobFromEpisode` — update fetch path (line 450)

```js
// Before:
const audioFileS3Key = `storage/episodes/${episode.episodeNumber}-${episode.slug}/episode.mp3`;
// After:
const audioFileS3Key = `storage/episodes/${episode.episodeNumber}/episode.mp3`;
```

This function is called from `spreaker.js` — verify `episode.episodeNumber` is still populated correctly after step 2.

---

## Sequencing and rollback

Do these steps in order. Each step is independently safe:

1. **Step 1** (frontmatter backfill) — purely additive to source files, no runtime impact. Can be re-run safely.
2. **Step 2** (code changes) — deploys cleanly alongside old data since frontmatter fallback still reads the prefix for numbered episodes.
3. **Step 3** (S3 copy) — read + copy only, original files untouched. Can be re-run safely (idempotent via `HeadObject` check).
4. **Step 4** (publishing cleanup) — after verifying step 3 is complete. Old slug-based S3 directories can be deleted in a separate future cleanup pass once confirmed unused.
5. **Step 5** Update the base rss, to move all the current transcripts that depend on the location using a slug to one using the episode number only.
6. **Step 6** Validate that all episodes have transcript in S3 using the episode number, and then update ALL episodes in RSS to use the ones found in S3. Some episodes have a vtt as well, so if we have that we should include that one. It probably requires a full read of S3, to get the list of all transcript files we can find in the episode number object prefix locations.
