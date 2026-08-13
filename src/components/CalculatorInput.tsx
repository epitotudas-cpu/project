import React from 'react';

export interface CalculatorInputProps {
  label?: string;
  value: number | string | null | undefined;
  onChange: (val: number | '') => void;
  placeholder?: string;
  step?: string | number;
  min?: string | number;
  max?: string | number;
  className?: string;
  helpText?: string;
  id?: string;
}

/**
 * Formats a value for numeric input elements so that 0 is preserved as "0"
 * rather than coerced into an empty string via falsy check.
 */
export const formatInputValue = (val: number | string | null | undefined): string => {
  if (val === '' || val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) {
    return '';
  }
  return String(val);
};

/**
 * Safely extracts a numeric value from input state (number | string | null | undefined)
 * treating empty string, null, or undefined as fallback (default 0), while correctly preserving 0.
 */
export const safeNum = (val: number | string | null | undefined, fallback = 0): number => {
  if (val === '' || val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) {
    return fallback;
  }
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  return Number.isNaN(num) ? fallback : num;
};

export const CalculatorInput: React.FC<CalculatorInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '0',
  step,
  min,
  max,
  className = 'w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent',
  helpText,
  id,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === undefined) {
      onChange('');
    } else {
      const normalized = raw.replace(',', '.');
      const num = parseFloat(normalized);
      onChange(Number.isNaN(num) ? '' : num);
    }
  };

  return (
    <div>
      {label && <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>}
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={formatInputValue(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      {helpText && <span className="text-[11px] text-gray-500 mt-1 block">{helpText}</span>}
    </div>
  );
};

export default CalculatorInput;
