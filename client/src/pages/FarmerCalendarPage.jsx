import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import { getForecastForProfileAndDate } from '../utils/weather';

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

function FarmerCalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('Your farm location');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        return;
      }

      const loadWeather = async () => {
        setLoading(true);
        setError('');
        const profile = await fetchProfile();
        const result = await getForecastForProfileAndDate(profile || {}, selectedDate);
        setLocationName(result.locationName || 'Your farm location');
        setWeather(result.forecast || []);
        setError(result.error || '');
        setLoading(false);
      };

      loadWeather();
    } catch {
      navigate('/');
    }
  }, [navigate, selectedDate]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      days.push({
        value: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        day: date.getDate(),
        full: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      });
    }
    return days;
  }, []);


  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <Header onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }} />
        <main className="space-y-6 p-6">
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Crop Planning</p>
            <h1 className="text-2xl font-bold text-slate-900">Farmer Calendar</h1>
            <p className="mt-1 text-sm text-slate-600">Plan farm activities and review the weather for your selected day.</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">Calendar</h2>
              <div className="grid gap-3 md:grid-cols-7">
                {calendarDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setSelectedDate(day.value)}
                    className={`rounded-xl border px-3 py-4 text-left transition ${selectedDate === day.value ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{day.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">{day.day}</p>
                    <p className="text-sm text-slate-500">{day.full}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Weather Outlook</p>
                  <h2 className="text-xl font-semibold text-slate-800">{selectedDate}</h2>
                  <p className="text-sm text-slate-500">{locationName}</p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">4-hour view</div>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-slate-500">Loading weather forecast...</p>
              ) : error && (!weather || weather.length === 0) ? (
                <p className="mt-4 text-sm text-rose-600">{error}</p>
              ) : !weather || weather.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Weather data is currently unavailable.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {weather.map((entry) => (
                    <div key={entry.time} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{new Date(entry.time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
                        <p className="text-xs text-slate-500">Rain chance {entry.rain ?? 0}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">{entry.temp ?? '--'}°C</p>
                        <p className="text-xs text-slate-500">{entry.condition || 'Clear skies'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default FarmerCalendarPage;
