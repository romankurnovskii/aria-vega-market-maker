import { SolanaRpcProvider } from './solana-rpc-provider.js';

export class HelioRpcProvider extends SolanaRpcProvider {
  constructor(rpcUrl: string) {
    // Falls back to a default Helius mainnet URL if not provided.
    const url = rpcUrl || 'https://mainnet.helius-rpc.com/?api-key=mock-api-key';
    super(url);
  }
}
