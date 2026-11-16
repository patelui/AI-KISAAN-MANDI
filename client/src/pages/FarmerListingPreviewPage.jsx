import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import MarketplaceCropCard from '../components/Marketplace/MarketplaceCropCard';
import api from '../utils/api';

function FarmerListingPreviewPage() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data } = await api.get('/crops/my', { params: { mandi: 'true' } });
        setCrops(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <Header onLogout={handleLogout} />
        <main className="space-y-6 p-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <FaEye />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Listing Preview</h1>
                <p className="mt-1 text-sm text-slate-500">
                  See how buyers view your crops in the marketplace, with mandi price comparison.
                </p>
              </div>
            </div>
          </section>

          {loading && <p className="text-sm text-slate-500">Loading your listings...</p>}
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          {!loading && !error && crops.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="font-medium text-slate-700">No listings to preview</p>
              <button
                type="button"
                onClick={() => navigate('/farmer-crops')}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Add crop listing
              </button>
            </div>
          )}

          {!loading && !error && crops.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {crops.map((crop) => (
                  <MarketplaceCropCard key={crop._id} crop={crop} theme="light" preview />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default FarmerListingPreviewPage;
