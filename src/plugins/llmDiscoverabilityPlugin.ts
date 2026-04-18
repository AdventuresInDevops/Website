/* eslint-disable max-depth */
/* eslint-disable no-console */
import type { LoadContext, Plugin } from '@docusaurus/types';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// MDX Stripper
// ---------------------------------------------------------------------------

function stripMdxContent(raw: string): string {
  const lines = raw.split('\n');
  const output: string[] = [];
  let jsxDepth = 0;
  let jsxTagName = '';
  let inWrapper = false;
  let wrapperTag = '';
  let wrapperDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Phase A: inside a JSX block being fully skipped
    if (jsxDepth > 0) {
      const openRe = new RegExp(`<${jsxTagName}[\\s>/]`, 'g');
      const closeRe = new RegExp(`</${jsxTagName}>`, 'g');
      const selfCloseRe = new RegExp(`<${jsxTagName}[^>]*/>`, 'g');
      const selfClose = (trimmed.match(selfCloseRe) || []).length;
      const opens = Math.max(0, (trimmed.match(openRe) || []).length - selfClose);
      const closes = (trimmed.match(closeRe) || []).length;
      jsxDepth += opens - closes;
      if (jsxDepth < 0) { jsxDepth = 0; }
      continue;
    }

    // Phase B: inside a wrapper block — emit inner content (e.g. image-md, img-small)
    if (inWrapper) {
      const openRe = new RegExp(`<${wrapperTag}[\\s>/]`, 'g');
      const closeRe = new RegExp(`</${wrapperTag}>`, 'g');
      const selfCloseRe = new RegExp(`<${wrapperTag}[^>]*/>`, 'g');
      const selfClose = (trimmed.match(selfCloseRe) || []).length;
      const opens = Math.max(0, (trimmed.match(openRe) || []).length - selfClose);
      const closes = (trimmed.match(closeRe) || []).length;
      wrapperDepth += opens - closes;
      if (wrapperDepth <= 0) {
        inWrapper = false;
        continue; // skip the closing tag line
      }
      output.push(line);
      continue;
    }

    // Phase C: normal line processing
    if ((/^import\s/).test(trimmed)) {continue;}
    if ((/^export\s/).test(trimmed)) {continue;}
    if ((/^<!--\s*truncate/).test(trimmed)) {continue;}

    if (trimmed.startsWith('<')) {
      const tagMatch = trimmed.match(/^<([A-Za-z][A-Za-z0-9]*)/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const isComponent = (/^[A-Z]/).test(tag);
        const isStyledHtml
          = (tag === 'div' || tag === 'a' || tag === 'span')
          && (trimmed.includes('className=') || trimmed.includes('style='));

        if (isComponent || isStyledHtml) {
          // Wrapper block: strip the outer tag but keep inner markdown content
          // eslint-disable-next-line max-depth
          if (
            trimmed.includes('className="image-md"')
            || trimmed.includes("className='image-md'")
            || trimmed.includes('className="img-small"')
            || trimmed.includes("className='img-small'")
          ) {
            inWrapper = true;
            wrapperTag = tag;
            wrapperDepth = 1;
            continue;
          }

          if (trimmed.endsWith('/>')) {continue;}

          // Multi-line JSX block: track depth
          const openRe = new RegExp(`<${tag}[\\s>/]`, 'g');
          const closeRe = new RegExp(`</${tag}>`, 'g');
          const selfCloseRe = new RegExp(`<${tag}[^>]*/>`, 'g');
          const selfClose = (trimmed.match(selfCloseRe) || []).length;
          const opens = Math.max(0, (trimmed.match(openRe) || []).length - selfClose);
          const closes = (trimmed.match(closeRe) || []).length;
          jsxDepth = opens - closes;
          jsxTagName = tag;
          if (jsxDepth <= 0) {jsxDepth = 0;}
          continue;
        }
      }
    }

    output.push(line);
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------------------------------------------------------------------
// Transcript URL
// ---------------------------------------------------------------------------

function getTranscriptUrl(
  permalink: string,
  frontMatter: Record<string, unknown>
): string | null {
  const slug = permalink.split('/').slice(-1)[0];
  const episodeNumber = (frontMatter.episode_number as string | number | undefined)
    ?? slug.match(/^(\d+)-[^\d]/)?.[1];
  if (!episodeNumber) {return null;}
  return `https://links.adventuresindevops.com/storage/episodes/${episodeNumber}/transcript.txt`;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

let allBlogPosts: any[] = [];
let allPublicDocs: any[] = [];

function resolveSource(source: string, siteDir: string): string {
  if (source.startsWith('@site/')) {
    return path.join(siteDir, source.slice('@site/'.length));
  }
  return source;
}

export default function llmDiscoverabilityPlugin(context: LoadContext): Plugin {
  const { siteDir } = context;
  return {
    name: 'llmDiscoverabilityPlugin',

    allContentLoaded({ allContent }) {
      // Collect blog posts
      const blogPlugin = (allContent as any)['docusaurus-plugin-content-blog']?.default;
      allBlogPosts = blogPlugin?.blogPosts ?? [];

      // Collect public docs
      const docsPlugin = (allContent as any)['docusaurus-plugin-content-docs']?.default;
      const allDocs: any[] = docsPlugin?.loadedVersions?.[0]?.docs ?? [];
      allPublicDocs = allDocs.filter((doc: any) => {
        if (doc.unlisted === true) {return false;}
        const resolved = resolveSource(doc.source as string, siteDir);
        if (resolved.includes('private')) {return false;}
        return true;
      });
    },

    async postBuild({ outDir }) {
      console.log('[LLM Discoverability] Writing discoverability files...');
      await writeLlmsTxt(outDir, allBlogPosts, allPublicDocs);
      await writeEpisodeMarkdownFiles(outDir, allBlogPosts, siteDir);
      await writeDocMarkdownFiles(outDir, allPublicDocs, siteDir);
      console.log('[LLM Discoverability] Done.');
    }
  };
}

// ---------------------------------------------------------------------------
// File writers
// ---------------------------------------------------------------------------

const SITE_URL = 'https://adventuresindevops.com';

async function writeLlmsTxt(
  outDir: string,
  blogPosts: any[],
  publicDocs: any[]
): Promise<void> {
  const episodeLines = blogPosts
    .filter((post: any) => post.metadata.title && post.metadata.description)
    .flatMap((post: any) => {
      const { permalink, title, description, date, frontMatter } = post.metadata;
      const mdUrl = `${SITE_URL}${permalink}.md`;
      const dateStr = new Date(date as string | Date).toISOString().split('T')[0];
      const lines = [`- [${title}](${mdUrl}) — ${description} (${dateStr})`];
      const transcriptUrl = getTranscriptUrl(permalink, frontMatter ?? {});
      if (transcriptUrl) {
        lines.push(`  transcript: ${transcriptUrl}`);
      }
      return lines;
    });

  const content = `# Adventures in DevOps

Adventures in DevOps is a weekly technical podcast hosted by Warren Parad and Will Button, focused on real-world DevOps practice. Each episode is a practitioner-to-practitioner conversation — no fluff, no vendor pitches, just engineers and leaders sharing what they've actually built, broken, and learned. The show runs approximately 260+ episodes and releases weekly.

## What the Show Covers

**Core topics:**
- Kubernetes, containers, and cloud-native infrastructure
- Infrastructure as Code (Terraform, Pulumi, CloudFormation, OpenTofu)
- CI/CD pipelines, deployment automation, and release engineering
- Observability, SRE, and incident response at scale
- Cloud architecture on AWS, GCP, and Azure
- Security, Zero Trust, and DevSecOps
- AI and LLM adoption in engineering workflows
- Platform engineering and developer experience
- Engineering leadership, org design, and hiring

**Audience:** Senior engineers, SREs, architects, engineering managers, and CTOs who build and operate software systems in production. The conversations assume technical depth — guests go into implementation details, war stories, and specific tradeoffs.

**Format:** 45–60 minute recorded conversations. Each episode includes notable links and picks from hosts and guests. Machine-readable markdown for every episode is available by appending \`.md\` to the episode URL (e.g. ${SITE_URL}/episodes/263-llm-documentation-reliability-feature-flags.md). Transcripts are linked per episode below.

## Hosts

- **Warren Parad** — CTO of Authress, cloud security architect, AWS and OAuth/OIDC specialist. Contributor to the IETF OAuth Working Group. Speaker at FOSDEM, AWS Global Summit, Voxxed Days.
- **Will Button** — DevOps and platform engineering practitioner, Kubernetes specialist, engineering leader.

## Appear on the Show

We look for senior practitioners — principal engineers, architects, engineering managers, directors, and CTOs — with real experience and opinionated takes. Topics should be technical and practitioner-focused. No product pitches. Details: ${SITE_URL}/docs/guests/

## Sponsor the Show

Sponsorship starts at $780/episode or $620/episode for a 4-episode commitment. Audience is technical; pitches should be technical. Details: ${SITE_URL}/docs/sponsorship/

## Online Presence

- Website: ${SITE_URL}
- RSS Feed: ${SITE_URL}/rss.xml
- LinkedIn: https://www.linkedin.com/showcase/devops-podcast/about
- Bluesky: https://bsky.app/profile/adventuresindevops.bsky.social
- Discord: ${SITE_URL}/join
- GitHub: https://github.com/AdventuresInDevops

## Episodes

${episodeLines.join('\n')}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
- [RSS Feed](${SITE_URL}/rss.xml)
`;

  await fs.promises.writeFile(path.join(outDir, 'llms.txt'), content, 'utf-8');
  console.log(`[LLM Discoverability] Written llms.txt (${blogPosts.length} episodes, ${publicDocs.length} docs)`);
}

async function writeEpisodeMarkdownFiles(
  outDir: string,
  blogPosts: any[],
  siteDir: string
): Promise<void> {
  let written = 0;
  for (const post of blogPosts) {
    const { permalink, title, description, date, source, frontMatter } = post.metadata;
    const resolvedSource = resolveSource(source as string, siteDir);

    let rawContent: string;
    try {
      rawContent = await fs.promises.readFile(resolvedSource, 'utf-8');
    } catch (err: any) {
      console.warn(`[LLM Discoverability] Cannot read episode source for ${permalink}: ${err?.message}`);
      continue;
    }

    // Strip frontmatter
    const bodyRaw = rawContent.replace(/^---\n[\s\S]*?\n---\n/, '');
    const cleanBody = stripMdxContent(bodyRaw);

    const dateStr = new Date(date as string | Date).toISOString().split('T')[0];
    const canonicalUrl = `${SITE_URL}${permalink}`;
    const transcriptUrl = getTranscriptUrl(permalink, frontMatter ?? {});

    const transcriptLine = transcriptUrl
      ? `\n[Transcript](${transcriptUrl})\n`
      : '';

    const mdContent = `# ${title}

**Date:** ${dateStr}
**URL:** ${canonicalUrl}
**Description:** ${description}
${transcriptLine}
---

${cleanBody}
`;

    const mdFilePath = path.join(outDir, `${permalink}.md`);
    await fs.promises.mkdir(path.dirname(mdFilePath), { recursive: true });
    await fs.promises.writeFile(mdFilePath, mdContent, 'utf-8');
    written++;
  }
  console.log(`[LLM Discoverability] Written ${written} episode .md files`);
}

async function writeDocMarkdownFiles(outDir: string, publicDocs: any[], siteDir: string): Promise<void> {
  let written = 0;
  for (const doc of publicDocs) {
    const { permalink, title, description, source } = doc;
    const resolvedSource = resolveSource(source as string, siteDir);

    let rawContent: string;
    try {
      rawContent = await fs.promises.readFile(resolvedSource, 'utf-8');
    } catch (err: any) {
      console.warn(`[LLM Discoverability] Cannot read doc source for ${permalink}: ${err?.message}`);
      continue;
    }

    const bodyRaw = rawContent.replace(/^---\n[\s\S]*?\n---\n/, '');
    const cleanBody = stripMdxContent(bodyRaw);
    const canonicalUrl = `${SITE_URL}${permalink}`;

    const mdContent = `# ${title}

**URL:** ${canonicalUrl}
${description ? `**Description:** ${description}\n` : ''}
---

${cleanBody}
`;

    const mdFilePath = path.join(outDir, `${permalink}.md`);
    await fs.promises.mkdir(path.dirname(mdFilePath), { recursive: true });
    await fs.promises.writeFile(mdFilePath, mdContent, 'utf-8');
    written++;
  }
  console.log(`[LLM Discoverability] Written ${written} doc .md files`);
}
