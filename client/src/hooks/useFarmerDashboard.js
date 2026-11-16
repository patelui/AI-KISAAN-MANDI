import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const defaultStats = {
  totalProducts: 0,
  activeListings: 0,
  totalRevenue: 0,
  pendingOrders: 0,
};

export const useFarmerDashboard = (refreshKey = 0) => {
  const [stats, setStats] = useState(defaultStats);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await axios.get(`${API_BASE_URL}/farmer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(data.stats || defaultStats);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load farmer dashboard:', err);
      setError(err.response?.data?.message || 'Unable to load dashboard data.');
      setStats(defaultStats);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  return {
    stats,
    notifications,
    loading,
    error,
    reload: loadDashboard,
  };
};
