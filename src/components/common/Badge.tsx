import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = (status || '').toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';

  switch (norm) {
    case 'OCCUPIED':
    case 'ACTIVE':
    case 'PAID':
    case 'RESOLVED':
    case 'CLOSED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;

    case 'VACANT':
    case 'OPEN':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;

    case 'RESERVED':
    case 'EXPIRING':
    case 'IN_PROGRESS':
    case 'PARTIAL':
    case 'PENDING':
    case 'MEDIUM':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;

    case 'MAINTENANCE':
    case 'EXPIRED':
    case 'OVERDUE':
    case 'HIGH':
    case 'EMERGENCY':
    case 'TERMINATED':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;

    case 'LOW':
    case 'DRAFT':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide whitespace-nowrap ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {status}
    </span>
  );
};
