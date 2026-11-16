import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaChartLine,
  FaCog,
  FaBox,
  FaCalendarAlt,
  FaLeaf,
  FaRobot,
  FaEye,
} from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: FaHome, label: 'Dashboard', path: '/farmer-dashboard' },
    { icon: FaLeaf, label: 'My Crops', path: '/farmer-crops' },
    { icon: FaBox, label: 'Orders', path: '/farmer-orders' },
    { icon: FaChartLine, label: 'Analytics', path: '/farmer-analytics' },
    { icon: FaRobot, label: 'AI Assistant', path: '/farmer-assistant' },
    { icon: FaEye, label: 'Listing Preview', path: '/farmer-listing-preview' },
    { icon: FaCalendarAlt, label: 'Calendar', path: '/farmer-calendar' },
    { icon: FaCog, label: 'Settings', path: '/profile' },
  ];

  return (
    <aside className="min-h-screen w-64 bg-emerald-900 p-4 text-white">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Menu</h2>
      </div>
      <nav>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`mb-2 flex w-full items-center space-x-3 rounded-lg p-3 text-left text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-700 text-white' : 'text-emerald-50 hover:bg-emerald-700'
              }`}
            >
              <item.icon className="text-lg" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;