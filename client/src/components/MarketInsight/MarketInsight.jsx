import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown, FaMinus, FaRedo, FaSearch, FaTimes } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ROTATION_INTERVAL_MS = 10000;

const ROTATION_CROPS = [
  'Wheat',
  'Rice',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Potato',
  'Onion',
  'Soybean',
  'Tomato',
  'Groundnut',
  'Mustard',
  'Bajra',
  'Gram',
  'Chilli',
];

const DEFAULT_STATE = 'Gujarat';
const DEFAULT_DISTRICT = 'Vadodara';

const normalizeTrend = (trend) => {
  const normalized = `${trend || ''}`.toLowerCase().trim();
  if (['up', 'rise', 'increasing', 'increased'].includes(normalized)) return 'up';
  if (['down', 'fall', 'decreasing', 'decreased'].includes(normalized)) return 'down';
  if (['stable', 'flat', 'steady'].includes(normalized)) return 'stable';
  return '';
};

const formatChange = (changeValue) => {
  if (typeof changeValue === 'number') {
    return `${changeValue >= 0 ? '+' : ''}₹${Math.abs(changeValue)}`;
  }

  if (changeValue != null) {
    return String(changeValue);
  }

  return '₹0';
};

const normalizeInsight = (value) => {
  if (!value || typeof value !== 'object') return null;

  const modalPrice = value.modalPrice ?? value.modal_price ?? value.price ?? value.currentPrice ?? value.current_price ?? null;
  const minPrice = value.minPrice ?? value.min_price ?? value.minimumPrice ?? value.minimum_price ?? null;
  const maxPrice = value.maxPrice ?? value.max_price ?? value.maximumPrice ?? value.maximum_price ?? null;
  const changeValue = value.change ?? value.changePercent ?? value.percentChange ?? value.priceChange ?? value.delta ?? null;

  return {
    commodity: value.commodity || value.crop || value.name || 'Wheat',
    market: value.market || value.marketName || value.market_name || value.location || 'N/A',
    modalPrice,
    minPrice,
    maxPrice,
    unit: value.unit || 'Rs/Quintal',
    lastUpdated: value.lastUpdated || value.last_updated || value.updatedAt || value.updated_at || 'N/A',
    trend: normalizeTrend(value.trend || value.direction || value.status),
    change: formatChange(changeValue),
  };
};

const readProfileLocation = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return { state: DEFAULT_STATE, district: DEFAULT_DISTRICT };
    }

    const profile = JSON.parse(storedUser);
    return {
      state: profile.state?.trim() || DEFAULT_STATE,
      district: profile.district?.trim() || profile.city?.trim() || DEFAULT_DISTRICT,
    };
  } catch {
    return { state: DEFAULT_STATE, district: DEFAULT_DISTRICT };
  }
};

const MarketInsight = ({
  variant = 'default',
  commodity: controlledCommodity,
  onCommodityChange,
  disableRotation = false,
}) => {
  const isFeatured = variant === 'featured';
  const [insight, setInsight] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalCommodity, setInternalCommodity] = useState(ROTATION_CROPS[0]);
  const activeCommodity = controlledCommodity ?? internalCommodity;

  const updateCommodity = useCallback((value) => {
    if (onCommodityChange) {
      onCommodityChange(value);
    } else {
      setInternalCommodity(value);
    }
  }, [onCommodityChange]);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isSearchLocked, setIsSearchLocked] = useState(false);

  const requestIdRef = useRef(0);
  const locationRef = useRef(readProfileLocation());

  const loadInsight = useCallback(async (commodity, { isInitial = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (isInitial) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const { state, district } = locationRef.current;
      const { data } = await axios.get(`${API_BASE_URL}/market-insights`, {
        params: {
          commodity,
          state,
          district,
        },
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const payload = data?.insight ?? data;
      setInsight(normalizeInsight(payload));
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error('Failed to fetch market insight:', err);
      setError('Unable to fetch latest market data.');
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    locationRef.current = readProfileLocation();
    loadInsight(activeCommodity, { isInitial: true });
  }, [activeCommodity, loadInsight]);

  useEffect(() => {
    if (isSearchLocked || disableRotation || controlledCommodity) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRotationIndex((previousIndex) => {
        const nextIndex = (previousIndex + 1) % ROTATION_CROPS.length;
        updateCommodity(ROTATION_CROPS[nextIndex]);
        return nextIndex;
      });
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isSearchLocked, disableRotation, controlledCommodity, updateCommodity]);

  const handleSearch = (event) => {
    event?.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    setIsSearchLocked(true);
    updateCommodity(trimmed);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchLocked(false);
    setRotationIndex(0);
    updateCommodity(ROTATION_CROPS[0]);
  };

  const trendColor = useMemo(() => {
    if (!insight?.trend) return 'text-slate-500';
    if (insight.trend === 'up') return 'text-green-600';
    if (insight.trend === 'down') return 'text-red-600';
    if (insight.trend === 'stable') return 'text-blue-600';
    return 'text-slate-500';
  }, [insight?.trend]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <FaArrowUp className="text-green-500" />;
      case 'down':
        return <FaArrowDown className="text-red-500" />;
      case 'stable':
        return <FaMinus className="text-blue-500" />;
      default:
        return <FaMinus className="text-gray-500" />;
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm ${
        isFeatured
          ? 'border-emerald-200 p-8 shadow-lg shadow-emerald-100/40'
          : 'border-slate-200 p-6'
      }`}
    >
      <div className={`mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${isFeatured ? 'mb-6' : ''}`}>
        <div>
          {isFeatured ? (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Live Mandi Intelligence</p>
          ) : null}
          <h3 className={`font-semibold text-slate-800 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
            {isFeatured ? 'Market Insight Analytics' : 'Market Insight'}
          </h3>
          <p className={`text-slate-500 ${isFeatured ? 'mt-1 text-base' : 'text-sm'}`}>
            {isSearchLocked
              ? `Showing search result for ${activeCommodity}`
              : disableRotation || controlledCommodity
                ? 'Real-time mandi price snapshot for your selected crop'
                : 'Auto-rotating mandi prices every 10 seconds'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Updating...
            </span>
          ) : null}
          {!initialLoading && !error ? (
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Live
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search crop e.g. Wheat, Rice, Tomato"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <FaSearch />
            Search
          </button>
          {isSearchLocked ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <FaTimes />
              Auto
            </button>
          ) : null}
        </div>
      </form>

      {!isSearchLocked && !disableRotation && !controlledCommodity ? (
        <div className={`mb-4 flex flex-wrap gap-2 ${isFeatured ? 'mb-6' : ''}`}>
          {ROTATION_CROPS.map((crop, index) => (
            <button
              key={crop}
              type="button"
              onClick={() => updateCommodity(crop)}
              className={`rounded-full font-medium transition ${
                isFeatured ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
              } ${
                activeCommodity === crop || rotationIndex === index
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      ) : null}

      {initialLoading ? (
        renderSkeleton()
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadInsight(activeCommodity, { isInitial: true })}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 font-medium text-white transition hover:bg-rose-700"
          >
            <FaRedo />
            Retry
          </button>
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity duration-300 ${refreshing ? 'opacity-70' : 'opacity-100'} ${isFeatured ? 'space-y-6' : ''}`}>
          <div className={`rounded-xl border border-slate-200 bg-slate-50 ${isFeatured ? 'p-6' : 'p-4'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Crop</p>
                <p className={`font-semibold text-slate-900 ${isFeatured ? 'text-3xl' : 'text-lg'}`}>
                  {insight?.commodity || activeCommodity}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {insight?.trend || 'unknown'}
              </div>
            </div>
          </div>

          <div className={`grid gap-3 ${isFeatured ? 'gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className={`rounded-xl border border-slate-200 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Market</p>
              <p className={`mt-1 font-semibold text-slate-900 ${isFeatured ? 'text-lg' : ''}`}>{insight?.market || 'N/A'}</p>
            </div>
            <div className={`rounded-xl border border-slate-200 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Today&apos;s Price</p>
              <p className={`mt-1 font-semibold text-slate-900 ${isFeatured ? 'text-4xl text-emerald-700' : 'text-xl'}`}>
                {insight?.modalPrice == null ? 'N/A' : `₹${insight.modalPrice}`}
              </p>
            </div>
            <div className={`rounded-xl border border-slate-200 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Trend</p>
              <div className={`mt-1 flex items-center gap-2 font-semibold ${trendColor}`}>
                {getTrendIcon(insight?.trend)}
                <span className="capitalize">{insight?.trend || 'unknown'}</span>
              </div>
            </div>
            <div className={`rounded-xl border border-slate-200 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Change</p>
              <p className={`mt-1 font-semibold ${trendColor} ${isFeatured ? 'text-xl' : ''}`}>{insight?.change || '₹0'}</p>
            </div>
            <div className={`rounded-xl border border-slate-200 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Minimum Price</p>
              <p className={`mt-1 font-semibold text-slate-900 ${isFeatured ? 'text-xl' : ''}`}>
                {insight?.minPrice == null ? 'N/A' : `₹${insight.minPrice}`}
              </p>
            </div>
            <div className={`rounded-xl border border-slate-200 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Maximum Price</p>
              <p className={`mt-1 font-semibold text-slate-900 ${isFeatured ? 'text-xl' : ''}`}>
                {insight?.maxPrice == null ? 'N/A' : `₹${insight.maxPrice}`}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Updated: {insight?.lastUpdated || 'N/A'}</span>
              <span className="font-medium text-slate-700">Unit: {insight?.unit || 'Rs/Quintal'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketInsight;
