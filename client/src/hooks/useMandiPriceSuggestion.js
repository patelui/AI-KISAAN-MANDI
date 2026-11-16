import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { parseLocationForMandi } from '../utils/mandiLocation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const useMandiPriceSuggestion = ({
  commodity = '',
  location = '',
  enabled = true,
} = {}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const fetchSuggestion = useCallback(async (cropName, locationInput) => {
    const trimmedCrop = String(cropName || '').trim();
    if (!trimmedCrop) {
      setSuggestion(null);
      setError('');
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError('');

    const { state, district } = parseLocationForMandi(locationInput);

    try {
      const { data } = await axios.get(`${API_BASE_URL}/market-insights`, {
        params: {
          commodity: trimmedCrop,
          state,
          district,
        },
      });

      if (requestId !== requestIdRef.current) {
        return null;
      }

      const insight = {
        commodity: data.commodity || trimmedCrop,
        modalPrice: Number(data.modalPrice ?? data.modal_price ?? data.price ?? 0),
        minPrice: Number(data.minPrice ?? data.min_price ?? 0),
        maxPrice: Number(data.maxPrice ?? data.max_price ?? 0),
        market: data.market || `${district} APMC`,
        district,
        state,
        unit: data.unit || 'Rs/Quintal',
      };

      setSuggestion(insight);
      return insight;
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return null;
      }

      console.error('Mandi price suggestion failed:', err);
      setSuggestion(null);
      setError('Unable to fetch mandi price for this crop and location.');
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const trimmedCrop = String(commodity || '').trim();
    if (!trimmedCrop) {
      setSuggestion(null);
      setError('');
      setLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      fetchSuggestion(trimmedCrop, location);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [commodity, location, enabled, fetchSuggestion]);

  return {
    suggestion,
    loading,
    error,
    refresh: () => fetchSuggestion(commodity, location),
  };
};
