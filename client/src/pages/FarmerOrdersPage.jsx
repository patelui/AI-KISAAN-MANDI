import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaCheckCircle, FaClock, FaRupeeSign, FaTruck } from 'react-icons/fa';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import { useFarmerOrders } from '../hooks/useFarmerOrders';

const statusColors = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const nextStatuses = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

function FarmerOrdersPage() {
  const navigate = useNavigate();
  const {
    orders,
    stats,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    updateOrderStatus,
  } = useFarmerOrders();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'farmer') {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Unable to update order');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <Header onLogout={handleLogout} />
        <main className="space-y-6 p-6">
          <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">Sales</p>
            <h1 className="mt-2 text-2xl font-bold">Incoming Orders</h1>
            <p className="mt-2 text-sm text-emerald-50">
              Manage buyer orders for your crop listings.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FaBox className="text-emerald-600" />
              <p className="mt-2 text-sm text-slate-500">Total orders</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FaClock className="text-amber-500" />
              <p className="mt-2 text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.pending}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FaRupeeSign className="text-emerald-600" />
              <p className="mt-2 text-sm text-slate-500">Revenue</p>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '—' : `₹${Number(stats.revenue || 0).toLocaleString('en-IN')}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <FaTruck className="mx-auto text-3xl text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No orders yet</p>
              <p className="mt-1 text-sm text-slate-500">
                When buyers purchase your crops, orders will appear here.
              </p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[order.status] || statusColors.Pending}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-slate-400">{order.timeAgo}</span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Buyer: {order.buyer?.fullName || order.buyer?.email || 'Unknown'}
                        </p>
                        {order.buyer?.phone && (
                          <p className="text-xs text-slate-500">Phone: {order.buyer.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {order.farmerItems.map((item) => (
                          <div
                            key={`${order.id}-${item.cropId}`}
                            className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          >
                            <span className="font-medium">{item.cropName}</span>
                            {' · '}
                            {item.quantity} qtl @ ₹{Number(item.price).toLocaleString('en-IN')}/qtl
                            {' · '}
                            <span className="font-semibold text-emerald-700">
                              ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-sm text-slate-500">
                        Delivery: {order.deliveryAddress?.address}, {order.deliveryAddress?.city},{' '}
                        {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                      </p>
                    </div>

                    <div className="min-w-[200px] space-y-3">
                      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right">
                        <p className="text-xs text-emerald-700">Your earnings</p>
                        <p className="text-xl font-bold text-emerald-800">
                          ₹{Number(order.farmerTotal).toLocaleString('en-IN')}
                        </p>
                      </div>

                      {nextStatuses[order.status]?.length > 0 && (
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {nextStatuses[order.status].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusUpdate(order.id, status)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                status === 'Cancelled'
                                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {status === 'Delivered' ? (
                                <span className="inline-flex items-center gap-1">
                                  <FaCheckCircle /> Mark Delivered
                                </span>
                              ) : (
                                `Mark ${status}`
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default FarmerOrdersPage;
