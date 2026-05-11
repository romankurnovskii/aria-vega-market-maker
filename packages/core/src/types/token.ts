/**
 * @file token.ts
 * @description Token amount representation with decimals and address/mint abstraction.
 *
 * @features
 * - TokenAmount: Generic token quantity with precision (decimals) and chain-agnostic address
 *
 * @dependencies None
 * @sideEffects None — type definition only
 */
export interface TokenAmount {
  amount: string;
  decimals: number;
  tokenAddress: string; // Agnostic address/mint

  /**
   * @deprecated Use `tokenAddress` instead. This is kept for legacy Solana support.
   */
  mint?: string;
}
