/**
 * @file chain.ts
 * @description Chain and protocol type unions for multi-chain abstraction.
 *
 * @features
 * - ChainId: supported blockchain networks (currently Solana, Arbitrum)
 * - ProtocolType: supported AMM protocols (currently Meteora DLMM, Uniswap V3)
 *
 * @dependencies None
 * @sideEffects None — type definitions only
 */
export type ChainId = 'solana' | 'arbitrum';
export type ProtocolType = 'meteora_dlmm' | 'uniswap_v3';
