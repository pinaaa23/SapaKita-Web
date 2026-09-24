import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-sky-100/80 text-sky-600 border border-sky-200/50',
    green: 'bg-emerald-100/80 text-emerald-600 border border-emerald-200/50',
    teal: 'bg-teal-100/80 text-teal-600 border border-teal-200/50',
    red: 'bg-rose-100/80 text-rose-600 border border-rose-200/50',
    pink: 'bg-rose-100/80 text-rose-600 border border-rose-200/50',
    purple: 'bg-violet-100/80 text-violet-600 border border-violet-200/50',
    accent: 'bg-violet-100/80 text-violet-600 border border-violet-200/50',
    amber: 'bg-amber-100/80 text-amber-600 border border-amber-200/50',
    primary: 'bg-amber-100/80 text-amber-600 border border-amber-200/50',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80 flex flex-col hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            trend === 'up' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' : 'text-rose-700 bg-rose-50 border border-rose-200/50'
          }`}>
            {trend === 'up' ? '+' : '-'}{trendValue}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
