import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

const emptyForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
};

export const useBuyerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/buyer/addresses');
      setAddresses(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const saveAddress = async (form, editingId = null) => {
    if (editingId) {
      const { data } = await api.put(`/buyer/addresses/${editingId}`, form);
      await loadAddresses();
      return data;
    }

    const { data } = await api.post('/buyer/addresses', form);
    await loadAddresses();
    return data;
  };

  const deleteAddress = async (id) => {
    await api.delete(`/buyer/addresses/${id}`);
    await loadAddresses();
  };

  const setDefaultAddress = async (id) => {
    const { data } = await api.patch(`/buyer/addresses/${id}/default`);
    await loadAddresses();
    return data;
  };

  return {
    addresses,
    loading,
    error,
    emptyForm,
    reload: loadAddresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
  };
};
