import React from 'react';
import clsx from 'clsx';

export const Badge = ({ children, status, className, ...props }) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold uppercase tracking-wider border';
  
  const statusVariants = {
    Available: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    'On Trip': 'bg-blue-950/40 text-blue-400 border-blue-800/60',
    'In Shop': 'bg-amber-950/40 text-amber-400 border-amber-800/60',
    Retired: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
    'Off Duty': 'bg-gray-800 text-gray-400 border-gray-700',
    Suspended: 'bg-red-950/40 text-red-400 border-red-800/60',
    Draft: 'bg-slate-900 text-slate-400 border-slate-700',
    Dispatched: 'bg-sky-950/40 text-sky-400 border-sky-800/60',
    Completed: 'bg-green-950/40 text-green-400 border-green-800/60',
    Cancelled: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    Active: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
  };

  const currentVariant = statusVariants[status] || 'bg-bg-card text-gray-300 border-border-thin';

  return (
    <span className={clsx(baseStyles, currentVariant, className)} {...props}>
      {children || status}
    </span>
  );
};

export default Badge;
