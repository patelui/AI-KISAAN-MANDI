import { formatMandiPrice } from '../../utils/mandiLocation';

const MandiPriceHint = ({
  suggestion,
  loading,
  error,
  onApply,
  showApplyButton = false,
}) => {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Fetching mandi rate for your crop and location...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {error} You can still enter your own price.
      </div>
    );
  }

  if (!suggestion?.modalPrice) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold">Mandi suggestion:</span>{' '}
          {formatMandiPrice(suggestion.modalPrice)} / quintal at {suggestion.market} ({suggestion.district}, {suggestion.state}).
          {' '}Range: {formatMandiPrice(suggestion.minPrice)} – {formatMandiPrice(suggestion.maxPrice)}.
          {' '}You can keep or change this price.
        </p>
        {showApplyButton && onApply ? (
          <button
            type="button"
            onClick={onApply}
            className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
          >
            Use mandi price
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default MandiPriceHint;
