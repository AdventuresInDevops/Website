/* eslint-disable no-console */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs').promises;
const path = require('path');

// Resolve file paths
const instructionsPath = path.resolve(__dirname, 'prompt-image-generator.md');
const episodeSummaryTextPath = path.resolve(__dirname, 'index.md');
const logoImage = path.resolve(__dirname, '../static/img/logo.jpg');
const referenceImage = path.resolve(__dirname, '../episodes/everything-is-amazing-with-otel/post.png');

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

(async () => {
  try {
    // Read both input files
    const [instructions, summary] = await Promise.all([
      fs.readFile(instructionsPath, 'utf-8'),
      fs.readFile(episodeSummaryTextPath, 'utf-8')
    ]);

    const titleMatch = summary.match(/^title:\s*"(.*?)"/m)[1];

    // Build prompt
    const inputText = `Instructions:\n${instructions}\n\nSummary:\n${titleMatch}\n\nAnd here are the reference images attached:`;
    // const inputText = `Instructions:\n${instructions}\n\nSummary:\n---\n\n---`;

    // https://docs.aws.amazon.com/nova/latest/userguide/complete-request-schema.html
    const payload = {
      messages: [
        {
          role: 'user',
          content: [
            { text: inputText },
            {
              image: {
                format: 'jpeg',
                source: {
                  bytes: (await fs.readFile(logoImage)).toString('base64')
                }
              }
            },
            {
              image: {
                format: 'png',
                source: {
                  bytes: (await fs.readFile(referenceImage)).toString('base64')
                }
              }
            }
          ]
        }
      ]
    };

    // Invoke the model
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await client.send(command);

    // Decode and print response
    const responseBody = await response.body.transformToString();
    console.log('✅ Images Created!:\n');
    const imageData = JSON.parse(responseBody).output.message.content[0].image.source.bytes;
    await fs.writeFile(path.join(__dirname, `image.png`), Buffer.from(imageData, 'base64'));
  } catch (err) {
    console.error('❌ Failed to invoke model:', err);
    process.exit(1);
  }
})();
