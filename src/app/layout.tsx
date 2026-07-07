import type { Metadata } from 'next';
import './globals.css';
import { AudioProvider } from '@/context/AudioContext';
import ClientWalletProvider from '@/components/ClientWalletProvider';
import VideoBackground from '@/components/VideoBackground';
import MobileSplash from '@/components/MobileSplash';
import MobileTabBar from '@/components/MobileTabBar';

export const metadata: Metadata = {
  title: 'OddsDraft — Predictive Fantasy Football | World Cup 2026',
  description:
    'Build your fantasy lineup, predict match outcomes, and win SOL prizes. Powered by TxODDS live football data on Solana.',
  keywords: ['fantasy football', 'world cup 2026', 'solana', 'prediction market', 'crypto gaming'],
  openGraph: {
    title: 'OddsDraft — Predictive Fantasy Football',
    description: 'Fantasy football meets prediction markets. Live World Cup data. On-chain prizes.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientWalletProvider>
          <AudioProvider>
            <MobileSplash />
            <VideoBackground />
            {children}
            <MobileTabBar />
          </AudioProvider>
        </ClientWalletProvider>
      </body>
    </html>
  );
}
