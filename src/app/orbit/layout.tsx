export default function OrbitLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a1a' }}>
        {children}
      </body>
    </html>
  );
}
