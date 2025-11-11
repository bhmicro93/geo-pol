import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Geo/Cyber Intel Agent',
  description: 'Minimal MVP on Vercel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
