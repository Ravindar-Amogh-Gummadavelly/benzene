import React from 'react';
import {
  Layers,
  ShieldCheck,
  Clock,
  FileCheck,
  AlertTriangle,
  FileBadge,
} from 'lucide-react';

const iconsMap = {
  Layers,
  ShieldCheck,
  Clock,
  FileCheck,
  AlertTriangle,
  FileBadge,
};

const trendColorStyles = {
  neutral: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100 text-slate-700',
    subtextColor: 'text-slate-500',
  },
  positive: {
    bg: 'bg-emerald-50/40',
    border: 'border-emerald-200/80',
    iconBg: 'bg-emerald-100 text-emerald-800',
    subtextColor: 'text-emerald-700',
  },
  warning: {
    bg: 'bg-amber-50/40',
    border: 'border-amber-200/80',
    iconBg: 'bg-amber-100 text-amber-800',
    subtextColor: 'text-amber-800 font-medium',
  },
  info: {
    bg: 'bg-sky-50/40',
    border: 'border-sky-200/80',
    iconBg: 'bg-sky-100 text-sky-800',
    subtextColor: 'text-sky-700',
  },
  negative: {
    bg: 'bg-rose-50/40',
    border: 'border-rose-200/80',
    iconBg: 'bg-rose-100 text-rose-800',
    subtextColor: 'text-rose-700 font-medium',
  },
  purple: {
    bg: 'bg-purple-50/40',
    border: 'border-purple-200/80',
    iconBg: 'bg-purple-100 text-purple-800',
    subtextColor: 'text-purple-700',
  },
};

export default function KpiCard({ title, value, subtext, trend = 'neutral', icon, onClick }) {
  const IconComponent = iconsMap[icon] || Layers;
  const style = trendColorStyles[trend] || trendColorStyles.neutral;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
      className={`rounded-xl border bg-white p-5 shadow-xs transition-all hover:shadow-md cursor-pointer hover:border-blue-400 group text-left ${style.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-blue-700 transition-colors">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            {value}
          </h3>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${style.iconBg} group-hover:scale-105 transition-transform`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className={style.subtextColor}>{subtext}</span>
        <span className="text-[10px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Filter →
        </span>
      </div>
    </div>
  );
}
