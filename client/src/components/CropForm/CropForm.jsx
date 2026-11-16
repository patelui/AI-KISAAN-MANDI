import { useEffect, useState } from 'react';
import { useMandiPriceSuggestion } from '../../hooks/useMandiPriceSuggestion';
import { buildDefaultLocationLabel } from '../../utils/mandiLocation';
import MandiPriceHint from './MandiPriceHint';

const CROP_OPTIONS = ['Wheat', 'Rice', 'Maize', 'Barley', 'Mustard', 'Cotton', 'Onion', 'Potato', 'Tomato', 'Other'];

const CropForm = ({ onSubmit, isSubmitting }) => {
  const [cropName, setCropName] = useState('Wheat');
  const [customCropName, setCustomCropName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState(buildDefaultLocationLabel());
  const [message, setMessage] = useState('');
  const [priceEdited, setPriceEdited] = useState(false);

  const activeCropName = cropName === 'Other' ? customCropName : cropName;

  const { suggestion, loading: suggestionLoading, error: suggestionError } = useMandiPriceSuggestion({
    commodity: activeCropName,
    location,
    enabled: Boolean(activeCropName?.trim()),
  });

  useEffect(() => {
    setPriceEdited(false);
  }, [activeCropName, location]);

  useEffect(() => {
    if (!suggestion?.modalPrice || priceEdited) {
      return;
    }

    setPrice(String(suggestion.modalPrice));
    setMessage(`Mandi price applied for ${suggestion.commodity} in ${suggestion.district}. You can adjust it anytime.`);
  }, [suggestion, priceEdited]);

  const handleCropChange = (event) => {
    setCropName(event.target.value);
    setMessage('');
  };

  const handlePriceChange = (event) => {
    setPriceEdited(true);
    setPrice(event.target.value);
    setMessage('');
  };

  const applyMandiPrice = () => {
    if (!suggestion?.modalPrice) {
      return;
    }

    setPriceEdited(false);
    setPrice(String(suggestion.modalPrice));
    setMessage(`Mandi price ${suggestion.modalPrice} applied. You can still edit it.`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const result = await onSubmit({
      name: activeCropName,
      price: Number(price),
      quantity: quantity ? Number(quantity) : undefined,
      location: location || buildDefaultLocationLabel(),
    });

    if (result?.success) {
      setMessage('Crop listed successfully!');
      setQuantity('');
      setPriceEdited(false);
    } else {
      setMessage(result?.error || 'Unable to list crop.');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">List New Crop</h3>
      <p className="mb-4 text-sm text-slate-600">
        Price is suggested from the mandi rate for your location. You are free to set your own price.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Crop Name</label>
            <select
              value={cropName}
              onChange={handleCropChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {CROP_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {cropName === 'Other' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Custom Crop Name</label>
              <input
                required
                value={customCropName}
                onChange={(event) => setCustomCropName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Garlic"
              />
            </div>
          ) : null}

          <div className={cropName === 'Other' ? 'md:col-span-2' : ''}>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="City, State"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Price (₹ / quintal)</label>
            <input
              type="number"
              value={price}
              onChange={handlePriceChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Mandi price will appear here"
              required
            />
            <div className="mt-2">
              <MandiPriceHint
                suggestion={suggestion}
                loading={suggestionLoading}
                error={suggestionError}
                onApply={applyMandiPrice}
                showApplyButton={priceEdited && Boolean(suggestion?.modalPrice)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Quantity (quintals)</label>
          <input
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-green-600 px-6 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Listing...' : 'List Crop'}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </p>
      ) : null}
    </div>
  );
};

export default CropForm;
