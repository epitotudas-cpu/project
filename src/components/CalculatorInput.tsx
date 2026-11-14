import React from 'react';
import { formatInputValue } from '../lib/calculatorUtils';

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

export const CalculatorInput: React.FC<CalculatorInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
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
