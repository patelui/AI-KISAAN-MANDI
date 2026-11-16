import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt, FaMoneyBillWave } from 'react-icons/fa';
import BuyerLayout from '../components/Buyer/BuyerLayout';
import { useBuyerAddresses } from '../hooks/useBuyerAddresses';
import api from '../utils/api';
import { openRazorpayCheckout } from '../utils/razorpay';

const emptyForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

function BuyerCheckoutPage() {
  const navigate = useNavigate();
  const { addresses, loading: addressesLoading } = useBuyerAddresses();
  const [cart, setCart] = useState({ items: [] });
  const [paymentConfig, setPaymentConfig] = useState({
    razorpayEnabled: false,
    codEnabled: true,
    message: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const cartRes = await api.get('/buyer/cart');
        setCart(cartRes.data || { items: [] });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load cart');
        setLoading(false);
        return;
      }

      try {
        const configRes = await api.get('/buyer/payments/config');
        setPaymentConfig(configRes.data);
        if (configRes.data?.razorpayEnabled) {
          setPaymentMethod('razorpay');
        }
      } catch (err) {
        setPaymentConfig({
          razorpayEnabled: false,
          codEnabled: true,
          message:
            err.response?.status === 404
              ? 'Payment service not found. Restart the server (cd server && npm run dev).'
              : 'Online payment unavailable. You can still pay with Cash on Delivery.',
        });
        setPaymentMethod('cod');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!addressesLoading && addresses.length > 0) {
      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
      setUseNewAddress(false);
    } else if (!addressesLoading && addresses.length === 0) {
      setUseNewAddress(true);
    }
  }, [addresses, addressesLoading]);

  const subtotal = useMemo(
    () => (cart.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart.items]
  );

  const buildAddressPayload = () => {
    if (useNewAddress) {
      return {
        deliveryAddress: { ...form, isDefault: false },
        saveAddress,
      };
    }
    return { addressId: selectedAddressId };
  };

  const validateAddressForm = () => {
    if (!useNewAddress) {
      return true;
    }
    const required = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];
    return required.every((field) => String(form[field] || '').trim());
  };

  const placeCodOrder = async () => {
    const payload = {
      ...buildAddressPayload(),
      paymentMethod: 'Cash on Delivery',
    };
    const { data } = await api.post('/buyer/orders', payload);
    navigate('/buyer-order-success', { state: { order: data } });
  };

  const placeRazorpayOrder = async () => {
    const payload = buildAddressPayload();
    const { data: paymentData } = await api.post('/buyer/payments/razorpay/create', payload);

    const paymentResponse = await openRazorpayCheckout({
      paymentData,
      onDismiss: () => setSubmitting(false),
    });

    const { data: order } = await api.post('/buyer/payments/razorpay/verify', {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
    });

    navigate('/buyer-order-success', { state: { order } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateAddressForm()) {
      setError('Please complete all address fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (paymentMethod === 'razorpay' && paymentConfig.razorpayEnabled) {
        await placeRazorpayOrder();
      } else {
        await placeCodOrder();
      }
    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        setError(err.response?.data?.message || err.message || 'Checkout failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-1 text-sm text-slate-500">Choose shipping address and payment method</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              {addresses.length > 0 && (
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-800">Saved Addresses</p>
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                        !useNewAddress && selectedAddressId === address.id
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressChoice"
                        checked={!useNewAddress && selectedAddressId === address.id}
                        onChange={() => {
                          setUseNewAddress(false);
                          setSelectedAddressId(address.id);
                        }}
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {address.label}
                          {address.isDefault ? ' (Default)' : ''}
                        </p>
                        <p className="text-sm text-slate-600">
                          {address.fullName} · {address.phone}
                        </p>
                        <p className="text-sm text-slate-500">
                          {address.address}, {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="addressChoice"
                      checked={useNewAddress}
                      onChange={() => setUseNewAddress(true)}
                    />
                    Use a new address
                  </label>
                </div>
              )}

              {useNewAddress && (
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  <CheckoutInput label="Label" value={form.label} onChange={(v) => setForm((p) => ({ ...p, label: v }))} />
                  <CheckoutInput label="Full Name" value={form.fullName} onChange={(v) => setForm((p) => ({ ...p, fullName: v }))} required />
                  <CheckoutInput label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} required />
                  <CheckoutInput label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} className="md:col-span-2" required multiline />
                  <CheckoutInput label="City" value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} required />
                  <CheckoutInput label="State" value={form.state} onChange={(v) => setForm((p) => ({ ...p, state: v }))} required />
                  <CheckoutInput label="PIN Code" value={form.pincode} onChange={(v) => setForm((p) => ({ ...p, pincode: v }))} required />
                  <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-emerald-600" />
                    Save this address to Address Book
                  </label>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">Payment Method</p>

                {paymentConfig.razorpayEnabled && (
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${paymentMethod === 'razorpay' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                    <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                    <div>
                      <p className="flex items-center gap-2 font-medium text-slate-900">
                        <FaMobileAlt className="text-emerald-600" />
                        Pay Online (UPI / Card / Wallet)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Secured by Razorpay — Google Pay, PhonePe, UPI, debit/credit cards</p>
                    </div>
                  </label>
                )}

                {paymentConfig.codEnabled && (
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${paymentMethod === 'cod' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <div>
                      <p className="flex items-center gap-2 font-medium text-slate-900">
                        <FaMoneyBillWave className="text-emerald-600" />
                        Cash on Delivery
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Pay when your order is delivered</p>
                    </div>
                  </label>
                )}

                {!paymentConfig.razorpayEnabled && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {paymentConfig.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || (cart.items || []).length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {paymentMethod === 'razorpay' ? <FaCreditCard /> : <FaMoneyBillWave />}
                {submitting
                  ? 'Processing...'
                  : paymentMethod === 'razorpay'
                    ? `Pay ₹${subtotal.toLocaleString('en-IN')} Online`
                    : 'Place Order (COD)'}
              </button>
            </form>

            <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
              <div className="space-y-2 text-sm text-slate-600">
                {(cart.items || []).map((item) => (
                  <div key={item._id} className="flex justify-between gap-3">
                    <span>
                      {item.crop?.name || 'Crop'} × {item.quantity}
                    </span>
                    <span>₹{Number((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 font-semibold text-slate-900">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}

function CheckoutInput({ label, value, onChange, required, className = '', multiline = false }) {
  const classNames = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      {multiline ? (
        <textarea rows={3} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={classNames} />
      ) : (
        <input required={required} value={value} onChange={(e) => onChange(e.target.value)} className={classNames} />
      )}
    </div>
  );
}

export default BuyerCheckoutPage;
