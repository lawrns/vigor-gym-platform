// Static page without any dynamic imports or complex components
export default function StaticPage() {
  return (
    <html lang="en">
      <head>
        <title>Static Test Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: '20px', fontFamily: 'system-ui' }}>
        <h1>Static Test Page</h1>
        <p>This is a completely static page without any dynamic imports.</p>
        <p>If this loads without errors, the basic Next.js setup is working.</p>
        
        <h2>API Status</h2>
        <p>API Health: <a href="http://localhost:4003/health" target="_blank">http://localhost:4003/health</a></p>
        
        <h2>Test Links</h2>
        <ul>
          <li><a href="/static">Static Page (current)</a></li>
          <li><a href="/minimal">Minimal Page</a></li>
          <li><a href="/">Home Page</a></li>
        </ul>
        
        <h2>Database Status</h2>
        <p>✅ Minimal seed completed with:</p>
        <ul>
          <li>1 company (Vigor Demo Gym)</li>
          <li>1 admin user (admin@testgym.mx / TestPassword123!)</li>
          <li>1 gym</li>
          <li>2 plans</li>
          <li>5 members with active memberships</li>
        </ul>
      </body>
    </html>
  );
}
