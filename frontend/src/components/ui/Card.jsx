import React from 'react';
import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-bg-card border border-border-thin rounded-sm p-5 shadow-sm text-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
