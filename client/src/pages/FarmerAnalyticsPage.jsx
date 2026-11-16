import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaLightbulb, FaSeedling } from 'react-icons/fa';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import MarketInsight from '../components/MarketInsight/MarketInsight';
import PriceChart from '../components/Chart/PriceChart';
import { useCrops } from '../hooks/useCrops';

function FarmerAnalyticsPage() {
  const navigate = useNavigate();
  const { crops } = useCrops();
  const [selectedCrop, setSelectedCrop] = useState('Wheat');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'farmer') {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (crops.length > 0 && crops[0]?.name) {
      setSelectedCrop(crops[0].name);
    }
  }, [crops]);

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
          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-8 text-white shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">Farmer Analytics</p>
                <h1 className="mt-2 text-3xl font-bold">Market Intelligence Center</h1>
                <p className="mt-3 text-sm text-emerald-50 sm:text-base">
                  Deep mandi insights and price trend analytics to help you decide the best time
                  and rate to sell your crops for maximum profit.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                  <FaChartLine className="text-xl" />
                  <p className="mt-2 text-xs uppercase tracking-wide text-emerald-100">Live Trends</p>
                  <p className="text-sm font-semibold">Price charts</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                  <FaLightbulb className="text-xl" />
                  <p className="mt-2 text-xs uppercase tracking-wide text-emerald-100">Smart Insight</p>
                  <p className="text-sm font-semibold">Mandi rates</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                  <FaSeedling className="text-xl" />
                  <p className="mt-2 text-xs uppercase tracking-wide text-emerald-100">Your Crops</p>
                  <p className="text-sm font-semibold">{crops.length} listed</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              Currently analyzing:{' '}
              <span className="font-semibold text-emerald-700">{selectedCrop}</span>
              {' '}— search in either panel below to sync both views.
            </p>
          </section>

          <section>
            <MarketInsight
              variant="featured"
              commodity={selectedCrop}
              onCommodityChange={setSelectedCrop}
              disableRotation
            />
          </section>

          <section>
            <PriceChart
              variant="featured"
              farmerCrops={crops}
              commodity={selectedCrop}
              onCommodityChange={setSelectedCrop}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default FarmerAnalyticsPage;
