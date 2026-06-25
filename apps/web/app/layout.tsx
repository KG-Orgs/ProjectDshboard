import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ContractorAI',
  description: 'AI assistant for project documents, RFIs, submittals, schedules, and field coordination.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
