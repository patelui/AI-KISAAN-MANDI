import { useState, useEffect, useCallback } from 'react';
import api, { getAuthToken } from '../utils/api';

export const useCrops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCrops = useCallback(async () => {
    try {
      if (!getAuthToken()) {
        setLoading(false);
        return;
      }

      const { data } = await api.get('/crops/my');
      setCrops(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch crops');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCrop = async (cropData) => {
    try {
      if (!getAuthToken()) {
        throw new Error('You must be logged in');
      }

      const formData = new FormData();
      formData.append('name', cropData?.name || cropData?.cropName || cropData?.crop || '');
      formData.append('price', String(Number(cropData?.price)));
      if (cropData?.quantity !== undefined && cropData?.quantity !== '') {
        formData.append('quantity', String(Number(cropData.quantity)));
      }
      formData.append('location', cropData?.location || 'India');
      formData.append('quality', cropData?.quality || 'Standard');
      if (cropData?.imageFile instanceof File) {
        formData.append('image', cropData.imageFile);
      }

      const { data } = await api.post('/crops', formData);

      setCrops((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      let message = err.response?.data?.message || err.message || 'Failed to add crop';

      if (err.sessionExpired || err.response?.status === 401) {
        message = 'Your session expired or is invalid. Please log out and log in again, then retry.';
      }

      return { success: false, error: message };
    }
  };

  const updateCrop = async (id, cropData) => {
    try {
      if (!getAuthToken()) {
        throw new Error('You must be logged in');
      }

      const formData = new FormData();
      if (cropData?.name !== undefined) formData.append('name', cropData.name);
      if (cropData?.price !== undefined) formData.append('price', String(Number(cropData.price)));
      if (cropData?.quantity !== undefined && cropData?.quantity !== '') {
        formData.append('quantity', String(Number(cropData.quantity)));
      }
      if (cropData?.location !== undefined) formData.append('location', cropData.location || 'India');
      if (cropData?.quality !== undefined) formData.append('quality', cropData.quality || 'Standard');
      if (cropData?.imageFile instanceof File) {
        formData.append('image', cropData.imageFile);
      }

      const { data } = await api.put(`/crops/${id}`, formData);

      setCrops((prev) => prev.map((crop) => (crop._id === id ? data : crop)));
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update crop';
      return { success: false, error: message };
    }
  };

  const deleteCrop = async (id) => {
    try {
      if (!getAuthToken()) {
        throw new Error('You must be logged in');
      }

      await api.delete(`/crops/${id}`);

      setCrops((prev) => prev.filter((crop) => crop._id !== id));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to delete crop';
      return { success: false, error: message };
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  return { crops, loading, error, fetchCrops, addCrop, updateCrop, deleteCrop };
};
