// Compatibility shim — delegates to real wagmi-based hook.
// All existing pages use this hook and continue to work unchanged.
import { useWalletConnection } from '@/hooks/wallet/useWalletConnection';
import { shortenAddress } from '@/lib/utils';

export function useWallet() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletConnection();
  return {
    isConnected,
    isConnecting,
    address: address ? shortenAddress(address, 4) : null,
    rawAddress: address,
    connect: () => connect(),
    disconnect,
  };
}
