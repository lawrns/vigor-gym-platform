'use client';

export default function SimplePage() {
  return (
    <div>
      <h1>Simple Page</h1>
      <p>This is a minimal page without any complex components.</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
}
