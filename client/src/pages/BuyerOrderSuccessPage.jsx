import { useLocation, useNavigate } from 'react-router-dom';
import BuyerLayout from '../components/Buyer/BuyerLayout';

function BuyerOrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <BuyerLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white">✓</div>
          <h1 className="text-2xl font-bold text-slate-900">Order Placed Successfully</h1>
          <p className="mt-2 text-slate-500">Your order has been received and is awaiting confirmation.</p>
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-sm text-slate-700">
            <p><span className="text-slate-400">Order ID:</span> <span className="font-semibold">{order?._id ? String(order._id).slice(-8).toUpperCase() : 'N/A'}</span></p>
            <p className="mt-2"><span className="text-slate-400">Amount:</span> <span className="font-semibold text-emerald-700">₹{Number(order?.totalAmount || 0).toLocaleString('en-IN')}</span></p>
            <p className="mt-2"><span className="text-slate-400">Payment:</span> <span className="font-semibold">{order?.paymentMethod || 'Cash on Delivery'}</span></p>
            {order?.paymentStatus === 'paid' && (
              <p className="mt-2 text-emerald-400">Payment received successfully</p>
            )}
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => navigate('/buyer-dashboard')} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">Continue Shopping</button>
            <button type="button" onClick={() => navigate('/buyer-orders')} className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">View Order History</button>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}

export default BuyerOrderSuccessPage;
