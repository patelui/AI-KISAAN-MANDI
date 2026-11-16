import { FaBell, FaCheckCircle } from 'react-icons/fa';

const Notification = ({ notifications = [], loading = false }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Notifications</h3>
        <p className="mb-4 text-sm text-slate-500">Latest updates on your listings and orders</p>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Notifications</h3>
        <p className="mb-4 text-sm text-slate-500">Latest updates on your listings and orders</p>
        <p className="text-sm text-gray-500">No notifications yet. Orders on your crops will appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-slate-900">Recent Notifications</h3>
      <p className="mb-4 text-sm text-slate-500">Latest updates on your listings and orders</p>
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`rounded-lg p-3 ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}
          >
            <div className="flex items-start space-x-3">
              <FaBell className={`mt-1 ${notif.read ? 'text-gray-400' : 'text-blue-500'}`} />
              <div className="flex-1">
                <p className={`text-sm ${notif.read ? 'text-gray-600' : 'font-medium'}`}>
                  {notif.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">{notif.time}</p>
              </div>
              {!notif.read ? <FaCheckCircle className="text-blue-500" /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notification;
