import { useState, useCallback } from 'react';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(() => {
    setIsConnected(true);
    setAddress('0x71C...97d1'); // Mock address
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
  }, []);

  return {
    isConnected,
    address,
    connect,
    disconnect,
  };
}
