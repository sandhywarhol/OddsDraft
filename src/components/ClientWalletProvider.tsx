'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { clusterApiUrl } from '@solana/web3.js';
import { TxLineProvider } from '@/context/TxLineContext';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  // Use mainnet-beta since txLINE program is on mainnet
  // Use internal API route to proxy RPC requests and bypass browser CORS/403 blocks
  const endpoint = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/rpc`;
    }
    return 'http://localhost:3000/api/rpc';
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint: 'wss://solana-rpc.publicnode.com' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <TxLineProvider>
            {children}
          </TxLineProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
