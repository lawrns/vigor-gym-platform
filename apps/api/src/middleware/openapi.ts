import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const router = express.Router();

// Serve OpenAPI specification
router.get('/openapi.yaml', (req: Request, res: Response) => {
  try {
    const specPath = path.join(process.cwd(), '../../openapi/devices-checkins.yaml');

    if (!fs.existsSync(specPath)) {
      return res.status(404).json({ message: 'OpenAPI specification not found' });
    }

    const spec = fs.readFileSync(specPath, 'utf8');
    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(spec);
  } catch (e) {
    const error = e as Error;
    console.error('Error serving OpenAPI spec:', error);
    res.status(500).json({ message: 'Error loading OpenAPI specification' });
  }
});

// Serve OpenAPI specification as JSON
router.get('/openapi.json', (req: Request, res: Response) => {
  try {
    const specPath = path.join(process.cwd(), '../../openapi/devices-checkins.yaml');

    if (!fs.existsSync(specPath)) {
      return res.status(404).json({ message: 'OpenAPI specification not found' });
    }

    const spec = fs.readFileSync(specPath, 'utf8');
    const jsonSpec = yaml.load(spec);

    res.setHeader('Content-Type', 'application/json');
    res.json(jsonSpec);
  } catch (e) {
    const error = e as Error;
    console.error('Error serving OpenAPI spec as JSON:', error);
    res.status(500).json({ message: 'Error loading OpenAPI specification' });
  }
});

// Serve Swagger UI
router.get('/docs', (req: Request, res: Response) => {
  const swaggerUIHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vigor Device Check-in API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #1f2937;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          // Add any request interceptors here
          return request;
        },
        responseInterceptor: function(response) {
          // Add any response interceptors here
          return response;
        },
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: function(error) {
          console.error('Swagger UI failed to load:', error);
        }
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerUIHtml);
});

// Health check for docs
router.get('/docs/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'openapi-docs',
    timestamp: new Date().toISOString(),
  });
});

export default router;
