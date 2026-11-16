import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaBox, FaCheckDouble, FaSeedling } from 'react-icons/fa';

function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  open,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleNotificationClick = (notification) => {
    onMarkAsRead?.(notification.id);
    onClose?.();

    if (notification.type === 'order') {
      navigate('/farmer-orders');
      return;
    }

    if (notification.type === 'stock') {
      navigate('/farmer-crops');
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96"
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            <FaCheckDouble />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading && (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center">
            <FaBell className="mx-auto text-2xl text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No notifications yet</p>
            <p className="mt-1 text-xs text-slate-500">Orders and stock alerts will appear here.</p>
          </div>
        )}

        {!loading &&
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                notification.read ? 'bg-white' : 'bg-emerald-50/60'
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  notification.type === 'stock' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}
              >
                {notification.type === 'stock' ? <FaSeedling className="text-sm" /> : <FaBox className="text-sm" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${notification.read ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">{notification.time}</p>
              </div>
              {!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
            </button>
          ))}
      </div>
    </div>
  );
}

export default NotificationDropdown;
