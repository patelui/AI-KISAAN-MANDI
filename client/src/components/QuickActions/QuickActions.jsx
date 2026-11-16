import React from 'react';
import { FaPlus, FaChartLine, FaListAlt, FaBell, FaRobot, FaBox } from 'react-icons/fa';

const QuickActions = ({ onAction }) => {
  const actions = [
    { icon: FaPlus, label: 'Add Listing', color: 'bg-green-600', action: 'add-listing' },
    { icon: FaChartLine, label: 'Analytics', color: 'bg-blue-600', action: 'market' },
    { icon: FaListAlt, label: 'Manage Listings', color: 'bg-purple-600', action: 'manage-listings' },
    { icon: FaBox, label: 'View Orders', color: 'bg-orange-600', action: 'orders' },
    { icon: FaRobot, label: 'AI Assistant', color: 'bg-indigo-600', action: 'assistant' },
    { icon: FaBell, label: 'Notifications', color: 'bg-amber-500', action: 'notifications' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onAction?.(action.action)}
            className={`${action.color} flex items-center justify-center gap-2 rounded-lg p-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90`}
          >
            <action.icon />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;