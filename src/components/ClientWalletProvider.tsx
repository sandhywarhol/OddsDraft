'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { clusterApiUrl } from '@solana/web3.js';
import { TxLineProvider } from '@/context/TxLineContext';
import SupabaseSyncProvider from '@/components/SupabaseSyncProvider';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';

  const endpoint = useMemo(() => {
    // Browser: always go through our server-side proxy so the Alchemy API key stays hidden
    if (typeof window !== 'undefined') return `${window.location.origin}/api/rpc`;
    // SSR fallback (rarely used)
    return isDevnet ? 'https://api.devnet.solana.com' : 'https://solana-rpc.publicnode.com';
  }, [isDevnet]);

  // WSS for transaction confirmation subscriptions (signatureSubscribe).
  // NEXT_PUBLIC_SOLANA_WSS should be set to the Alchemy wss:// URL in Vercel.
  // Falls back to Solana's official public WSS — more reliable than publicnode.
  const wsEndpoint = isDevnet
    ? 'wss://api.devnet.solana.com'
    : (process.env.NEXT_PUBLIC_SOLANA_WSS ?? 'wss://api.mainnet-beta.solana.com');

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <TxLineProvider>
            <SupabaseSyncProvider>
              {children}
            </SupabaseSyncProvider>
          </TxLineProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
