import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

const defaultStats = {
  cartItems: 0,
  cartTotal: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalSpent: 0,
  savedAddresses: 0,
};

export const useBuyerDashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/buyer/dashboard');
      setStats(data.stats || defaultStats);
      setRecentOrders(data.recentOrders || []);
    } catch {
      setStats(defaultStats);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return { stats, recentOrders, loading, reload: loadDashboard };
};
