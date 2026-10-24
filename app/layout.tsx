import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Dancing_Script } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
});

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
});

const dancing = Dancing_Script({
  subsets:  ['latin'],
  variable: '--font-dancing',
  display:  'swap',
});

export const metadata: Metadata = {
  title:       'A Story for You',
  description: 'An interactive story, created just for you.',
  robots:      { index: false, follow: false },
};

export const viewport: Viewport = {
  width:               'device-width',
  initialScale:        1,
  maximumScale:        1,
  themeColor:          '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${dancing.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
