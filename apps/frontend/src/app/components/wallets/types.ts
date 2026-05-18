export interface WalletPool {
  poolAddress: string;
  tokenX: string;
  tokenY: string;
  binStep: number;
  balances: string;
  balancesSol: string;
  unclaimedFees: string;
  unclaimedFeesSol: string;
  pnl: string;
  pnlSol: string;
  pnlPctChange: string;
  pnlSolPctChange: string;
  openPositionCount: number;
  outOfRange: boolean;
  poolPrice: number;
}

export interface WalletPortfolio {
  totalPositions?: number;
  total?: {
    totalPositions?: number;
    balances?: string;
    balancesSol?: string;
    unclaimedFees?: string;
    unclaimedFeesSol?: string;
    pnl?: string;
    pnlSol?: string;
    pnlPctChange?: string;
    pnlSolPctChange?: string;
  };
  pools?: WalletPool[];
}

export interface Wallet {
  chain: string;
  address: string;
  is_default: boolean;
  portfolio?: WalletPortfolio | null;
}
