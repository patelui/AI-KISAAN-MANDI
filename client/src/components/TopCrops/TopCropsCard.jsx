import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaLeaf, FaPlus, FaRupeeSign } from 'react-icons/fa';
import { resolveAssetUrl } from '../../utils/api';

const getCropValue = (crop) => {
  const price = Number(crop?.price) || 0;
  const quantity = Number(crop?.quantity) || 0;
  return price * quantity;
};

const TopCropsCard = ({ crops = [], loading = false, limit = 5 }) => {
  const navigate = useNavigate();

  const topCrops = useMemo(() => {
    return [...crops]
      .sort((a, b) => getCropValue(b) - getCropValue(a))
      .slice(0, limit);
  }, [crops, limit]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 h-6 w-40 animate-pulse rounded bg-slate-100" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Your Top Crops</h3>
          <p className="text-sm text-slate-500">Highest value listings at a glance</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/farmer-crops')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          View all
          <FaArrowRight className="text-xs" />
        </button>
      </div>

      {topCrops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <FaLeaf />
          </div>
          <p className="font-medium text-slate-700">No crops listed yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add your first listing to start selling on the mandi.
          </p>
          <button
            type="button"
            onClick={() => navigate('/farmer-crops')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <FaPlus className="text-xs" />
            Add crop listing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {topCrops.map((crop, index) => {
            const name = crop.name || crop.cropName || crop.crop || 'Unknown crop';
            const price = Number(crop.price || 0);
            const quantity = Number(crop.quantity || 0);
            const imageUrl = resolveAssetUrl(crop.image);

            return (
              <div
                key={crop._id || crop.id || `${name}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {index + 1}
                </span>

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <FaLeaf />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {crop.location || 'India'}
                    {quantity > 0 ? ` · ${quantity} qtl` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <p className="flex items-center justify-end gap-0.5 font-semibold text-emerald-700">
                    <FaRupeeSign className="text-[10px]" />
                    {price.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500">/qtl</span>
                  </p>
                  {quantity > 0 && (
                    <p className="text-xs text-slate-500">
                      ₹{getCropValue(crop).toLocaleString('en-IN')} total
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {crops.length > limit && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Showing top {limit} of {crops.length} listings
        </p>
      )}
    </div>
  );
};

export default TopCropsCard;
