import { useState } from 'react';
import BuyerLayout from '../components/Buyer/BuyerLayout';
import { useBuyerAddresses } from '../hooks/useBuyerAddresses';

function BuyerAddressBookPage() {
  const { addresses, loading, error, emptyForm, saveAddress, deleteAddress, setDefaultAddress } = useBuyerAddresses();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await saveAddress(form, editingId);
      setMessage(editingId ? 'Address updated.' : 'Address saved.');
      resetForm();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      setMessage('Address deleted.');
      if (editingId === id) resetForm();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete address.');
    }
  };

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Address Book</h1>
          <p className="mt-1 text-sm text-slate-500">Save shipping addresses for faster checkout.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="space-y-3">
            {loading && <p className="text-sm text-slate-500">Loading addresses...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && addresses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                No saved addresses yet. Add your first shipping address.
              </div>
            )}
            {addresses.map((address) => (
              <article key={address.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${address.isDefault ? 'border-emerald-300' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{address.label}</p>
                      {address.isDefault && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">DEFAULT</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{address.fullName} · {address.phone}</p>
                    <p className="mt-1 text-sm text-slate-500">{address.address}, {address.city}, {address.state} - {address.pincode}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!address.isDefault && (
                    <button type="button" onClick={() => setDefaultAddress(address.id)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Set Default
                    </button>
                  )}
                  <button type="button" onClick={() => handleEdit(address)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(address.id)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <FormInput label="Label" value={form.label} onChange={(v) => setForm((p) => ({ ...p, label: v }))} placeholder="Home, Office, Farm..." />
              <FormInput label="Full Name" value={form.fullName} onChange={(v) => setForm((p) => ({ ...p, fullName: v }))} required />
              <FormInput label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} required />
              <FormInput label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} required multiline />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormInput label="City" value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} required />
                <FormInput label="State" value={form.state} onChange={(v) => setForm((p) => ({ ...p, state: v }))} required />
              </div>
              <FormInput label="PIN Code" value={form.pincode} onChange={(v) => setForm((p) => ({ ...p, pincode: v }))} required />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="accent-emerald-600" />
                Set as default shipping address
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          </section>
        </div>
      </div>
    </BuyerLayout>
  );
}

function FormInput({ label, value, onChange, placeholder, required, multiline }) {
  const className = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/80';
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      {multiline ? (
        <textarea rows={3} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={className} />
      ) : (
        <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={className} />
      )}
    </div>
  );
}

export default BuyerAddressBookPage;
