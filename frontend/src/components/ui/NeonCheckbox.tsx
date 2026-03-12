import React from 'react';

interface NeonCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function NeonCheckbox({ checked, onChange, label }: NeonCheckboxProps) {
  return (
    <label className="flex items-center cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`
          w-5 h-5 rounded border-2 transition-all duration-300 ease-in-out
          ${checked 
            ? 'bg-accent border-accent shadow-[0_0_10px_rgba(235,94,40,0.5)]' 
            : 'border-warm-gray bg-transparent group-hover:border-accent'
          }
        `}>
          {checked && (
            <svg
              className="w-3 h-3 text-white absolute top-0.5 left-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      <span className="ml-3 text-sm text-warm-gray group-hover:text-accent transition-colors">
        {label}
      </span>
    </label>
  );
}