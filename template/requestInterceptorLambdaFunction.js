// eslint-disable-next-line node/no-missing-import
import cf from 'cloudfront';

const kvsId = 'fa4d81f8-9371-4fac-8bc3-f295083b910e';
let kvsHandle;
try {
  kvsHandle = cf.kvs(kvsId);
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    message: {
      title: 'Failed to setup KVS.',
      level: 'ERROR',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    }
  }));
}

// eslint-disable-next-line no-unused-vars
async function handler(event) {
  // IMPORTANT: if this path requested doesn't exist in the bucket then the site error default will be loaded instead:
  // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html#functions-event-structure-request
  const request = event.request;

  const requestUri = request.uri || '';

  // Hard Coded Redirects
  const redirectMap = {

  };

  try {
    const redirectUrl = redirectMap[requestUri] || await kvsHandle.get(requestUri);
    return {
      statusCode: 302,
      statusDescription: 'Found',
      headers: {
        location: { value: `${redirectUrl}` }
      }
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      message: {
        title: 'Failed to fetch redirect target.',
        level: 'ERROR',
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      }
    }));
  }

  return {
    statusCode: 404,
    statusDescription: 'Not Found'
  };
}
