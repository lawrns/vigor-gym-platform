export default function MinimalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Minimal Test</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
