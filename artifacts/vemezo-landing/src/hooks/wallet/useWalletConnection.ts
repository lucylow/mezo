import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { parseWalletError, getUserFriendlyMessage } from '@/lib/wallet/errors';
import { saveWalletSession, clearWalletSession } from '@/lib/wallet/persistence';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '@/lib/wagmi/config';

export function useWalletConnection() {
  const { address, isConnected, isConnecting, chain, connector } = useAccount();
  const { connectAsync, connectors }  = useConnect();
  const { disconnectAsync }           = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const connect = useCallback(async (connectorId?: string) => {
    try {
      const target = connectorId
        ? connectors.find(c => c.id === connectorId) ?? connectors[0]
        : connectors[0];
      if (!target) throw new Error('No wallet connector available');
      const result = await connectAsync({ connector: target });
      if (result.accounts[0]) {
        saveWalletSession({
          connectorId: target.id,
          address: result.accounts[0],
          chainId: result.chainId,
          timestamp: Date.now(),
        });
      }
      toast.success('Wallet connected');
    } catch (err) {
      const parsed = parseWalletError(err);
      if (parsed.type !== 'UserRejectedRequestError') {
        toast.error(getUserFriendlyMessage(parsed));
      }
      throw err;
    }
  }, [connectAsync, connectors]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync();
      clearWalletSession();
      toast.success('Wallet disconnected');
    } catch (err) {
      const parsed = parseWalletError(err);
      toast.error(getUserFriendlyMessage(parsed));
    }
  }, [disconnectAsync]);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      await switchChainAsync({ chainId });
      const name = SUPPORTED_CHAINS.find(c => c.id === chainId)?.name;
      toast.success(`Switched to ${name ?? 'network'}`);
    } catch (err) {
      const parsed = parseWalletError(err);
      toast.error(getUserFriendlyMessage(parsed));
      throw err;
    }
  }, [switchChainAsync]);

  const switchToDefaultChain = useCallback(() => switchNetwork(DEFAULT_CHAIN.id), [switchNetwork]);

  const isCorrectNetwork = isConnected ? (chain?.id === DEFAULT_CHAIN.id) : true;
  const unsupportedNetwork = isConnected && !!chain && !SUPPORTED_CHAINS.some(c => c.id === chain.id);

  return {
    address,
    isConnected,
    isConnecting,
    isSwitching,
    isCorrectNetwork,
    unsupportedNetwork,
    chain,
    connector: connector?.name,
    connectors,
    connect,
    disconnect,
    switchNetwork,
    switchToDefaultChain,
  };
}
