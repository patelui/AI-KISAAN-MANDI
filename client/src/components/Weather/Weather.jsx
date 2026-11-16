import { FaSun, FaCloud, FaCloudRain, FaCloudSun, FaSmog, FaSnowflake, FaBolt } from 'react-icons/fa';

const Weather = ({ weather, loading = false, error = '', onRetry }) => {
  const getWeatherIcon = (condition) => {
    const iconClass = 'text-4xl';

    if (!condition) {
      return <FaSun className={`${iconClass} text-yellow-500`} />;
    }

    const normalized = condition.toLowerCase();

    if (normalized.includes('thunder')) {
      return <FaBolt className={`${iconClass} text-amber-500`} />;
    }
    if (normalized.includes('snow')) {
      return <FaSnowflake className={`${iconClass} text-sky-400`} />;
    }
    if (normalized.includes('fog')) {
      return <FaSmog className={`${iconClass} text-slate-400`} />;
    }
    if (normalized.includes('rain') || normalized.includes('drizzle') || normalized.includes('shower')) {
      return <FaCloudRain className={`${iconClass} text-blue-500`} />;
    }
    if (normalized.includes('partly') || normalized.includes('mostly')) {
      return <FaCloudSun className={`${iconClass} text-amber-400`} />;
    }
    if (normalized.includes('cloud')) {
      return <FaCloud className={`${iconClass} text-gray-500`} />;
    }

    return <FaSun className={`${iconClass} text-yellow-500`} />;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-6 w-14 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="ml-auto h-4 w-28 animate-pulse rounded bg-slate-100" />
            <div className="ml-auto h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (error && weather?.temperature == null) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Weather</h3>
            <p className="text-sm text-slate-500">{weather?.locationName || 'Your farm location'}</p>
          </div>
        </div>
        <p className="text-sm text-rose-600">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Weather</h3>
          <p className="text-sm text-slate-500">{weather?.locationName || 'Your farm location'}</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Live
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {getWeatherIcon(weather?.condition)}
          <div>
            <p className="text-3xl font-bold text-slate-900">
              {weather?.temperature != null ? `${weather.temperature}°C` : '—'}
            </p>
            <p className="text-gray-700">{weather?.condition || 'Loading condition'}</p>
          </div>
        </div>
        <div className="text-right text-sm text-slate-700">
          <p>Humidity: {weather?.humidity != null ? `${weather.humidity}%` : '—'}</p>
          <p>Wind: {weather?.windSpeed != null ? `${weather.windSpeed} km/h` : '—'}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{weather?.forecast || 'Fetching latest conditions...'}</p>
      {weather?.isFallbackLocation ? (
        <p className="mt-2 text-xs text-amber-600">
          Showing default city weather. Add your city in Profile for accurate local data.
        </p>
      ) : null}
    </div>
  );
};

export default Weather;
