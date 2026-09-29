import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    teal: 'bg-teal-50 text-teal-600 border border-teal-100',
    red: 'bg-rose-50 text-rose-600 border border-rose-100',
    pink: 'bg-rose-50 text-rose-600 border border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
    violet: 'bg-violet-50 text-violet-600 border border-violet-100',
    indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    accent: 'bg-violet-50 text-violet-600 border border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border border-amber-100',
    primary: 'bg-blue-50 text-blue-600 border border-blue-100',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md border border-slate-100/80 flex flex-col justify-between h-full transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            trend === 'up' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' : 'text-rose-700 bg-rose-50 border border-rose-200/60'
          }`}>
            {trend === 'up' ? '+' : '-'}{trendValue}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
