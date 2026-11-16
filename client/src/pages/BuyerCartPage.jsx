import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerLayout from '../components/Buyer/BuyerLayout';
import api from '../utils/api';

function BuyerCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/buyer/cart');
      setCart(data || { items: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = useMemo(
    () => (cart.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart.items]
  );

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const { data } = await api.put(`/buyer/cart/${itemId}`, { quantity });
      setCart(data || { items: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await api.delete(`/buyer/cart/${itemId}`);
      setCart(data || { items: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove item');
    }
  };

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Your Cart</h1>
          <p className="mt-1 text-sm text-slate-500">Review selected crops before checkout</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        ) : (cart.items || []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="font-medium text-slate-700">Your cart is empty</p>
            <button type="button" onClick={() => navigate('/buyer-dashboard')} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {(cart.items || []).map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.crop?.name || 'Crop'}</h3>
                      <p className="text-sm text-slate-500">Farmer: {item.crop?.farmer?.fullName || item.crop?.farmer?.email || 'Unknown'}</p>
                      <p className="text-sm text-emerald-700">₹{Number(item.price || 0).toLocaleString('en-IN')} / qtl</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(item._id, Number(item.quantity || 1) - 1)} className="rounded-lg border px-2 py-1 text-sm">−</button>
                      <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item._id, Number(item.quantity || 1) + 1)} className="rounded-lg border px-2 py-1 text-sm">+</button>
                      <button type="button" onClick={() => removeItem(item._id)} className="ml-2 rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
                <span>Total</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <button type="button" onClick={() => navigate('/buyer-checkout')} className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}

export default BuyerCartPage;
