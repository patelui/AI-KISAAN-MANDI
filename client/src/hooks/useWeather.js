import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { getCurrentWeatherForProfile } from '../utils/weather';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const readStoredProfile = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

const fetchProfile = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return readStoredProfile();
  }

  try {
    const { data } = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  } catch {
    return readStoredProfile();
  }
};

export const useWeather = ({ enabled = true } = {}) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  const loadWeather = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await fetchProfile();
      const weatherData = await getCurrentWeatherForProfile(profile || {});

      if (weatherData.temperature == null) {
        setError(weatherData.forecast || 'Unable to load weather data.');
      }

      setWeather(weatherData);
    } catch (err) {
      console.error('Failed to load weather:', err);
      setWeather(null);
      setError('Unable to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  return { weather, loading, error, reload: loadWeather };
};
