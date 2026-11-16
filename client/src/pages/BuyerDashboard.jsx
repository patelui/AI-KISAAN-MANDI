import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBox,
  FaMapMarkerAlt,
  FaRobot,
  FaRupeeSign,
  FaShoppingCart,
} from 'react-icons/fa';
import BuyerLayout from '../components/Buyer/BuyerLayout';
import MarketplaceCropCard from '../components/Marketplace/MarketplaceCropCard';
import { useBuyerDashboard } from '../hooks/useBuyerDashboard';
import api from '../utils/api';

const qualityOptions = ['', 'Standard', 'Premium', 'Organic'];

function BuyerDashboard() {
  const navigate = useNavigate();
  const { stats, recentOrders, loading: dashboardLoading } = useBuyerDashboard();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    location: '',
    quality: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { mandi: 'true' };
        if (filters.name.trim()) params.name = filters.name.trim();
        if (filters.location.trim()) params.location = filters.location.trim();
        if (filters.quality) params.quality = filters.quality;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        const { data } = await api.get('/crops', { params });
        setCrops(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load crops');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchCrops, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const submitAddToCart = async () => {
    if (!selectedCrop) return;
    setAdding(true);
    setMessage('');
    try {
      await api.post('/buyer/cart', { cropId: selectedCrop._id, quantity });
      setMessage('Added to cart successfully');
      setSelectedCrop(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const buyerName = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.fullName?.trim() || stored.email || 'Buyer';
    } catch {
      return 'Buyer';
    }
  }, []);

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">Welcome</p>
          <h1 className="mt-2 text-2xl font-bold">Hello, {buyerName}</h1>
          <p className="mt-2 text-sm text-emerald-50">Browse fresh crops, compare mandi prices, and order directly from farmers.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatPill icon={FaShoppingCart} label="Cart Items" value={dashboardLoading ? '—' : stats.cartItems} />
            <StatPill icon={FaRupeeSign} label="Cart Total" value={dashboardLoading ? '—' : `₹${Number(stats.cartTotal || 0).toLocaleString('en-IN')}`} />
            <StatPill icon={FaBox} label="Orders" value={dashboardLoading ? '—' : stats.totalOrders} />
            <StatPill icon={FaMapMarkerAlt} label="Saved Addresses" value={dashboardLoading ? '—' : stats.savedAddresses} />
          </div>
        </section>

        {!dashboardLoading && recentOrders.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Orders</h2>
              <button type="button" onClick={() => navigate('/buyer-orders')} className="text-sm text-emerald-700 hover:underline">View all</button>
            </div>
            <div className="space-y-2">
              {recentOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-slate-700">{order.items?.map((i) => i.cropName).join(', ') || 'Order'}</span>
                  <span className="font-medium text-emerald-700">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <button type="button" onClick={() => navigate('/buyer-assistant')} className="flex w-full items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-left transition hover:bg-indigo-100">
            <div className="flex items-center gap-3">
              <FaRobot className="text-indigo-600" />
              <div>
                <p className="font-semibold text-indigo-900">AI Shopping Assistant</p>
                <p className="text-xs text-indigo-700">Ask about cart, orders, addresses & mandi prices</p>
              </div>
            </div>
            <span className="text-sm font-medium text-indigo-700">Open →</span>
          </button>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">Marketplace</h2>
              <p className="text-xs text-slate-500">Live crop listings with mandi comparison</p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterInput value={filters.name} onChange={(v) => setFilters((p) => ({ ...p, name: v }))} placeholder="Crop name" />
            <FilterInput value={filters.location} onChange={(v) => setFilters((p) => ({ ...p, location: v }))} placeholder="Location" />
            <select value={filters.quality} onChange={(e) => setFilters((p) => ({ ...p, quality: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
              {qualityOptions.map((o) => <option key={o || 'all'} value={o}>{o || 'All qualities'}</option>)}
            </select>
            <FilterInput value={filters.minPrice} onChange={(v) => setFilters((p) => ({ ...p, minPrice: v }))} placeholder="Min price" type="number" />
            <FilterInput value={filters.maxPrice} onChange={(v) => setFilters((p) => ({ ...p, maxPrice: v }))} placeholder="Max price" type="number" />
          </div>

          {message && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
          {loading && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}
          {error && !loading && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && crops.length === 0 && <p className="text-sm text-slate-500">No crops match your filters.</p>}

          {!loading && !error && crops.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {crops.map((crop) => (
                <MarketplaceCropCard key={crop._id} crop={crop} onViewDetails={setSelectedCrop} onAddToCart={setSelectedCrop} />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 text-slate-800 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-900">{selectedCrop.name}</h3>
              <button type="button" onClick={() => setSelectedCrop(null)} className="text-sm text-slate-400">Close</button>
            </div>
            {selectedCrop.image && <img src={selectedCrop.image} alt={selectedCrop.name} className="mb-4 h-40 w-full rounded-xl object-cover" />}
            <p className="text-sm">Price: ₹{Number(selectedCrop.price).toLocaleString('en-IN')} / qtl</p>
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm text-slate-500">Qty</label>
              <input type="number" min="1" max={selectedCrop.quantity || 10} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <button type="button" disabled={adding} onClick={submitAddToCart} className="mt-5 w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
      <Icon className="text-emerald-300" />
      <p className="mt-1 text-xs text-slate-300">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function FilterInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    />
  );
}

export default BuyerDashboard;
