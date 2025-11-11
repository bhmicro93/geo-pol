import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Geo/Cyber Intel Agent',
  description: 'Basic MVP running on Vercel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-6xl mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}
