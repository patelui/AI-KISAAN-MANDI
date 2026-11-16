import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaLeaf, FaSeedling } from 'react-icons/fa';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import DashboardStats from '../components/DashboardStats/DashboardStats';
import QuickActions from '../components/QuickActions/QuickActions';
import MarketInsight from '../components/MarketInsight/MarketInsight';
import Weather from '../components/Weather/Weather';
import TopCropsCard from '../components/TopCrops/TopCropsCard';
import AssistantPromo from '../components/AssistantPromo/AssistantPromo';
import Notification from '../components/Notification/Notification';
import PriceChart from '../components/Chart/PriceChart';
import { useCrops } from '../hooks/useCrops';
import { useWeather } from '../hooks/useWeather';
import { useFarmerDashboard } from '../hooks/useFarmerDashboard';

function FarmerDashboard() {
  const navigate = useNavigate();
  const { crops, loading } = useCrops();
  const { weather: weatherData, loading: weatherLoading, error: weatherError, reload: reloadWeather } = useWeather();
  const {
    stats,
    notifications,
    loading: dashboardLoading,
  } = useFarmerDashboard(crops.length);
  const notificationsRef = useRef(null);

  const farmerName = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) {
        return 'Farmer';
      }
      const parsed = JSON.parse(stored);
      return parsed.fullName?.trim() || parsed.farmOrBusinessName?.trim() || parsed.email || 'Farmer';
    } catch {
      return 'Farmer';
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    const parsed = JSON.parse(user);
    if (parsed.role !== 'farmer') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-listing':
      case 'manage-listings':
        navigate('/farmer-crops');
        break;
      case 'orders':
        navigate('/farmer-orders');
        break;
      case 'market':
        navigate('/farmer-analytics');
        break;
      case 'notifications':
        notificationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'assistant':
        navigate('/farmer-assistant');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <Header onLogout={handleLogout} />
        <main className="space-y-6 p-6">
          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 p-6 text-white shadow-lg sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                  Farmer Dashboard
                </p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Welcome back, {farmerName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">
                  Track your listings, mandi prices, and orders from one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                  <FaSeedling className="text-lg" />
                  <p className="mt-1 text-xs uppercase tracking-wide text-emerald-100">Listings</p>
                  <p className="text-lg font-semibold">{loading ? '—' : crops.length}</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                  <FaChartLine className="text-lg" />
                  <p className="mt-1 text-xs uppercase tracking-wide text-emerald-100">Revenue</p>
                  <p className="text-lg font-semibold">
                    {dashboardLoading ? '—' : `₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
                  </p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
                  <FaLeaf className="text-lg" />
                  <p className="mt-1 text-xs uppercase tracking-wide text-emerald-100">Pending</p>
                  <p className="text-lg font-semibold">
                    {dashboardLoading ? '—' : stats.pendingOrders}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <DashboardStats stats={stats} loading={dashboardLoading} />

          <AssistantPromo />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <QuickActions onAction={handleQuickAction} />
            <div className="lg:col-span-2">
              <Weather
                weather={weatherData}
                loading={weatherLoading}
                error={weatherError}
                onRetry={reloadWeather}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MarketInsight />
            <PriceChart farmerCrops={crops} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopCropsCard crops={crops} loading={loading} limit={5} />
            <div ref={notificationsRef}>
              <Notification notifications={notifications} loading={dashboardLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default FarmerDashboard;
