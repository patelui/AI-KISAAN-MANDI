import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FaArrowDown, FaArrowUp, FaMinus, FaRedo, FaSearch } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const PERIOD_OPTIONS = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '1M' },
  { id: '90d', label: '3M' },
  { id: '180d', label: '6M' },
];

const QUICK_CROPS = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Onion', 'Potato', 'Tomato', 'Soybean'];

const DEFAULT_STATE = 'Gujarat';
const DEFAULT_DISTRICT = 'Vadodara';

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

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const recommendationStyles = {
  sell: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  hold: 'border-amber-200 bg-amber-50 text-amber-800',
  wait: 'border-sky-200 bg-sky-50 text-sky-800',
  monitor: 'border-slate-200 bg-slate-50 text-slate-800',
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <p className="font-semibold text-emerald-300">{point.label || point.date}</p>
      <p>Close: {formatCurrency(point.price)}</p>
      <p>High: {formatCurrency(point.high)}</p>
      <p>Low: {formatCurrency(point.low)}</p>
      <p className="text-slate-400">Volume: {Number(point.volume || 0).toLocaleString('en-IN')}</p>
    </div>
  );
};

const PriceChart = ({
  farmerCrops = [],
  variant = 'default',
  commodity: controlledCommodity,
  onCommodityChange,
}) => {
  const isFeatured = variant === 'featured';
  const [internalCommodity, setInternalCommodity] = useState('Wheat');
  const commodity = controlledCommodity ?? internalCommodity;
  const [searchQuery, setSearchQuery] = useState('Wheat');
  const [period, setPeriod] = useState('30d');
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);
  const locationRef = useRef(readProfileLocation());
  const initialCropSetRef = useRef(false);

  const updateCommodity = useCallback((value) => {
    if (onCommodityChange) {
      onCommodityChange(value);
    } else {
      setInternalCommodity(value);
    }
    setSearchQuery(value);
  }, [onCommodityChange]);

  const farmerCropNames = useMemo(() => {
    const names = farmerCrops
      .map((crop) => crop.name?.trim())
      .filter(Boolean);

    return [...new Set(names)];
  }, [farmerCrops]);

  const loadTrend = useCallback(async (selectedCommodity, selectedPeriod) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError('');

    try {
      const { state, district } = locationRef.current;
      const { data } = await axios.get(`${API_BASE_URL}/market-insights/trend`, {
        params: {
          commodity: selectedCommodity,
          state,
          district,
          period: selectedPeriod,
        },
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setTrendData(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error('Failed to fetch market trend:', err);
      const message = err.response?.data?.message || err.message || 'Unable to load price trend data.';
      setError(message.includes('404') || err.response?.status === 404
        ? 'Price trend API not found. Restart the backend server and try again.'
        : message);
      setTrendData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    locationRef.current = readProfileLocation();

    if (!initialCropSetRef.current && farmerCropNames.length > 0) {
      initialCropSetRef.current = true;
      updateCommodity(farmerCropNames[0]);
    }
  }, [farmerCropNames, updateCommodity]);

  useEffect(() => {
    if (controlledCommodity) {
      setSearchQuery(controlledCommodity);
    }
  }, [controlledCommodity]);

  useEffect(() => {
    if (!commodity) {
      return;
    }

    loadTrend(commodity, period);
  }, [commodity, period, loadTrend]);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    updateCommodity(trimmed);
  };

  const isPositive = (trendData?.changePercent || 0) >= 0;
  const chartColor = isPositive ? '#059669' : '#dc2626';
  const gradientId = `priceGradient-${commodity.replace(/\s+/g, '-')}`;

  const listedCropMatch = useMemo(() => {
    if (!trendData?.currentPrice) {
      return null;
    }

    return farmerCrops.find(
      (crop) => crop.name?.trim().toLowerCase() === trendData.commodity?.toLowerCase()
    );
  }, [farmerCrops, trendData]);

  const listingInsight = useMemo(() => {
    if (!listedCropMatch || !trendData?.currentPrice) {
      return null;
    }

    const listedPrice = Number(listedCropMatch.price);
    const marketPrice = Number(trendData.currentPrice);
    const difference = listedPrice - marketPrice;
    const differencePercent = marketPrice > 0 ? ((difference / marketPrice) * 100).toFixed(1) : 0;

    if (difference > marketPrice * 0.05) {
      return {
        tone: 'text-rose-700 bg-rose-50 border-rose-200',
        message: `Your listing is ${formatCurrency(difference)} (${differencePercent}%) above mandi rate — buyers may prefer market price.`,
      };
    }

    if (difference < -marketPrice * 0.03) {
      return {
        tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        message: `Your listing is ${formatCurrency(Math.abs(difference))} below mandi rate — room to increase price for more profit.`,
      };
    }

    return {
      tone: 'text-slate-700 bg-slate-50 border-slate-200',
      message: 'Your listing price is aligned with the current mandi trend.',
    };
  }, [listedCropMatch, trendData]);

  const TrendIcon = trendData?.changePercent > 0.5
    ? FaArrowUp
    : trendData?.changePercent < -0.5
      ? FaArrowDown
      : FaMinus;

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm ${
        isFeatured
          ? 'border-emerald-200 p-8 shadow-lg shadow-emerald-100/40'
          : 'border-slate-200 p-5'
      }`}
    >
      <div className={`mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between ${isFeatured ? 'mb-6' : ''}`}>
        <div>
          <p className={`font-semibold uppercase tracking-[0.2em] text-emerald-600 ${isFeatured ? 'text-sm' : 'text-xs'}`}>
            {isFeatured ? 'Advanced Market Analytics' : 'Price Trend'}
          </p>
          <h3 className={`font-semibold text-slate-800 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
            {isFeatured ? 'Mandi Price Trend Chart' : 'Mandi Market Chart'}
          </h3>
          <p className={`text-slate-500 ${isFeatured ? 'mt-1 text-base' : 'text-sm'}`}>
            Share-market style trend analysis to plan the best selling time and maximize profit
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === option.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search crop for trend chart"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <FaSearch />
          View Trend
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {[...farmerCropNames, ...QUICK_CROPS]
          .filter((name, index, list) => list.indexOf(name) === index)
          .slice(0, 10)
          .map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => updateCommodity(name)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                commodity.toLowerCase() === name.toLowerCase()
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="space-y-3 py-8">
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadTrend(commodity, period)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <FaRedo />
            Retry
          </button>
        </div>
      ) : trendData ? (
        <>
          <div className={`mb-4 grid gap-3 ${isFeatured ? 'gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
            <div className={`rounded-xl border border-slate-200 bg-slate-50 ${isFeatured ? 'p-5' : 'p-3'}`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{trendData.commodity} Price</p>
              <p className={`mt-1 font-bold text-slate-900 ${isFeatured ? 'text-3xl' : 'text-2xl'}`}>{formatCurrency(trendData.currentPrice)}</p>
              <p className={`mt-1 flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                <TrendIcon />
                {isPositive ? '+' : ''}
                {trendData.changePercent}%
                <span className="font-normal text-slate-500">({isPositive ? '+' : ''}{formatCurrency(trendData.change)})</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Period High</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(trendData.periodHigh)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Period Low</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(trendData.periodLow)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Average Price</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(trendData.averagePrice)}</p>
            </div>
          </div>

          <div className={`w-full rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-2 ${isFeatured ? 'h-[28rem]' : 'h-72'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData.series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="price"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                  tickFormatter={(value) => `₹${value}`}
                  domain={['auto', 'auto']}
                />
                <YAxis yAxisId="volume" hide />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  yAxisId="price"
                  y={trendData.averagePrice}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: 'Avg', position: 'insideTopRight', fill: '#64748b', fontSize: 11 }}
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="#cbd5e1"
                  radius={[2, 2, 0, 0]}
                  barSize={6}
                  opacity={0.45}
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="high"
                  stroke="#86efac"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 4"
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="low"
                  stroke="#fca5a5"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 4"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-emerald-500" /> Close price</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 border-t border-dashed border-emerald-300" /> High</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 border-t border-dashed border-rose-300" /> Low</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-300" /> Volume</span>
            <span>Unit: {trendData.unit}</span>
          </div>

          {trendData.recommendation ? (
            <div className={`mt-4 rounded-xl border p-4 ${recommendationStyles[trendData.recommendation.action] || recommendationStyles.monitor}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Profit Insight</p>
                  <p className="text-base font-bold">{trendData.recommendation.label}</p>
                  <p className="mt-1 text-sm opacity-90">{trendData.recommendation.reason}</p>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase">
                  {trendData.recommendation.confidence} confidence
                </span>
              </div>
            </div>
          ) : null}

          {listingInsight ? (
            <div className={`mt-3 rounded-xl border p-3 text-sm ${listingInsight.tone}`}>
              <p className="font-semibold">Your listing: {listedCropMatch.name} @ {formatCurrency(listedCropMatch.price)}</p>
              <p className="mt-1">{listingInsight.message}</p>
            </div>
          ) : null}
        </>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">No trend data available for this crop.</p>
      )}
    </div>
  );
};

export default PriceChart;
