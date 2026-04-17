export enum WalletErrorType {
  CONNECTOR_NOT_FOUND    = 'ConnectorNotFoundError',
  USER_REJECTED          = 'UserRejectedRequestError',
  CHAIN_NOT_CONFIGURED   = 'ChainNotConfiguredError',
  CHAIN_MISMATCH         = 'ChainMismatchError',
  UNSUPPORTED_CHAIN      = 'UnsupportedChainError',
  INSUFFICIENT_FUNDS     = 'InsufficientFundsError',
  TRANSACTION_FAILED     = 'TransactionFailedError',
  UNKNOWN_ERROR          = 'UnknownError',
}

export interface WalletError {
  type: WalletErrorType;
  message: string;
  originalError?: Error;
}

export function parseWalletError(error: unknown): WalletError {
  const msg  = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name   : '';

  if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
    return { type: WalletErrorType.USER_REJECTED, message: 'Transaction cancelled by user', originalError: error instanceof Error ? error : undefined };
  }
  if (name === 'ConnectorNotFoundError' || msg.includes('Connector not found')) {
    return { type: WalletErrorType.CONNECTOR_NOT_FOUND, message: 'Wallet not detected. Please install MetaMask or another EVM wallet.', originalError: error instanceof Error ? error : undefined };
  }
  if (msg.includes('Chain mismatch') || name === 'ChainMismatchError') {
    return { type: WalletErrorType.CHAIN_MISMATCH, message: 'Please switch to the Mezo network in your wallet.', originalError: error instanceof Error ? error : undefined };
  }
  if (name === 'UnsupportedChainError' || msg.includes('Unsupported chain')) {
    return { type: WalletErrorType.UNSUPPORTED_CHAIN, message: 'This network is not supported. Please switch to Mezo.', originalError: error instanceof Error ? error : undefined };
  }
  if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
    return { type: WalletErrorType.INSUFFICIENT_FUNDS, message: "You don't have enough BTC to cover the gas fees.", originalError: error instanceof Error ? error : undefined };
  }
  return { type: WalletErrorType.UNKNOWN_ERROR, message: msg || 'An unknown error occurred', originalError: error instanceof Error ? error : undefined };
}

export function getUserFriendlyMessage(error: WalletError): string {
  switch (error.type) {
    case WalletErrorType.CONNECTOR_NOT_FOUND:  return 'No wallet detected. Install MetaMask, Rabby, or any EVM wallet.';
    case WalletErrorType.USER_REJECTED:        return 'You cancelled the request. You can try again.';
    case WalletErrorType.CHAIN_MISMATCH:
    case WalletErrorType.CHAIN_NOT_CONFIGURED: return 'Please switch to the Mezo network.';
    case WalletErrorType.UNSUPPORTED_CHAIN:    return 'This network is not supported. Switch to Mezo.';
    case WalletErrorType.INSUFFICIENT_FUNDS:   return "Insufficient BTC to pay gas fees.";
    case WalletErrorType.TRANSACTION_FAILED:   return 'Transaction failed. Please try again.';
    default:                                   return error.message;
  }
}
