const ListingCard = ({ listing }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-800">{listing?.crop || 'Crop'}</h4>
          <p className="text-sm text-slate-500">{listing?.location || 'Location'}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-emerald-600">₹{listing?.price || '0'}</p>
          <p className="text-sm text-slate-500">{listing?.quantity || '0'}</p>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">{listing?.date || 'Date not available'}</div>
    </div>
  );
};

export default ListingCard;
