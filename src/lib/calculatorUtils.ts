/**
 * Numeric input formatting and parsing helpers for calculator pages.
 */

/**
 * Formats a value for numeric input elements so that 0 is preserved as "0",
 * while empty string, null, or undefined is formatted as "" (truly empty).
 */
export const formatInputValue = (val: number | string | null | undefined): string => {
  if (val === '' || val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) {
    return '';
  }
  return String(val);
};

/**
 * Safely parses input state (number | string | null | undefined) to number or null.
 * Returns null if the value is empty, null, or undefined (meaning not entered),
 * and returns the number (including 0) if entered.
 */
export const parseNumberValue = (val: number | string | null | undefined): number | null => {
  if (val === '' || val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'number') {
    return Number.isNaN(val) ? null : val;
  }
  const normalized = String(val).trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Fallback helper for legacy calculation routines where a numeric fallback is explicitly requested.
 */
export const safeNum = (val: number | string | null | undefined, fallback = 0): number => {
  const parsed = parseNumberValue(val);
  return parsed === null ? fallback : parsed;
};

