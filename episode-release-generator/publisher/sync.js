// spreakerSyncService.js

const fs = require('fs/promises');
const path from 'path';
const yaml = require('js-yaml');
const axios = require('axios');
const { DateTime, Duration } = require('luxon');
const { distance as levenshtein } = require('fastest-levenshtein');
const { AuthressClient } = require('@authress/sdk');
const githubAction = require('@actions/core');

/**
 * Calculates the Levenshtein distance-based similarity percentage between two strings.
 * @param {string} s1 - First string.
 * @param {string} s2 - Second string.
 * @returns {number} Similarity percentage (0-100).
 */
function calculateSimilarityPercentage(s1, s2) {
    if (!s1 || !s2) return 0;
    const longer = Math.max(s1.length, s2.length);
    if (longer === 0) return 100; // Both are empty strings, considered 100% similar
    const distance = levenshtein(s1.toLowerCase(), s2.toLowerCase()); // Case-insensitive comparison
    return ((longer - distance) / longer) * 100;
}

/**
 * Checks if two Luxon DateTime objects are within a specified number of days of each other.
 * Time components are ignored; only the date part is compared.
 * @param {DateTime} luxonDate1 - First date.
 * @param {DateTime} luxonDate2 - Second date.
 * @returns {boolean} True if dates are within tolerance, false otherwise.
 */
function isDateWithinDays(luxonDate1, luxonDate2) {
    // Set to start of day to compare only dates, ignoring time
    const d1 = luxonDate1.startOf('day');
    const d2 = luxonDate2.startOf('day');
    const diff = d1.diff(d2, 'days').days;
    return Math.abs(diff) <= 2;
}

/**
 * Parses the YAML frontmatter from a Markdown string.
 * @param {string} mdContent - The full Markdown content.
 * @returns {object} An object containing 'frontmatter' (parsed YAML) and 'content' (remaining Markdown).
 * @throws {Error} If YAML frontmatter parsing fails.
 */
async function parseMarkdownFrontmatter(mdContent) {
    const frontmatterMatch = mdContent.match(/^---\s*\n(.*)\n---\s*\n(.*)/s);
    if (!frontmatterMatch) {
        // If no frontmatter, treat entire content as raw markdown with empty frontmatter
        return { frontmatter: {}, content: mdContent.trim() };
    }
    const frontmatterStr = frontmatterMatch[1];
    const content = frontmatterMatch[2].trim();
    try {
        const frontmatter = yaml.load(frontmatterStr);
        return { frontmatter, content };
    } catch (e) {
        throw new Error(`Failed to parse YAML frontmatter: ${e.message}`);
    }
}

/**
 * Cleans Markdown content for Spreaker description field.
 * Strips HTML/JSX, images, and preserves only valid Markdown text and links.
 * @param {string} markdownContent - The raw Markdown content.
 * @returns {string} Cleaned content suitable for Spreaker.
 */
function cleanDescriptionForSpreaker(markdownContent) {
    let cleanedContent = markdownContent;

    // 1. Remove MDX/JSX import statements
    cleanedContent = cleanedContent.replace(/^import .* from '.*?'(?:;|\n)/gm, '');

    // 2. Remove all HTML/JSX components and their content (e.g., <GuestCallout ... />, <div>...</div>)
    // This regex targets any HTML-like tags, including custom JSX ones.
    // It's a robust attempt to remove all tags and their contents.
    cleanedContent = cleanedContent.replace(/<[^>]*>.*?<\/[^>]*>/gs, ''); // Paired tags with content
    cleanedContent = cleanedContent.replace(/<[^>]*?\/>/g, ''); // Self-closing tags

    // 3. Remove Markdown image syntax (e.g., ![alt text](./path/to/image.jpeg))
    // As per user request: only valid markdown *text* and links, not images rendered via HTML.
    cleanedContent = cleanedContent.replace(/!\[.*?\]\(.*?\)/g, '');

    // 4. Preserve Markdown link syntax [text](url). No conversion to HTML <a>.
    // This step is implicitly handled as the HTML stripping removed any <a> tags.
    // The original markdown links [text](url) should remain untouched by the above regex.

    // 5. Remove any remaining HTML comments
    cleanedContent = cleanedContent.replace(//gs, '');

    // 6. Reduce multiple blank lines to at most two newlines
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    return cleanedContent.trim();
}

let cachedAccessToken = null;
async function getAccessToken() {
    if (cachedAccessToken) {
        return cachedAccessToken;
    }
    const token = await githubAction.getIDToken('https://api.authress.io');
    const authressClient = new AuthressClient({ authressApiUrl: 'https://login.adventuresindevops.com' }, () => token);
    const credentialsResult = await authressClient.connections.getConnectionCredentials('con_oggz69yXV6cfTGQHS4BTAc', 'u5byrPns7wSpncwXPwKHxEh6f');
    
    cachedAccessToken = credentialsResult.data.accessToken;
    return cachedAccessToken;
}

/**
 * Fetches the last 10 episodes for a given Spreaker show.
 * @param {string} showId - The Spreaker show ID.
 * @returns {Array<object>} An array of Spreaker episode objects.
 * @throws {Error} If the API request fails.
 */
async function getSpreakerEpisodes(showId) {
    const accessToken = await getAccessToken();
    const url = `https://api.spreaker.com/v2/shows/${showId}/episodes`;
    const headers = { "Authorization": `Bearer ${accessToken}` };
    const params = { limit: 10, order: "desc" };

    try {
        const response = await axios.get(url, { headers, params });
        if (response.data && response.data.response && Array.isArray(response.data.response.items)) {
            return response.data.response.items;
        }
        return [];
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`Failed to fetch Spreaker episodes (Status: ${error.response?.status}): ${errorMessage}`);
    }
}

/**
 * Creates a new episode on Spreaker.
 * @param {string} showId - The Spreaker show ID.
 * @param {string} title - The episode title.
 * @param {string} description - The episode description.
 * @param {string} scheduledAtDateStr - The scheduled publication date in 'YYYY-MM-DD' format.
 * @returns {object|null} The created episode object from Spreaker, or null on failure.
 * @throws {Error} If the API request fails.
 */
async function createSpreakerEpisode(showId, title, description, scheduledAtDateStr) {
    const accessToken = await getAccessToken();
    const url = "https://api.spreaker.com/v2/episodes";
    const headers = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // Spreaker API requires scheduled_at in ISO 8601 format, including time and timezone.
    // We set it to midnight UTC on the specified date for consistency.
    // Ref: https://developers.spreaker.com/api/api-v2.html#object-episode -> 'scheduled_at' field
    const scheduledDatetimeUtc = DateTime.fromISO(scheduledAtDateStr, { zone: 'utc' }).startOf('day').toISO();

    const payload = {
        show_id: showId,
        title: title,
        description: description,
        scheduled_at: scheduledDatetimeUtc,
        status: "published" // Ref: https://developers.spreaker.com/api/api-v2.html#object-episode -> 'status' field
    };

    return;

    try {
        const response = await axios.post(url, payload, { headers });
        if (response.data?.response.episode) {
            console.log(`SUCCESS: Created episode '${response.data.response.episode.title}' (ID: ${response.data.response.episode.episode_id})`);
            return response.data.response.episode;
        }
        throw new Error(`Failed to create Spreaker episode (Status: ${response.status}): ${response.data}`);
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`Failed to create Spreaker episode (Status: ${error.response?.status}): ${errorMessage}`);
    }
}

/**
 * Reads content from all 'index.md' files found in subdirectories of baseDir.
 * Assumes Docusaurus structure where each episode is a subdirectory with index.md.
 * @param {string} baseDir - The base directory for Docusaurus episodes.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of Markdown file contents.
 * @throws {Error} If the base directory cannot be read.
 */
async function getMarkdownContentsFromDirectory(baseDir) {
    const allMdContents = [];
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const indexPath = path.join(baseDir, entry.name, 'index.md');
                const mdContent = await fs.readFile(indexPath, 'utf-8');
                allMdContents.push(mdContent);
                console.log(`READ: ${indexPath}`);
            }
        }
    } catch (dirError) {
        throw new Error(`Failed to read directory '${baseDir}': ${dirError.message}`);
    }
    return allMdContents;
}

/**
 * Main function to sync Docusaurus Markdown podcast episodes with Spreaker.
 * This function is idempotent: it will not create duplicate episodes based on fuzzy matching.
 * @param {string} showId - The Spreaker show ID.
 * @param {string} docusaurusEpisodesBaseDir - Path to your Docusaurus episodes directory.
 * @returns {Promise<void>} A promise that resolves when the synchronization is complete.
 * @throws {Error} For any critical errors like missing parameters, invalid configuration, or API failures.
 */
export async function syncSpreakerEpisodes(showId, docusaurusEpisodesBaseDir) {
    // Validate input parameters
    if (!showId) throw new Error("Parameter 'showId' is required.");
    if (!docusaurusEpisodesBaseDir) throw new Error("Parameter 'docusaurusEpisodesBaseDir' is required.");

    const markdownContents = await getMarkdownContentsFromDirectory(docusaurusEpisodesBaseDir);

    if (markdownContents.length === 0) {
        console.log("No Markdown files found to process. Exiting.");
        return;
    }

    console.log(`FETCHING EXISTING EPISODES from Spreaker show ID: ${showId}...`);
    const existingSpreakerEpisodes = await getSpreakerEpisodes(showId);
    console.log(`Found ${existingSpreakerEpisodes.length} existing Spreaker episodes.`);

    const newEpisodesToProcess = [];

    for (const mdContent of markdownContents) {
        const { frontmatter, content: rawContent } = await parseMarkdownFrontmatter(mdContent);
        const mdTitle = frontmatter.title;
        const mdDateStr = frontmatter.date;
        const mdDescriptionShort = frontmatter.description || '';

        if (!mdTitle || !mdDateStr) {
            console.warn(`WARNING: Skipping Markdown content due to missing 'title' or 'date' in its frontmatter.`);
            throw new Error(`Invalid episode info ${mdTitle}`);
        }

        let mdPublishDate;
        try {
            mdPublishDate = DateTime.fromISO(mdDateStr, { zone: 'utc' });
            if (!mdPublishDate.isValid) {
                throw new Error(`Invalid date format for episode ${mdTitle} - '${mdDateStr}'. Expected YYYY-MM-DD.`);
            }
        } catch (e) {
            throw new Error(`Invalid date format for episode ${mdTitle} - '${mdDateStr}'. Expected YYYY-MM-DD.`);
        }

        const fullDescription = `${mdDescriptionShort}\n\n${cleanDescriptionForSpreaker(rawContent)}`;
        // Spreaker description max length is 4000 characters.
        // Ref: https://developers.spreaker.com/api/api-v2.html#object-episode -> 'description' field
        if (fullDescription.length > 4000) {
            console.warn(`WARNING: Description for '${mdTitle}' truncated to 4000 characters (${fullDescription.length} chars originally).`);
            fullDescription = fullDescription.substring(0, 3997) + "...";
        }

        let isEpisodeAlreadyOnSpreaker = false;
        for (const existingEp of existingSpreakerEpisodes) {
            const spreakerTitle = existingEp.title;
            // Spreaker API provides 'published_at' as ISO 8601 string.
            // Ref: https://developers.spreaker.com/api/api-v2.html#object-episode -> 'published_at' field
            const spreakerDate = DateTime.fromISO(existingEp.published_at, { zone: 'utc' });

            const titleSimilarity = calculateSimilarityPercentage(mdTitle, spreakerTitle);
            const dateMatches = isDateWithinDays(mdPublishDate, spreakerDate);

            if (titleSimilarity >= 90 && dateMatches) {
                console.log(`MATCH FOUND: Docusaurus episode '${mdTitle}' (date: ${mdDateStr}) matches Spreaker episode '${spreakerTitle}' (date: ${spreakerDate.toISODate()}) with ${titleSimilarity.toFixed(2)}% title similarity and date within 2 days.`);
                isEpisodeAlreadyOnSpreaker = true;
                break;
            }
        }

        if (!isEpisodeAlreadyOnSpreaker) {
            newEpisodesToProcess.push({
                title: mdTitle,
                description: fullDescription,
                date: mdDateStr
            });
        }
    }

    if (newEpisodesToProcess.length === 0) {
        console.log("\nNo new episodes to add to Spreaker.");
        return;
    }

    console.log(`\nFound ${newEpisodesToProcess.length} new episode(s) to add.`);
    for (const episodeData of newEpisodesToProcess) {
        await createSpreakerEpisode(
            showId,
            episodeData.title,
            episodeData.description,
            episodeData.date
        );
    }
}