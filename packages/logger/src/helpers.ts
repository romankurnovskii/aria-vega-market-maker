import util from 'node:util';

/**
 * Standard robust deep-stringify function used for inspecting nested complex objects like Maps/Sets/Objects.
 */
export const stringify = (object: any): string => {
  return util.inspect(object, {
    showHidden: false,
    depth: 10,
    maxArrayLength: null,
    breakLength: 25_000,
    maxStringLength: 25_000,
  });
};

/**
 * Returns current UTC date formatted as YYYY-MM-DD.
 */
export const getDateUTCFormat = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
