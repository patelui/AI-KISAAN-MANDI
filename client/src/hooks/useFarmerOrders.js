import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

export const useFarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = useCallback(async (status = statusFilter) => {
    setLoading(true);
    setError('');

    try {
      const params = status !== 'all' ? { status } : {};
      const { data } = await api.get('/farmer/orders', { params });
      setOrders(data.orders || []);
      setStats(data.stats || { total: 0, pending: 0, revenue: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [fetchOrders, statusFilter]);

  const updateOrderStatus = async (orderId, status) => {
    const { data } = await api.patch(`/farmer/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((order) => (order.id === data.id ? data : order)));
    await fetchOrders(statusFilter);
    return data;
  };

  return {
    orders,
    stats,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    fetchOrders,
    updateOrderStatus,
  };
};
