const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION_NAME
});

exports.handler = async (event, context) => {
  console.log('[S3-HANDLER] Incoming request:', {
    httpMethod: event.httpMethod,
    path: event.path,
    rawPath: event.rawPath,
    queryStringParameters: event.queryStringParameters
  });

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const { httpMethod, queryStringParameters } = event;
  const operation = queryStringParameters?.operation || '';
  
  console.log('[S3-HANDLER] Operation requested:', operation);

  let response = {};

  try {
    switch (operation) {
      case 'get-orders':
        try {
          response = await s3.getObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'orders.json'
          }).promise();
          return {
            statusCode: 200,
            headers,
            body: response.Body.toString()
          };
        } catch (err) {
          if (err.code === 'NoSuchKey') {
            // Return empty array if file doesn't exist
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify([])
            };
          }
          throw err;
        }

      case 'save-orders':
        if (httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };
        const ordersData = JSON.parse(event.body);
        
        await s3.putObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: 'orders.json',
          Body: JSON.stringify(ordersData),
          ContentType: 'application/json'
        }).promise();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Orders saved successfully' })
        };

      case 'get-products':
        try {
          response = await s3.getObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'products.json'
          }).promise();
          return {
            statusCode: 200,
            headers,
            body: response.Body.toString()
          };
        } catch (err) {
          if (err.code === 'NoSuchKey') {
            // Return empty array if file doesn't exist
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify([])
            };
          }
          throw err;
        }

      case 'save-products':
        if (httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };
        const productsData = JSON.parse(event.body);
        
        await s3.putObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: 'products.json',
          Body: JSON.stringify(productsData),
          ContentType: 'application/json'
        }).promise();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Products saved successfully' })
        };

      default:
        console.log('[S3-HANDLER] No valid operation provided');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid operation',
            validOperations: ['get-orders', 'save-orders', 'get-products', 'save-products'],
            receivedOperation: operation
          })
        };
    }
  } catch (error) {
    console.error('[S3-HANDLER] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};