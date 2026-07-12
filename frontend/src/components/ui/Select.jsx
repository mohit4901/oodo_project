import React from 'react';
import clsx from 'clsx';

export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  className,
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold tracking-wider text-gray-400 uppercase select-none">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'w-full bg-[#121212] border border-border-thin text-gray-200 rounded-sm px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange cursor-pointer',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      >
        <option value="" disabled className="bg-[#121212] text-gray-600">
          {placeholder}
        </option>
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1f1f1f] text-gray-200">
                {opt.label}
              </option>
            ))}
      </select>
      {error && (
        <span className="text-xs text-red-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
