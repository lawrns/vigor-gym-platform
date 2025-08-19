export default function DebugOk() {
  return (
    <main style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1>Debug OK ✅</h1>
      <p>Static SSR page rendered successfully.</p>
      <p>✅ React 18.3.1 + Next.js 14.2.5</p>
      <p>✅ No webpack runtime errors</p>
      <p>✅ Reverted web app working</p>

      <h2>Test Results</h2>
      <p>If you can see this page without console errors, the scoped revert worked!</p>
    </main>
  );
}
