import React from 'react';

const StatsCard = ({ icon: Icon, title, value, color }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="text-xl text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;