/* eslint-disable no-console */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs').promises;
const path = require('path');

// Resolve file paths
const instructionsPath = path.resolve(__dirname, 'prompt-page-generator.md');
const transcriptPath = path.resolve(__dirname, 'transcript.txt');
const outputPath = path.resolve(__dirname, 'index.md');

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

(async () => {
  try {
    // Read both input files
    const [instructions, transcript] = await Promise.all([
      fs.readFile(instructionsPath, 'utf-8'),
      fs.readFile(transcriptPath, 'utf-8')
    ]);

    // Build prompt
    const inputText = `Instructions:\n${instructions}\n\nTranscript:\n---\n${transcript}\n---`;

    // https://docs.aws.amazon.com/nova/latest/userguide/complete-request-schema.html
    const payload = {
      messages: [{
        role: 'user',
        content: [{
          // type: "text",
          text: inputText
        }]
      }]
      // Max Token Count and other parameters: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html
      // temperature: 0.7
      // top_p: 0.9,
      // max_tokens: 4096
    };

    // Invoke the model
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await client.send(command);

    // Decode and print response
    const responseBody = await response.body.transformToString();
    console.log('✅ Model response:\n');
    const episodeSummary = JSON.parse(responseBody).output.message.content[0].text;
    console.log(episodeSummary);
    await fs.writeFile(outputPath, episodeSummary, 'utf-8');
  } catch (err) {
    console.error('❌ Failed to invoke model:', err);
    process.exit(1);
  }
})();
