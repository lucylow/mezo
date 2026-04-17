import { useWallet } from './useWallet';

export function useUserPosition() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return {
      shares: 0,
      valueUSD: 0,
      earnedMEZO: 0,
      nftsLocked: [],
      isLoading: false,
    };
  }

  return {
    shares: 1250,
    valueUSD: 340000,
    earnedMEZO: 154.2,
    nftsLocked: [
      { id: '1042', amount: 500, unlockDate: '2025-12-01' },
      { id: '2891', amount: 750, unlockDate: '2026-06-15' },
    ],
    isLoading: false,
  };
}
