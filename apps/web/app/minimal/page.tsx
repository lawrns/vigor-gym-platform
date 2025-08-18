export default function MinimalPage() {
  return (
    <div>
      <h1>Minimal Test Page</h1>
      <p>This page has no client-side JavaScript or complex components.</p>
      <p>If this loads without errors, the basic Next.js setup is working.</p>
      
      <h2>API Test</h2>
      <p>API Health Check: <a href="http://localhost:4004/health" target="_blank">http://localhost:4004/health</a></p>
      
      <h2>Navigation Test</h2>
      <ul>
        <li><a href="/minimal">Minimal Page (current)</a></li>
        <li><a href="/simple">Simple Page</a></li>
        <li><a href="/">Home Page</a></li>
      </ul>
    </div>
  );
}
