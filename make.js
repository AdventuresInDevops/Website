/* eslint-disable no-console */

const axios = require('axios');
const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { parseStringPromise: parseXml, Builder: XmlBuilder } = require('xml2js');

const { syncSpreakerEpisodes, getSpreakerPublishedEpisode, getEpisodesFromDirectory } = require('./episode-release-generator/publisher/sync.js');

function getVersion() {
  let release_version = '0.0';
  const pull_request = '';
  const branch = process.env.GITHUB_REF;
  const build_number = `${process.env.GITHUB_RUN_NUMBER}`;

  // Builds of pull requests
  if (pull_request && !pull_request.match(/false/i)) {
    release_version = `0.${pull_request}`;
  } else if (!branch || !branch.match(/^(refs\/heads\/)?release[/-]/i)) {
    // Builds of branches that aren't main or release
    release_version = '0.0';
  } else {
    // Builds of release branches (or locally or on server)
    release_version = branch.match(/^(?:refs\/heads\/)?release[/-](\d+(?:\.\d+){0,3})$/i)[1];
  }
  return `${release_version}.${(build_number || '0')}.0.0.0.0`.split('.').slice(0, 3).join('.');
}
const version = getVersion();
commander.version(version);

const packageMetadata = require('./package.json');
packageMetadata.version = version;

/**
  * Build
  */
commander
  .command('setup')
  .description('Setup require build files for npm package.')
  .action(async () => {
    await fs.writeJson('./package.json', packageMetadata, { spaces: 2 });

    console.log('Building package %s (%s)', packageMetadata.name, version);
    console.log('');
  });

commander
  .command('rss')
  .option('-f, --full-roll-out', 'Force rollout of all episodes, throws an error if an episode is not ready', false)
  .option('-o, --output-directory <path>', 'The output directory to write the RSS feed to.', 'build')
  .description('Create the RSS File')
  .action(async cmd => {
    const fullRollOut = cmd.fullRollOut;
    try {
      const baseRssXmlFile = path.resolve(path.join(__dirname, './episode-release-generator/base-rss.xml'));
      const rssData = await fs.readFile(baseRssXmlFile);

      // spam / rss
      const email = Buffer.from('cnNzQGFkdmVudHVyZXNpbmRldm9wcy5jb20', 'base64url').toString();
      // podcasts@
      // const email = Buffer.from('cG9kY2FzdHNAYWR2ZW50dXJlc2luZGV2b3BzLmNvbQ', 'base64url').toString();
      const xmlObject = await parseXml(rssData, { explicitArray: false });

      xmlObject.rss.channel.copyright = 'Rhosys AG';
      xmlObject.rss.channel['itunes:owner']['itunes:email'] = email;
      xmlObject.rss.channel['itunes:applepodcastsverify'] = 'ffe0a5a0-80d4-11f0-aa9e-b10ce375a2e5';
      xmlObject.rss.channel['itunes:explicit'] = 'clean';

      const existingEpisodes = xmlObject.rss.channel.item;
      const recentEpisodes = await getEpisodesFromDirectory();
      const newItems = [];
      for (const recentEpisode of recentEpisodes.sort((a, b) => a.date.diff(b.date))) {
        if (existingEpisodes.some(e => e.link.includes(recentEpisode.slug))) {
          continue;
        }

        const spreakerEpisodeData = await getSpreakerPublishedEpisode(recentEpisode.title, recentEpisode.date);
        if (!spreakerEpisodeData) {
          if (!fullRollOut) {
            console.warn(`Skipping episode not published yet: ${recentEpisode.title}`);
            continue;
          }
          throw Error(`Cannot find published episode for locally available episode, refusing to generating RSS feed: ${recentEpisode.title}`);
        }
        const spreakerAudioUrl = spreakerEpisodeData.audioUrl;

        console.log(existingEpisodes[0]);
        newItems.push({
          title: recentEpisode.title,
          link: recentEpisode.episodeLink,
          description: spreakerEpisodeData.readyToPublishDescription,
          guid: { $: { isPermaLink: "false" }, _: recentEpisode.episodeLink },
          pubDate: recentEpisode.date.toRFC2822(),
          enclosure: { $: {
            url: spreakerEpisodeData.audioUrl, length: `${spreakerEpisodeData.audioFileSize}`, type: "audio/mpeg" 
          } },
          'podcast:transcript': spreakerEpisodeData.transcripts.map(t => ({
            $: {
              url: t.transcript_url,
              type: t.transcript_type,
              language: 'en' 
            }
          })),
          'itunes:author': 'Will Button, Warren Parad',
          'itunes:title': recentEpisode.title,
          'itunes:summary': spreakerEpisodeData.readyToPublishDescription,
          'itunes:duration': spreakerEpisodeData.audioDurationSeconds,
          'itunes:keywords': `${recentEpisode.slug},devops,platform,engineering,software,security,leadership,product,software,architecture,microservices,career`.split(',').slice(0,12).join(','),
          'itunes:explicit': 'clean',
          'itunes:image': { $: { href: "https://d3wo5wojvuv7l.cloudfront.net/t_rss_itunes_square_1400/images.spreaker.com/original/2f474744f84e93eba827bee58d58c1c9.jpg" } },
          'itunes:episode': spreakerEpisodeData.episodeNumber,
          'itunes:episodeType': 'full'
        });
      }

      xmlObject.rss.channel.item = [].concat(newItems).concat(existingEpisodes);

      const rssXml = new XmlBuilder({ cdata: true }).buildObject(xmlObject);

      const rssOutputDirectory = path.resolve(path.join(__dirname, cmd.outputDirectory));
      await fs.mkdirp(path.resolve(path.join(rssOutputDirectory, '/episodes')));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/episodes/rss.xml')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/episodes/rss')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/rss')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/rss.xml')), Buffer.from(rssXml));

      console.log('Generating RSS feed page');
      console.log('');
    } catch (error) {
      console.log('Failed to build RSS feed file, error:', error, error.stack);
      process.exit(1);
    }
  });

commander
  .command('publish-episode')
  .description('Sync the release to other locations')
  .action(async () => {
    try {
        console.log("Starting Spreaker synchronization...");
        await syncSpreakerEpisodes();
        console.log("Spreaker synchronization completed successfully.");
    } catch (error) {
        console.error("Synchronization failed:", error, error.message, error.stack, error.code);
        process.exit(1);
    }
  });

commander.on('*', () => {
  if (commander.args.join(' ') === 'tests/**/*.js') { return; }
  console.log(`Unknown Command: ${commander.args.join(' ')}`);
  commander.help();
  process.exit(0);
});
commander.parse(process.argv[2] ? process.argv : process.argv.concat(['build']));
