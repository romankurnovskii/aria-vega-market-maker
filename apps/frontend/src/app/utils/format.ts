export const formatAmount = (amountStr: string, decimals: number): string => {
  if (!amountStr) return '0.00';
  const amt = parseFloat(amountStr) / Math.pow(10, decimals);
  return amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

export const getTokenSymbol = (tokenObj?: { mint?: string; tokenAddress?: string } | null): string => {
  if (!tokenObj) return 'TOKEN';
  const addr = tokenObj.tokenAddress || tokenObj.mint;
  if (!addr) return 'TOKEN';
  if (addr === 'So11111111111111111111111111111111111111112') return 'SOL';
  if (addr === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return 'USDC';
  if (addr === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') return 'USDT';
  return addr.slice(0, 4).toUpperCase();
};
