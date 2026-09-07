import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  accent?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  accent = 'indigo',
}) => {
  const accentColors = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    blue: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
  }[accent];

  return (
    <div
      id={id}
      className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg border ${accentColors} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-[11px]">
          {trend && (
            <span
              className={`font-bold ${trendPositive ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-medium truncate ml-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
