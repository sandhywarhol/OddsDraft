import type { Metadata } from 'next';
import { Inter, Bebas_Neue, Space_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AudioProvider } from '@/context/AudioContext';
import ClientWalletProvider from '@/components/ClientWalletProvider';
import VideoBackground from '@/components/VideoBackground';
import MobileSplash from '@/components/MobileSplash';
import MobileTabBar from '@/components/MobileTabBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.oddsdraft.fun'),
  title: 'OddsDraft — Predictive Fantasy Football | World Cup 2026',
  description:
    'Build your fantasy lineup, predict match outcomes, and win SOL prizes. Powered by TxODDS live football data on Solana.',
  keywords: ['fantasy football', 'world cup 2026', 'solana', 'prediction market', 'crypto gaming'],
  openGraph: {
    title: 'OddsDraft — Predictive Fantasy Football',
    description: 'Fantasy football meets prediction markets. Live World Cup data. On-chain prizes.',
    type: 'website',
    url: 'https://www.oddsdraft.fun',
    siteName: 'OddsDraft',
    images: [{ url: '/homepage.webp', width: 1915, height: 821, alt: 'OddsDraft — Predictive Fantasy Football' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OddsDraft — Predictive Fantasy Football',
    description: 'Fantasy football meets prediction markets. Live World Cup data. On-chain prizes.',
    images: ['/homepage.webp'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable} ${spaceMono.variable}`}>
      <head />
      <body>
        <ClientWalletProvider>
          <AudioProvider>
            <MobileSplash />
            <VideoBackground />
            {children}
            <MobileTabBar />
          </AudioProvider>
        </ClientWalletProvider>
        
        {/* Twemoji: load library then run parser on an interval to catch dynamic content */}
        <Script src="https://unpkg.com/twemoji@latest/dist/twemoji.min.js" strategy="lazyOnload" />
        <Script id="twemoji-init" strategy="lazyOnload">
          {`
            // Run periodically to catch dynamically rendered emojis (like scores or live data)
            setInterval(() => {
              if (window.twemoji) {
                window.twemoji.parse(document.body, { 
                  folder: 'svg', 
                  ext: '.svg',
                  className: 'twemoji' // Add this class to control sizing in CSS
                });
              }
            }, 1500);
          `}
        </Script>
      </body>
    </html>
  );
}
