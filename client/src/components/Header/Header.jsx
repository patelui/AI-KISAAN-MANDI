import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaSignOutAlt } from 'react-icons/fa';
import api, { resolveAssetUrl } from '../../utils/api';
import { useFarmerNotifications } from '../../hooks/useFarmerNotifications';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isFarmer = user?.role === 'farmer';
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    reload: reloadNotifications,
  } = useFarmerNotifications({ enabled: isFarmer });

  useEffect(() => {
    const fetchProfile = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!storedUser || !token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const displayName = user?.fullName?.trim() || user?.farmOrBusinessName?.trim() || user?.email || 'Farmer';
  const profileImage = resolveAssetUrl(user?.profilePhoto);

  const toggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      reloadNotifications();
    }
  };

  return (
    <header className="relative z-40 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-green-700">AI Kisan Mandi</h1>
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search products..."
              className="w-64 rounded-lg border py-2 pl-10 pr-4"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isFarmer && (
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative rounded-lg p-1 text-gray-600 transition hover:bg-slate-100"
                aria-label="Notifications"
              >
                <FaBell className="text-2xl" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notificationsLoading}
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
            </div>
          )}
          <button
            type="button"
            className="flex cursor-pointer items-center space-x-2"
            onClick={() => navigate('/profile')}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden font-medium text-slate-700 sm:inline">
              {loading ? 'Loading...' : displayName}
            </span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-1 text-red-600 transition-colors hover:text-red-700"
          >
            <FaSignOutAlt />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
