import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mezo, mezoTestnet } from 'viem/chains';

// Use injected connector — works with MetaMask, Rabby, Coinbase Wallet, etc.
// No WalletConnect project ID required.
export const wagmiConfig = createConfig({
  chains: [mezoTestnet, mezo],
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [mezoTestnet.id]: http('https://rpc.test.mezo.org'),
    [mezo.id]: http('https://rpc-http.mezo.boar.network'),
  },
});

export { mezo, mezoTestnet };
export const DEFAULT_CHAIN = mezoTestnet;
export const SUPPORTED_CHAINS = [mezoTestnet, mezo] as const;
