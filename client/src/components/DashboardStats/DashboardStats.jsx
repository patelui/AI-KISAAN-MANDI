import StatsCard from '../StatsCard/StatsCard';
import { FaBox, FaShoppingCart, FaRupeeSign, FaClock } from 'react-icons/fa';

const DashboardStats = ({ stats, loading = false }) => {
  const statsConfig = [
    {
      icon: FaBox,
      title: 'Total Products',
      value: loading ? '—' : stats.totalProducts,
      color: 'bg-blue-500',
    },
    {
      icon: FaShoppingCart,
      title: 'Active Listings',
      value: loading ? '—' : stats.activeListings,
      color: 'bg-green-500',
    },
    {
      icon: FaRupeeSign,
      title: 'Revenue',
      value: loading ? '—' : `₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
      color: 'bg-purple-500',
    },
    {
      icon: FaClock,
      title: 'Pending Orders',
      value: loading ? '—' : stats.pendingOrders,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
