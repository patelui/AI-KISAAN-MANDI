import { FaArrowDown, FaArrowUp, FaLeaf, FaMinus } from 'react-icons/fa';

const verdictStyles = {
  light: {
    above: 'bg-amber-50 text-amber-800 border-amber-200',
    below: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    aligned: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  dark: {
    above: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    below: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    aligned: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
};

const verdictLabels = {
  above: 'Above mandi',
  below: 'Below mandi',
  aligned: 'Near mandi rate',
};

function MarketplaceCropCard({ crop, onViewDetails, onAddToCart, preview = false, theme = 'light' }) {
  const mandi = crop.mandi;
  const verdict = mandi?.verdict || 'aligned';
  const styles = verdictStyles[theme] || verdictStyles.light;
  const isLight = theme === 'light';

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${
        isLight
          ? 'border-emerald-100 bg-white hover:border-emerald-200'
          : 'border-slate-700/80 bg-slate-900/80 shadow-slate-950/60'
      }`}
    >
      <div className={`relative h-40 ${isLight ? 'bg-emerald-50' : 'bg-slate-800'}`}>
        {crop.image ? (
          <img src={crop.image} alt={crop.name} className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full items-center justify-center ${isLight ? 'text-emerald-400' : 'text-emerald-400/60'}`}>
            <FaLeaf className="text-4xl" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] uppercase ${
            isLight ? 'bg-white/90 text-emerald-700' : 'bg-slate-950/80 text-emerald-300'
          }`}
        >
          {crop.quality || 'Standard'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-1.5">
          <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-emerald-200'}`}>{crop.name}</h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
            Location: <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{crop.location || 'Not specified'}</span>
          </p>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
            Quantity:{' '}
            <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              {crop.quantity != null ? `${crop.quantity} qtl` : 'Not specified'}
            </span>
          </p>
          {!preview && (
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
              Farmer:{' '}
              <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                {crop.farmer?.fullName || crop.farmer?.email || 'Unknown'}
              </span>
            </p>
          )}
        </div>

        {mandi && (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${styles[verdict]}`}>
            <div className="flex items-center justify-between gap-2">
              <span>Mandi: ₹{Number(mandi.modalPrice).toLocaleString('en-IN')}/qtl</span>
              <span className="inline-flex items-center gap-1 font-medium">
                {verdict === 'above' && <FaArrowUp />}
                {verdict === 'below' && <FaArrowDown />}
                {verdict === 'aligned' && <FaMinus />}
                {verdictLabels[verdict]}
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-80">
              {mandi.market} · {mandi.differencePercent > 0 ? '+' : ''}
              {mandi.differencePercent}% vs listing
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className={`text-sm font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
            ₹{Number(crop.price).toLocaleString('en-IN')} / qtl
          </span>
          {!preview && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onViewDetails?.(crop)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] ${
                  isLight
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'border-slate-600 hover:bg-slate-800'
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => onAddToCart?.(crop)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default MarketplaceCropCard;
