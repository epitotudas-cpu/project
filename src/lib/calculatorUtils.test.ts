import { describe, expect, it } from 'vitest';
import { formatInputValue, parseNumberValue, safeNum } from './calculatorUtils';

describe('calculatorUtils', () => {
  describe('formatInputValue', () => {
    it('returns empty string for null, undefined, and empty string', () => {
      expect(formatInputValue(null)).toBe('');
      expect(formatInputValue(undefined)).toBe('');
      expect(formatInputValue('')).toBe('');
    });

    it('preserves 0 as "0"', () => {
      expect(formatInputValue(0)).toBe('0');
      expect(formatInputValue('0')).toBe('0');
    });

    it('formats numbers and strings', () => {
      expect(formatInputValue(42.5)).toBe('42.5');
      expect(formatInputValue('12,5')).toBe('12,5');
    });
  });

  describe('parseNumberValue', () => {
    it('returns null for empty, null, undefined, or non-numeric strings', () => {
      expect(parseNumberValue(null)).toBeNull();
      expect(parseNumberValue(undefined)).toBeNull();
      expect(parseNumberValue('')).toBeNull();
      expect(parseNumberValue('   ')).toBeNull();
      expect(parseNumberValue('abc')).toBeNull();
      expect(parseNumberValue(Number.NaN)).toBeNull();
    });

    it('parses numbers with dot or comma decimals and whitespace', () => {
      expect(parseNumberValue(0)).toBe(0);
      expect(parseNumberValue('0')).toBe(0);
      expect(parseNumberValue(' 12,5 ')).toBe(12.5);
      expect(parseNumberValue('3.14')).toBe(3.14);
      expect(parseNumberValue(-7.25)).toBe(-7.25);
    });
  });

  describe('safeNum', () => {
    it('returns parsed number when valid, including 0', () => {
      expect(safeNum(0)).toBe(0);
      expect(safeNum('0', 10)).toBe(0);
      expect(safeNum('15,5')).toBe(15.5);
    });

    it('returns fallback when input is invalid or missing', () => {
      expect(safeNum(null)).toBe(0);
      expect(safeNum(undefined, 5)).toBe(5);
      expect(safeNum('', 9)).toBe(9);
      expect(safeNum('not-a-number', -1)).toBe(-1);
    });
  });
});

