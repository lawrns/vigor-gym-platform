import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minimal Test',
  description: 'Minimal test page',
};

export default function MinimalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: '20px', fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  );
}
