// Simple HTTP server for local development

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Handle only GET requests
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  // Normalize URL by removing query string and handling root URL
  let url = req.url.split('?')[0];
  if (url === '/') {
    url = '/index.html';
  }

  // Resolve the file path
  const filePath = path.join(__dirname, url);

  // Read the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // File not found
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('File not found');
      } else {
        // Server error
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
      return;
    }

    // Determine content type
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Send the response
    res.setHeader('Content-Type', contentType);
    res.statusCode = 200;
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Open this URL in your web browser to use the Expense Tracker.`);
});
