import React from 'react';
import clsx from 'clsx';

export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold tracking-wider text-gray-400 uppercase select-none">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={inputId}
        className={clsx(
          'w-full bg-[#121212] border border-border-thin text-gray-200 rounded-sm px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange placeholder:text-gray-600',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
