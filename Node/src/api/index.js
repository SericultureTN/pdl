// Minimal test function for debugging
export default function handler(req, res) {
  try {
    console.log('Function called successfully');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    return res.status(200).json({
      ok: true,
      message: 'Serverless function is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
