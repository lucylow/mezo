const KEYS = {
  CONNECTOR:  'vemezo:last_connector',
  ADDRESS:    'vemezo:last_address',
  CHAIN_ID:   'vemezo:preferred_chain',
  TIMESTAMP:  'vemezo:session_ts',
} as const;

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface WalletSession {
  connectorId: string;
  address: string;
  chainId: number;
  timestamp: number;
}

export function saveWalletSession(session: WalletSession): void {
  try {
    localStorage.setItem(KEYS.CONNECTOR, session.connectorId);
    localStorage.setItem(KEYS.ADDRESS,   session.address);
    localStorage.setItem(KEYS.CHAIN_ID,  String(session.chainId));
    localStorage.setItem(KEYS.TIMESTAMP, String(session.timestamp));
  } catch (e) {
    console.warn('saveWalletSession:', e);
  }
}

export function getLastWalletSession(): WalletSession | null {
  try {
    const connectorId = localStorage.getItem(KEYS.CONNECTOR);
    const address     = localStorage.getItem(KEYS.ADDRESS);
    const chainId     = localStorage.getItem(KEYS.CHAIN_ID);
    const timestamp   = localStorage.getItem(KEYS.TIMESTAMP);
    if (!connectorId || !address || !chainId || !timestamp) return null;
    const ts = parseInt(timestamp, 10);
    if (Date.now() - ts > MAX_AGE_MS) { clearWalletSession(); return null; }
    return { connectorId, address, chainId: parseInt(chainId, 10), timestamp: ts };
  } catch (e) {
    console.warn('getLastWalletSession:', e);
    return null;
  }
}

export function clearWalletSession(): void {
  try {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('clearWalletSession:', e);
  }
}
