import { useEffect, useState } from 'react';
import BuyerLayout from '../components/Buyer/BuyerLayout';
import api from '../utils/api';

function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/buyer/orders');
        setOrders(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors = {
    Pending: 'bg-amber-100 text-amber-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-indigo-100 text-indigo-800',
    Delivered: 'bg-emerald-100 text-emerald-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Order History</h1>
          <p className="mt-1 text-sm text-slate-500">Track your past and current orders</p>
        </section>

        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            No orders yet. Browse the marketplace to place your first order.
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Order ID</p>
                    <p className="font-semibold text-slate-900">{String(order._id).slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="font-semibold text-emerald-700">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-medium text-slate-800">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] || statusColors.Pending}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="mb-2 font-semibold text-slate-900">Items</p>
                  <ul className="space-y-1">
                    {order.items?.map((item, index) => (
                      <li key={`${order._id}-${index}`}>{item.cropName} × {item.quantity} qtl @ ₹{Number(item.price).toLocaleString('en-IN')}/qtl</li>
                    ))}
                  </ul>
                  {order.deliveryAddress && (
                    <p className="mt-3 text-xs text-slate-500">
                      Deliver to: {order.deliveryAddress.address}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}

export default BuyerOrdersPage;
