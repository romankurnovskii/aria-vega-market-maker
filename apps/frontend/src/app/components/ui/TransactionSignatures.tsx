/**
 * @file TransactionSignatures.tsx
 * @description Displays confirmed transaction signatures after a successful on-chain operation.
 *
 * @features
 * - Green-accented block header with "TX CONFIRMED" label
 * - Each signature rendered as selectable monospace text
 * - Responsive layout with left accent border
 */

interface TransactionSignaturesProps {
  signatures: string[];
}

export const TransactionSignatures = ({ signatures }: TransactionSignaturesProps) => {
  if (!signatures || signatures.length === 0) return null;

  return (
    <div className="bg-[#1A1A1A] p-1 border-l-2 border-green-500 text-[13px] flex flex-col gap-0.5">
      <div className="font-bold text-green-500 uppercase">TX CONFIRMED:</div>
      {signatures.map((sig, idx) => (
        <div key={idx} className="opacity-70 break-all select-all">
          {sig}
        </div>
      ))}
    </div>
  );
};
