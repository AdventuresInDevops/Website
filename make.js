/* eslint-disable no-console */

const axios = require('axios');
const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { parseStringPromise: parseXml, Builder: XmlBuilder } = require('xml2js');

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
  .description('Create the RSS File')
  .action(async () => {
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

      const rssXml = new XmlBuilder({ cdata: true }).buildObject(xmlObject);
      
      await fs.mkdir(path.resolve(path.join(__dirname, '/build/episodes')));
      await fs.writeFile(path.resolve(path.join(__dirname, '/build/episodes/rss.xml')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(__dirname, '/build/episodes/rss')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(__dirname, '/build/rss')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(__dirname, '/build/rss.xml')), Buffer.from(rssXml));

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
    const { syncSpreakerEpisodes } = require('./episode-release-generator/publisher/sync.js')

    const episodesReleasePath = path.resolve(__dirname, 'episodes');

    try {
        console.log("Starting Spreaker synchronization...");
        await syncSpreakerEpisodes(episodesReleasePath);
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
