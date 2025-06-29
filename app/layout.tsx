import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TUNA - Advanced Note-Taking Platform',
  description: 'A powerful, intuitive note-taking application with advanced organization and task management capabilities.',
  keywords: 'notes, note-taking, productivity, markdown, collaboration',
  authors: [{ name: 'TUNA Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#012340' },
    { media: '(prefers-color-scheme: dark)', color: '#1A2633' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}