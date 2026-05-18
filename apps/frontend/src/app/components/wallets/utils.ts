export const formatNumber = (val: string | undefined, decimals: number = 4): string => {
  if (!val) return '—';
  const num = parseFloat(val);
  if (isNaN(num)) return '—';
  return num.toFixed(decimals);
};

export const formatPrice = (val: string | undefined): string => {
  if (!val) return '—';
  const num = parseFloat(val);
  if (isNaN(num)) return '—';
  return num.toFixed(2);
};

export const getPnlColor = (val: string | number | undefined): string => {
  if (val === undefined) return 'text-[#0D0D0D]';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (num > 0) return 'text-green-600';
  if (num < 0) return 'text-red-600';
  return 'text-[#0D0D0D]';
};
