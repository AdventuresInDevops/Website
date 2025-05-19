#!/usr/bin/env node

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs').promises;
const path = require('path');

// Resolve file paths
const instructionsPath = path.resolve(__dirname, 'prompt-image-generator.md');
const episodeSummaryTextPath = path.resolve(__dirname, 'index.md');
const referenceImage = path.resolve(__dirname, 'logo.png');

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

(async () => {
  try {
    // Read both input files
    const [instructions, summary] = await Promise.all([
      fs.readFile(instructionsPath, 'utf-8'),
      fs.readFile(episodeSummaryTextPath, 'utf-8')
    ]);

    const titleMatch = summary.match(/^title:\s*"(.*?)"/m)[1];
    const descriptionMatch = summary.match(/^description:\s*"(.*?)"/m)[1];

    // Build prompt
    // const inputText = `Instructions:\n${instructions}\n\nSummary:\n---\n${titleMatch} - ${descriptionMatch}\n---`;
    const inputText = `Instructions:\n${instructions}\n\nSummary:\n---\n\n---`;

    const payload = {
      'textToImageParams':
        {
          'text': inputText
        },
      'taskType':'TEXT_IMAGE',
      'imageGenerationConfig': {
        'cfgScale': 8,'seed': 42,'quality':'standard','width': 1280,'height': 720,'numberOfImages': 3
      }
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
    const images = JSON.parse(responseBody).images;
    await Promise.all(images.map(async (imageData, imageIndex) => {
      await fs.writeFile(path.join(__dirname, `image-${imageIndex}.jpg`), Buffer.from(imageData, 'base64'));
    }));
  } catch (err) {
    console.error('❌ Failed to invoke model:', err);
    process.exit(1);
  }
})();