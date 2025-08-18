export default function SimpleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
