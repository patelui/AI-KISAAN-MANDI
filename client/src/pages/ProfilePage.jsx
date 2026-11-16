import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBox,
  FaChartLine,
  FaLeaf,
  FaMapMarkerAlt,
  FaRobot,
  FaRupeeSign,
  FaSeedling,
  FaUserCog,
} from 'react-icons/fa';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import api, { resolveAssetUrl } from '../utils/api';

const PREF_KEY = 'kisaan_farmer_preferences';

const defaultPreferences = {
  orderAlerts: true,
  lowStockAlerts: true,
  mandiPriceAlerts: true,
};

const loadPreferences = () => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
};

const emptyProfile = {
  fullName: '',
  email: '',
  role: '',
  phoneNumber: '',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  farmOrBusinessName: '',
  profilePhoto: '',
};

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeListings: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [preferences, setPreferences] = useState(loadPreferences);

  const isFarmer = profile.role === 'farmer';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setProfile(data);
        setDraft(data);
        localStorage.setItem('user', JSON.stringify(data));

        if (data.role === 'farmer') {
          const dashboard = await api.get('/farmer/dashboard');
          setStats(dashboard.data.stats || {});
        }
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const profileCompleteness = useMemo(() => {
    const fields = isFarmer
      ? ['fullName', 'phoneNumber', 'farmOrBusinessName', 'state', 'district', 'city', 'address']
      : ['fullName', 'phoneNumber', 'address', 'city', 'state'];
    const filled = fields.filter((field) => String(profile[field] || '').trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile, isFarmer]);

  const mandiLocationReady = Boolean(profile.state?.trim() && profile.district?.trim());

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const startEditing = () => {
    setDraft(profile);
    setPhotoFile(null);
    setPhotoPreview('');
    setIsEditing(true);
    setMessage('');
    setError('');
  };

  const cancelEditing = () => {
    setDraft(profile);
    setPhotoFile(null);
    setPhotoPreview('');
    setIsEditing(false);
    setError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('fullName', draft.fullName);
      formData.append('phoneNumber', draft.phoneNumber);
      formData.append('address', draft.address);
      formData.append('city', draft.city);
      formData.append('district', draft.district);
      formData.append('state', draft.state);
      formData.append('pincode', draft.pincode);
      formData.append('farmOrBusinessName', draft.farmOrBusinessName);

      if (photoFile) {
        formData.append('profilePhoto', photoFile);
      }

      const { data } = await api.put('/auth/profile', formData);
      setProfile(data);
      setDraft(data);
      setPhotoFile(null);
      setPhotoPreview('');
      setIsEditing(false);
      localStorage.setItem('user', JSON.stringify(data));
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return next;
    });
    setMessage('Preferences saved.');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const displayPhoto = photoPreview || resolveAssetUrl(profile.profilePhoto);
  const roleLabel = profile.role === 'farmer' ? 'Farmer' : 'Buyer';
  const businessLabel = profile.role === 'farmer' ? 'Farm / Mandi Name' : 'Business Name';
  const initials = (profile.fullName || profile.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profileContent = (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {displayPhoto ? (
              <img src={displayPhoto} alt="Profile" className="h-20 w-20 rounded-full border-4 border-emerald-100 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-xl font-bold text-emerald-700">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Account Settings</p>
              <h1 className="text-xl font-bold text-slate-900">{profile.fullName || 'Complete your profile'}</h1>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {roleLabel}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isFarmer && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Profile completeness</span>
              <span className="font-semibold text-emerald-700">{profileCompleteness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${profileCompleteness}%` }} />
            </div>
          </div>
        )}
      </section>

      {isFarmer && !mandiLocationReady && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Add your mandi location</p>
          <p className="mt-1 text-amber-800">
            State and district are required for accurate mandi prices, weather, and AI selling advice.
          </p>
        </section>
      )}

      {isFarmer && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FaSeedling className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Farm Overview</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={FaLeaf} label="Listings" value={stats.activeListings} />
              <StatCard icon={FaBox} label="Pending Orders" value={stats.pendingOrders} />
              <StatCard icon={FaRupeeSign} label="Revenue" value={`₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`} />
              <StatCard icon={FaChartLine} label="Total Products" value={stats.totalProducts} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Mandi Location</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Used for mandi rate suggestions, market analytics, weather, and AI assistant recommendations.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <LocationPill label="State" value={profile.state} />
              <LocationPill label="District" value={profile.district} />
              <LocationPill label="City" value={profile.city} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FaUserCog className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Alert Preferences</h2>
            </div>
            <div className="space-y-3">
              <PreferenceToggle
                label="Order alerts"
                description="Notify when buyers place orders on your crops"
                checked={preferences.orderAlerts}
                onChange={() => handlePreferenceChange('orderAlerts')}
              />
              <PreferenceToggle
                label="Low stock alerts"
                description="Warn when crop quantity is running low"
                checked={preferences.lowStockAlerts}
                onChange={() => handlePreferenceChange('lowStockAlerts')}
              />
              <PreferenceToggle
                label="Mandi price insights"
                description="Highlight mandi rate changes in analytics"
                checked={preferences.mandiPriceAlerts}
                onChange={() => handlePreferenceChange('mandiPriceAlerts')}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Access</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink label="My Crops" onClick={() => navigate('/farmer-crops')} />
              <QuickLink label="Orders" onClick={() => navigate('/farmer-orders')} />
              <QuickLink label="Analytics" onClick={() => navigate('/farmer-analytics')} />
              <QuickLink label="AI Assistant" icon={FaRobot} onClick={() => navigate('/farmer-assistant')} />
            </div>
          </section>
        </>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile Details</h2>

        {!isEditing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="Phone Number" value={profile.phoneNumber} />
            <ProfileField label={businessLabel} value={profile.farmOrBusinessName} />
            <ProfileField label="Address" value={profile.address} className="sm:col-span-2" />
            <ProfileField label="City" value={profile.city} />
            <ProfileField label="District" value={profile.district} />
            <ProfileField label="State" value={profile.state} />
            <ProfileField label="Pincode" value={profile.pincode} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
                Upload Profile Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              <p className="text-[11px] text-slate-400">JPG, PNG or WEBP up to 2 MB</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Full Name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
              <InputField label="Phone Number" value={draft.phoneNumber} onChange={(value) => setDraft({ ...draft, phoneNumber: value })} />
              <InputField
                label={businessLabel}
                value={draft.farmOrBusinessName}
                onChange={(value) => setDraft({ ...draft, farmOrBusinessName: value })}
                className="sm:col-span-2"
              />
              <InputField label="Address" value={draft.address} onChange={(value) => setDraft({ ...draft, address: value })} className="sm:col-span-2" multiline />
              <InputField label="City" value={draft.city} onChange={(value) => setDraft({ ...draft, city: value })} />
              <InputField label="District" value={draft.district} onChange={(value) => setDraft({ ...draft, district: value })} highlight={isFarmer} />
              <InputField label="State" value={draft.state} onChange={(value) => setDraft({ ...draft, state: value })} highlight={isFarmer} />
              <InputField label="Pincode" value={draft.pincode} onChange={(value) => setDraft({ ...draft, pincode: value })} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={cancelEditing} className="flex-1 rounded-lg border border-slate-200 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">{message}</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading settings...
      </div>
    );
  }

  if (isFarmer) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <Header onLogout={handleLogout} />
          <main className="p-6">{profileContent}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-950 to-slate-900 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-2xl">{profileContent}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <Icon className="text-emerald-600" />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function LocationPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || 'Not set'}</p>
    </div>
  );
}

function PreferenceToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-emerald-600" />
    </label>
  );
}

function QuickLink({ label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      {Icon ? <Icon className="mb-1 text-emerald-600" /> : null}
      {label}
    </button>
  );
}

function ProfileField({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 ${className}`}>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value || 'Not added yet'}</p>
    </div>
  );
}

function InputField({ label, value, onChange, className = '', multiline = false, highlight = false }) {
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/80 ${
    highlight ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
  }`;

  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}
        {highlight ? <span className="ml-1 text-emerald-600">*</span> : null}
      </label>
      {multiline ? (
        <textarea rows={3} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export default ProfilePage;
