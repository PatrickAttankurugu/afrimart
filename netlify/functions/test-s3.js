// Simple test function to ensure Netlify Functions are working
exports.handler = async (event, context) => {
    console.log('[TEST-S3] Function invoked', {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers
    });
  
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Netlify function is working!',
        timestamp: new Date().toISOString(),
        path: event.path,
        queryParams: event.queryStringParameters
      })
    };
  };