// netlify/functions/s3-handler.js

// Import the S3 client and commands from AWS SDK v3
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs/filenames

// Initialize the S3 client
// Ensure environment variables are set in your Netlify dashboard:
// AWS_REGION_NAME, AWS_ACCESS_KEY, AWS_SECRET_KEY, S3_BUCKET_NAME
const s3Client = new S3Client({
  region: process.env.AWS_REGION_NAME,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Helper function to convert a stream to a string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

// Main handler function for Netlify
exports.handler = async (event, context) => {
  // CORS headers for allowing cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Specify allowed methods
  };

  // Log incoming event for debugging
  console.log('[S3_HANDLER] Event Received:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
    bodyLength: event.body ? event.body.length : 0,
    isBase64Encoded: event.isBase64Encoded,
  });

  // Handle OPTIONS preflight requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('[S3_HANDLER] Handling OPTIONS preflight request.');
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Determine the operation from query parameters
  const operation = event.queryStringParameters && event.queryStringParameters.operation;
  if (!operation) {
    console.error('[S3_HANDLER] Error: "operation" query parameter is missing.');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing "operation" query parameter' }),
    };
  }

  console.log(`[S3_HANDLER] Processing operation: "${operation}" with method: ${event.httpMethod}`);

  try {
    switch (operation) {
      // Operation to get orders from S3
      case 'get-orders':
        console.log('[S3_HANDLER_ORDERS] Attempting to fetch orders.json');
        try {
          const getOrdersCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: 'orders.json',
          });
          const response = await s3Client.send(getOrdersCommand);
          const data = await streamToString(response.Body);
          console.log('[S3_HANDLER_ORDERS] Successfully fetched orders.json');
          return { statusCode: 200, headers, body: data };
        } catch (err) {
          if (err.name === 'NoSuchKey') {
            console.log('[S3_HANDLER_ORDERS] orders.json not found. Returning empty array.');
            return { statusCode: 200, headers, body: JSON.stringify([]) };
          }
          console.error('[S3_HANDLER_ORDERS] Error fetching orders.json:', err);
          throw err; // Re-throw to be caught by outer try-catch
        }

      // Operation to save orders to S3
      case 'save-orders':
        if (event.httpMethod !== 'POST') {
          return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed for save-orders' }) };
        }
        console.log('[S3_HANDLER_ORDERS] Attempting to save orders.json');
        const ordersData = JSON.parse(event.body);
        const saveOrdersCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: 'orders.json',
          Body: JSON.stringify(ordersData),
          ContentType: 'application/json',
        });
        await s3Client.send(saveOrdersCommand);
        console.log('[S3_HANDLER_ORDERS] Successfully saved orders.json');
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Orders saved successfully' }) };

      // Operation to get products from S3
      case 'get-products':
        console.log('[S3_HANDLER_PRODUCTS] Attempting to fetch products.json');
        try {
          const getProductsCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: 'products.json',
          });
          const response = await s3Client.send(getProductsCommand);
          const data = await streamToString(response.Body);
          console.log('[S3_HANDLER_PRODUCTS] Successfully fetched products.json');
          return { statusCode: 200, headers, body: data };
        } catch (err) {
          if (err.name === 'NoSuchKey') {
            console.log('[S3_HANDLER_PRODUCTS] products.json not found. Returning empty array.');
            return { statusCode: 200, headers, body: JSON.stringify([]) };
          }
          console.error('[S3_HANDLER_PRODUCTS] Error fetching products.json:', err);
          throw err;
        }

      // Operation to save products to S3
      case 'save-products':
        if (event.httpMethod !== 'POST') {
          return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed for save-products' }) };
        }
        console.log('[S3_HANDLER_PRODUCTS] Attempting to save products.json');
        const productsDataToSave = JSON.parse(event.body);
        console.log('[S3_HANDLER_PRODUCTS] Data to save:', JSON.stringify(productsDataToSave, null, 2).substring(0, 500) + '...'); // Log snippet
        if (!Array.isArray(productsDataToSave)) {
            console.error('[S3_HANDLER_PRODUCTS] Invalid products data format. Expected array.');
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid products data format. Expected array.'}) };
        }
        const saveProductsCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: 'products.json',
          Body: JSON.stringify(productsDataToSave),
          ContentType: 'application/json',
        });
        await s3Client.send(saveProductsCommand);
        console.log('[S3_HANDLER_PRODUCTS] Successfully saved products.json');
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Products saved successfully' }) };

      // Operation to upload an image to S3
      case 'upload-image':
        if (event.httpMethod !== 'POST') {
          return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed for upload-image' }) };
        }
        console.log('[S3_HANDLER_IMAGE] Attempting to upload image.');

        // Check if the body is base64 encoded (Netlify often does this for binary data)
        // The client (admin.js) is now sending FormData, which Netlify might handle.
        // If Netlify doesn't parse multipart/form-data well, admin.js needs to send base64 in JSON.
        // For this version, assuming admin.js is modified to send base64 in JSON.
        
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (e) {
            console.error('[S3_HANDLER_IMAGE] Failed to parse request body as JSON for image upload:', e);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body for image upload.' }) };
        }

        const base64ImageData = requestBody.image; // e.g., "data:image/jpeg;base64,..."
        const originalFileName = requestBody.fileName || 'uploaded-image';
        const fileType = requestBody.fileType || 'image/jpeg'; // Default to JPEG if not provided

        if (!base64ImageData || !base64ImageData.startsWith('data:image')) {
          console.error('[S3_HANDLER_IMAGE] Invalid or missing base64 image data.');
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid or missing base64 image data.' }) };
        }

        // Extract base64 content and determine extension
        const base64Data = base64ImageData.split(';base64,').pop();
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Determine file extension from fileType or originalFileName
        let extension = fileType.split('/')[1] || originalFileName.split('.').pop();
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension.toLowerCase())) {
            extension = 'jpg'; // Default to jpg if extension is unknown or unsafe
        }

        const uniqueFileName = `${uuidv4()}-${originalFileName.replace(/[^a-zA-Z0-9.]/g, '_')}.${extension}`;
        const s3Key = `images/${uniqueFileName}`; // Store images in an 'images/' folder

        console.log(`[S3_HANDLER_IMAGE] Uploading to S3 with Key: ${s3Key}, ContentType: ${fileType}`);

        const uploadImageCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: imageBuffer,
          ContentType: fileType,
          // ACL: 'public-read', // Uncomment if you want images to be publicly readable directly
        });
        await s3Client.send(uploadImageCommand);

        // Construct the public URL (ensure your bucket policy allows public reads if needed, or use signed URLs)
        const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION_NAME}.amazonaws.com/${s3Key}`;
        
        console.log('[S3_HANDLER_IMAGE] Successfully uploaded image. URL:', imageUrl);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ imageUrl: imageUrl }),
        };

      // Default case for unknown operations
      default:
        console.log(`[S3_HANDLER] Unknown operation: "${operation}"`);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `Operation not found: ${operation}` }),
        };
    }
  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error('[S3_HANDLER] Critical Error:', error.name, error.message, error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
