import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import MandiPriceHint from '../components/CropForm/MandiPriceHint';
import { useCrops } from '../hooks/useCrops';
import { useMandiPriceSuggestion } from '../hooks/useMandiPriceSuggestion';
import { buildDefaultLocationLabel } from '../utils/mandiLocation';
import { resolveAssetUrl } from '../utils/api';

function FarmerCropsPage() {
  const navigate = useNavigate();
  const { crops, loading, addCrop, updateCrop, deleteCrop } = useCrops();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [message, setMessage] = useState('');
  const [priceEdited, setPriceEdited] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    quantity: '',
    quality: '',
    location: buildDefaultLocationLabel(),
    imageFile: null,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { suggestion, loading: suggestionLoading, error: suggestionError } = useMandiPriceSuggestion({
    commodity: form.name,
    location: form.location,
    enabled: Boolean(form.name?.trim()),
  });

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
      }
    } catch {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (isEditing || priceEdited || !suggestion?.modalPrice || !form.name?.trim()) {
      return;
    }

    setForm((prev) => ({ ...prev, price: String(suggestion.modalPrice) }));
  }, [suggestion, isEditing, priceEdited, form.name]);

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      quantity: '',
      quality: '',
      location: buildDefaultLocationLabel(),
      imageFile: null,
    });
    setPreviewUrl('');
    setIsEditing(false);
    setSelectedCropId(null);
    setPriceEdited(false);
  };

  const handleEdit = (crop) => {
    setSelectedCropId(crop._id || crop.id);
    setIsEditing(true);
    setForm({
      name: crop.name || '',
      price: crop.price || '',
      quantity: crop.quantity || '',
      quality: crop.quality || '',
      location: crop.location || 'India',
      imageFile: null,
    });
    setPreviewUrl(crop.image ? resolveAssetUrl(crop.image) : '');
    setMessage('');
    setPriceEdited(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be smaller than 5 MB.');
      return;
    }

    setForm((prev) => ({ ...prev, imageFile: file }));
    setPreviewUrl(URL.createObjectURL(file));
    setMessage('');
  };

  const applyMandiPrice = () => {
    if (!suggestion?.modalPrice) {
      return;
    }

    setPriceEdited(false);
    setForm((prev) => ({ ...prev, price: String(suggestion.modalPrice) }));
    setMessage(`Mandi price ${suggestion.modalPrice} applied for ${suggestion.market}.`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const payload = {
      name: form.name,
      price: Number(form.price),
      quantity: form.quantity ? Number(form.quantity) : undefined,
      quality: form.quality,
      location: form.location || buildDefaultLocationLabel(),
      imageFile: form.imageFile,
    };

    let result;
    if (isEditing && selectedCropId) {
      result = await updateCrop(selectedCropId, payload);
    } else {
      result = await addCrop(payload);
    }

    if (result?.success) {
      setMessage(isEditing ? 'Crop updated successfully.' : 'Crop listed successfully.');
      resetForm();
    } else {
      setMessage(result?.error || 'Unable to save crop.');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this crop listing?')) return;
    const result = await deleteCrop(id);
    if (result?.success) {
      setMessage('Crop deleted successfully.');
    } else {
      setMessage(result?.error || 'Unable to delete crop.');
    }
  };

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
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Farmer Workspace</p>
                <h1 className="text-2xl font-bold text-slate-900">My Crops</h1>
                <p className="mt-1 text-sm text-slate-600">Manage your crop listings, update crop details, and re-upload images in one place.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {isEditing ? 'Cancel Edit' : 'Clear Form'}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">{isEditing ? 'Edit Crop Listing' : 'Add New Crop'}</h2>
              <p className="mb-4 text-sm text-slate-600">
                Price is suggested from the mandi rate for your location. You can always set your own price.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Crop Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => {
                        setPriceEdited(false);
                        setForm((prev) => ({ ...prev, name: event.target.value }));
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. Wheat"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Price (₹ / quintal)</label>
                    <input
                      required
                      type="number"
                      value={form.price}
                      onChange={(event) => {
                        setPriceEdited(true);
                        setForm((prev) => ({ ...prev, price: event.target.value }));
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="Mandi price will appear here"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Quantity (quintals)</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Quality</label>
                    <input
                      value={form.quality}
                      onChange={(event) => setForm((prev) => ({ ...prev, quality: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="Premium / Grade A"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
                  <input
                    value={form.location}
                    onChange={(event) => {
                      setPriceEdited(false);
                      setForm((prev) => ({ ...prev, location: event.target.value }));
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    placeholder="City, State"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Crop Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600"
                  />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Crop preview" className="mt-3 h-40 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
                      Upload a fresh crop photo
                    </div>
                  )}
                </div>

                {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Crop' : 'Add Crop'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">Your Crop Listings</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">{crops.length}</span>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Loading your crops...</p>
              ) : crops.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No crops listed yet. Add your first crop to start selling.
                </div>
              ) : (
                <div className="space-y-4">
                  {crops.map((crop) => (
                    <div key={crop._id || crop.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex gap-4">
                        {crop.image ? (
                          <img src={resolveAssetUrl(crop.image)} alt={crop.name} className="h-24 w-24 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">No image</div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">{crop.name}</h3>
                              <p className="text-sm text-slate-500">{crop.location || 'India'}</p>
                            </div>
                            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">₹{Number(crop.price || 0).toLocaleString('en-IN')}</div>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <p><span className="font-medium text-slate-700">Quantity:</span> {crop.quantity || 'Not specified'} quintals</p>
                            <p><span className="font-medium text-slate-700">Quality:</span> {crop.quality || 'Standard'}</p>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => handleEdit(crop)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700">Edit</button>
                            <button type="button" onClick={() => handleDelete(crop._id || crop.id)} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700">Delete</button>
                          </div>
                        </div>
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

export default FarmerCropsPage;
