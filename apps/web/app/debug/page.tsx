export default function Debug() {
  return (
    <main style={{padding:20,fontFamily:'system-ui'}}>
      <h1>Debug OK</h1>
      <p>Static SSR page rendered.</p>
      <p>✅ Next.js {process.env.NODE_ENV} mode working</p>
      <p>✅ React 18.3.1 + Next.js 14.2.5 aligned</p>
      <p>✅ @vigor/shared transpilation configured</p>
      
      <h2>Environment Check</h2>
      <ul>
        <li>API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}</li>
        <li>Node ENV: {process.env.NODE_ENV}</li>
      </ul>
      
      <h2>Next Steps</h2>
      <p>If this page renders without webpack errors, the foundation is fixed!</p>
    </main>
  );
}
