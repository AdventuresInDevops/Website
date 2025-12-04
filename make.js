/* eslint-disable no-console */

const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');
const AwsArchitect = require('aws-architect');
const aws = require('aws-sdk');
const { DateTime } = require('luxon');
const sharp = require('sharp');
const { glob } = require('glob');
const os = require('os');

const { parseStringPromise: parseXml, Builder: XmlBuilder } = require('xml2js');
const { Route53Client, ListHostedZonesByNameCommand } = require('@aws-sdk/client-route-53');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

const stackTemplateProvider = require('./template/cloudFormationWebsiteTemplate.js').default;

const { syncEpisodesToSpreaker, getSpreakerPublishedEpisode, getEpisodesFromDirectory, ensureS3Episode, getCurrentlySyncedS3EpisodeSlugs, savePostImagesToS3 } = require('./episode-release-generator/publisher/sync.js');

aws.config.update({ region: 'us-east-1' });

const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), `temp-directory-for-uploads-${Date.now()}`);

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

const parameters = {
  hostedName: 'adventuresindevops.com',
  serviceName: 'AdventuresInDevops',
  serviceDescription: 'AdventuresInDevops Podcast website'
};

const contentOptions = {
  bucket: parameters.hostedName,
  contentDirectory: path.join(__dirname, 'build')
};

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
  .option('-o, --output-directory <path>', 'The output directory to write the RSS feed to.', 'build')
  .description('Create the RSS File')
  .action(async cmd => {
    try {
      const baseRssXmlFile = path.resolve(path.join(__dirname, './episode-release-generator/base-rss.xml'));
      const rssData = await fs.readFile(baseRssXmlFile);

      // spam / rss@email-devops.com address
      const email = Buffer.from('cnNzQGFkdmVudHVyZXNpbmRldm9wcy5jb20', 'base64url').toString();
      const xmlObject = await parseXml(rssData, { explicitArray: false });

      xmlObject.rss.channel.copyright = 'Rhosys AG';
      xmlObject.rss.channel.lastBuildDate = DateTime.utc().toRFC2822();
      xmlObject.rss.channel['itunes:owner']['itunes:email'] = email;
      xmlObject.rss.channel['itunes:applepodcastsverify'] = 'ffe0a5a0-80d4-11f0-aa9e-b10ce375a2e5';
      xmlObject.rss.channel['itunes:explicit'] = 'false';
      xmlObject.rss.channel['podcast:locked'] = { $: { owner: email }, _: 'yes' };
      // https://tools.rssblue.com/podcast-guid
      xmlObject.rss.channel['podcast:guid'] = '917758d3-7b50-5ea4-906e-00f3fb05e50a';

      const existingEpisodes = xmlObject.rss.channel.item;
      const recentEpisodes = await getEpisodesFromDirectory();
      const newItems = [];
      for (const recentEpisode of recentEpisodes.sort((a, b) => a.date.diff(b.date))) {
        if (existingEpisodes.some(e => e.link.includes(recentEpisode.slug))) {
          continue;
        }

        // Skip episodes that will be released in the future
        if (DateTime.utc().plus({ days: 1 }) < recentEpisode.date) {
          continue;
        }

        const spreakerEpisodeData = await getSpreakerPublishedEpisode({ episodeSlug: recentEpisode.slug });
        if (!spreakerEpisodeData) {
          throw Error(`Cannot find published episode for locally available episode, refusing to generating RSS feed: ${recentEpisode.title}`);
        }

        const audioDurationSeconds = spreakerEpisodeData.audioDurationSeconds;
        const audioUrl = spreakerEpisodeData.audioUrl;
        const audioFileSize = spreakerEpisodeData.audioFileSize;

        newItems.push({
          title: recentEpisode.title,
          link: recentEpisode.episodeLink,
          description: recentEpisode.sanitizedBody,
          guid: { $: { isPermaLink: "false" }, _: recentEpisode.episodeLink },
          pubDate: recentEpisode.date.toRFC2822(),
          enclosure: { $: {
            url: audioUrl, length: `${audioFileSize}`, type: "audio/mpeg"
          } },
          'podcast:transcript': [
            { $: {
              url: `https://links.adventuresindevops.com/storage/episodes/${recentEpisode.episodeNumber}-${recentEpisode.slug}/transcript.srt`,
              type: 'application/x-subrip', language: 'en' } },
            { $: {
              url: `https://links.adventuresindevops.com/storage/episodes/${recentEpisode.episodeNumber}-${recentEpisode.slug}/transcript.txt`,
              type: 'text/plain', language: 'en' } }
          ],
          'itunes:author': 'Will Button, Warren Parad',
          'itunes:title': recentEpisode.title,
          'itunes:summary': recentEpisode.sanitizedBody,
          'itunes:duration': audioDurationSeconds,
          'itunes:keywords': `${recentEpisode.slug},devops,platform,engineering,software,security,leadership,product,software,architecture,microservices,career`.split(',').slice(0, 12).join(','),
          'itunes:explicit': 'false',
          'itunes:image': { $: { href: "https://d3wo5wojvuv7l.cloudfront.net/t_rss_itunes_square_1400/images.spreaker.com/original/2f474744f84e93eba827bee58d58c1c9.jpg" } },
          'itunes:episode': recentEpisode.episodeNumber,
          'itunes:episodeType': 'full'
        });
      }

      xmlObject.rss.channel.item = [].concat(newItems.map(i => i).sort((a, b) => Number(b['itunes:episode']) - Number(a['itunes:episode']))).concat(existingEpisodes);

      const rssXml = new XmlBuilder({ cdata: true }).buildObject(xmlObject);

      const rssOutputDirectory = path.resolve(path.join(__dirname, cmd.outputDirectory));
      await fs.mkdirp(path.resolve(path.join(rssOutputDirectory, '/episodes')));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/episodes/rss.xml')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/episodes/rss')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/rss')), Buffer.from(rssXml));
      await fs.writeFile(path.resolve(path.join(rssOutputDirectory, '/rss.xml')), Buffer.from(rssXml));

      console.log('Finished RSS feed page');
      console.log('');
      console.log('');
    } catch (error) {
      console.log('Failed to build RSS feed file, error:', error, error.stack);
      process.exit(1);
    }
  });

commander
  .command('s3sync')
  .description('[RUN LOCALLY] Sync the release to S3')
  .action(async () => {
    try {
      console.log("Starting S3 synchronization...");
      await ensureS3Episode();
      console.log("Spreaker synchronization completed successfully.");
    } catch (error) {
      console.error('');
      console.error('');
      console.error("Synchronization failed:", error.message, error.code || '');
      console.error('');
      console.error('');
      process.exit(1);
    }
  });

commander
  .command('publish-episode')
  .description('[RUN IN CICD]: Sync the release to other locations')
  .action(async () => {
    try {
      console.log("Starting Spreaker synchronization...");
      await syncEpisodesToSpreaker();
      console.log("Spreaker synchronization completed successfully.");
    } catch (error) {
      console.error("Publishing failed:", error, error.message, error.stack, error.code);
      process.exit(1);
    }
  });

// async function processImages(imageFiles) {
//   await fs.ensureDir(TEMP_UPLOAD_DIR);
//   const slugToPathsMap = new Map();

//   for (const filePath of imageFiles) {
//     const parentDir = path.dirname(filePath);
//     // The local slug is the name of the parent directory
//     const localSlug = path.basename(parentDir);
//     const ext = path.extname(filePath).toLowerCase();
//     const baseName = path.basename(filePath, ext);
    
//     if (!slugToPathsMap.has(localSlug)) {
//       slugToPathsMap.set(localSlug, []);
//     }

//     // 1. Handle existing WebP files and copy the original
//     const newBaseDir = path.join(TEMP_UPLOAD_DIR, localSlug);
//     await fs.ensureDir(newBaseDir);

//     // a. Copy the original file
//     const originalDest = path.join(newBaseDir, path.basename(filePath));
//     await fs.copy(filePath, originalDest);
//     slugToPathsMap.get(localSlug).push(originalDest);

//     // 2. Create the WebP version if the original was not already WebP
//     if (ext !== '.webp') {
//       const webpDest = path.join(newBaseDir, `${baseName}.webp`);
//       await sharp(filePath)
//           .resize({ width: 400, withoutEnlargement: true })
//           .webp({ quality: 80 })
//           .toFile(webpDest);
//       slugToPathsMap.get(localSlug).push(webpDest);
//       console.log(`  -> Processed ${localSlug}: ${ext} converted to webp.`);
//     } else {
//       console.log(`  -> Found existing WebP: ${localSlug}`);
//     }
//   }

//   return slugToPathsMap;
// }

// // This does not work because og image does not support webp, so we don't run this yet.
// commander
// .command('build')
// .description('Get the repository read for building docusaurus')
// .action(async () => {
//   const TARGET_DIR = 'episodes';
//   const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

//   console.log('🚀 Starting in-place image optimization...');

//   try {
//     // 1. Find all matching images
//     const imagePattern = `${TARGET_DIR}/**/post.{${EXTENSIONS.join(',')}}`;
//     const images = await glob.sync(imagePattern);
    
//     if (images.length === 0) {
//       console.log('No images found to optimize.');
//       return;
//     }

//     console.log(`Found ${images.length} images. Processing...`);

//     const baseRssXmlFile = path.resolve(path.join(__dirname, './episode-release-generator/base-rss.xml'));
//     const rssData = await fs.readFile(baseRssXmlFile);
//     const xmlObject = await parseXml(rssData, { explicitArray: false });
    
//     const rssFeedLookupData = xmlObject.rss.channel.item.map(i => ({
//       episodeSlug: i.link.split('/').slice(-1)[0],
//       episodeNumber: i['itunes:episode']
//     })).reduce((acc, e) => ({ ...acc, [e.episodeSlug]: e }), {});

//     const episodeSlugs = await getCurrentlySyncedS3EpisodeSlugs();
//     const episodeStorageList = episodeSlugs.map(e => {
//       return {
//         episodeSlug: e.split('-').slice(1).join('-'),
//         episodeNumber: e.split('-')[0]
//       };
//     }).filter(e => e);

//     const s3LookupData = episodeStorageList.reduce((acc, e) => ({ ...acc, [e.episodeSlug]: e }), {});

//     const processedSlugsMap = await processImages(images);
//     for (const [localSlug, pathsArray] of processedSlugsMap.entries()) {
//       if (localSlug === 'podcast-automation-review') {
//         continue;
//       }
//       const episodeNumber = localSlug.match(/^(\d{3})-/i)?.[1]
//         || rssFeedLookupData[localSlug.replace(/^[\d-]+-/, '')]?.episodeNumber
//         || s3LookupData[localSlug.replace(/^[\d-]+-/, '')]?.episodeNumber;

//       if (!episodeNumber) {
//         console.log('***** Uploading files to S3', localSlug, pathsArray);
//         throw Error('NO EPISODE NUMBER');
//       }
//       await savePostImagesToS3(episodeNumber, pathsArray);
//     }

//     console.log('✅ Optimization complete!');
//   } catch (error) {
//     console.error('Fatal Error:', error);
//     process.exit(1);
//   }
// });

commander
.command('deploy')
.description('Deploying website to AWS.')
.action(async () => {
  const requestInterceptorLambdaFunction = await fs.readFile(path.join(__dirname, 'template/requestInterceptorLambdaFunction.js'));
  const stackTemplate = stackTemplateProvider.getStack({
    requestInterceptorLambdaFunctionString: requestInterceptorLambdaFunction.toString()
  });
  
  const stsClient = new STSClient({});
  const callerIdentityResponse = await stsClient.send(new GetCallerIdentityCommand({}));
  const apiOptions = {
    deploymentBucket: `rhosys-deployments-artifacts-${callerIdentityResponse.Account}-${aws.config.region}`
  };
  const awsArchitect = new AwsArchitect(packageMetadata, apiOptions, contentOptions);

  const isProductionBranch = process.env.GITHUB_REF === 'refs/heads/main';

  try {
    await awsArchitect.validateTemplate(stackTemplate);

    if (isProductionBranch) {
      const stackConfiguration = {
        changeSetName: `${process.env.GITHUB_REPOSITORY.replace(/[^a-z0-9]/ig, '-')}-${process.env.GITHUB_RUN_NUMBER || '1'}`,
        stackName: packageMetadata.name,
        automaticallyProtectStack: true
      };

      const route53Client = new Route53Client({});
      const command = new ListHostedZonesByNameCommand({ DNSName: parameters.hostedName });
      const response = await route53Client.send(command);
      const hostedZoneId = response.HostedZones[0].Id.replace('/hostedzone/', '');
      parameters.hostedZoneId = hostedZoneId;
      await awsArchitect.deployTemplate(stackTemplate, stackConfiguration, parameters);
    }

    console.log('Deployment Success!');
  } catch (failure) {
    console.log(`Failed to upload website ${failure} - ${JSON.stringify(failure, null, 2)}`);
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
