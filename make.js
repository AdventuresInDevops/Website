/* eslint-disable no-console */

const axios = require('axios');
const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');

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
    const result = await axios.get('https://www.spreaker.com/show/6102036/episodes/feed');
    const rssData = result.data;
    const email = Buffer.from('aXR1bmVzQGFkdmVudHVyZXNpbmRldm9wcy5jb20=', 'base64').toString();
    const sanitizedResult = rssData.replaceAll('<link>https://topenddevs.com/podcasts/adventures-in-devops</link>', '<link>https://adventuresindevops.com</link>')
      .replace(/\<link>https:\/\/topenddevs.com\/podcasts\/adventures-in-devops[\s\S]*?<\/link>/gi, '<link>https://adventuresindevops.com/episodes</link>')
      .replace(/<copyright>[\s\S]*?<\/copyright>/, '<copyright>Rhosys AG</copyright>')
      .replace(/<itunes:email>[\s\S]*?<\/itunes:email>/, `<itunes:email>${email}</itunes:email>`)
      .replace(/Sponsors\s*<br \/>[\s\S]*?]]>/g, ']]>')
      .replace(/Sponsors\s*<ul>[\s\S]*?]]>/g, ']]>')
      .replace(/Sponsored By:<ul>[\s\S]*?]]>/g, ']]>')
      .replace(/<itunes:subtitle>[\s\S]*?<\/itunes:subtitle>/g, '');

    await fs.writeFile(path.resolve(path.join(__dirname, '/build/episodes/rss.xml')), Buffer.from(sanitizedResult));

    console.log('Generating RSS feed page');
    console.log('');
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
        console.error("Synchronization failed:", error.message);
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
