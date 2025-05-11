exports.handler = async () => {
    // Log available environment variables (without exposing sensitive data)
    console.log('Environment check requested');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hasAccessKey: !!process.env.AWS_ACCESS_KEY,
        hasSecretKey: !!process.env.AWS_SECRET_KEY,
        hasRegion: !!process.env.AWS_REGION_NAME,
        hasBucket: !!process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION_NAME || 'Not set',
        bucket: process.env.S3_BUCKET_NAME || 'Not set',
        netlifyEnv: process.env.CONTEXT || 'Not set'
      })
    };
  };