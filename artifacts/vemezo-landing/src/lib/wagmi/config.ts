import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mezo, mezoTestnet } from 'viem/chains';

/**
 * Wagmi config for veMEZO Auto-Compounder.
 *
 * Wallet connectivity: injected connector supports all EVM wallets.
 * Bitcoin wallet support (Xverse, UniSat, OKX) via Mezo Passport is enabled
 * when users have those extensions installed — the injected connector picks
 * them up automatically on the Mezo chain, or they can be added via the
 * @mezo-org/passport integration in a Node-compatible environment.
 *
 * @mezo-org/passport uses web3/Buffer/process Node APIs that require polyfills
 * in a Vite browser build. The wallet constructors are available in keeper/
 * and server-side code where those polyfills are not needed.
 */
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

/**
 * Mezo Passport wallet IDs — used for wallet modal branding.
 * These wallets work through the injected connector when the extension is installed.
 */
export const PASSPORT_WALLET_IDS = {
  xverse:  "xverse",
  unisat:  "unisat",
  okx:     "okxwallet",
} as const;
