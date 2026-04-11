import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './layout.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Contractor Dashboard',
  description: 'Project management suite for contractors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          <header className="app-header">
            <h1>Contractor Dashboard</h1>
          </header>
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
