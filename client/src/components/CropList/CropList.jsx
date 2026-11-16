import React from 'react';
import ListingCard from '../ListingCard/ListingCard';

const CropList = ({ crops, loading, onDelete, emptyMessage }) => {
  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">My Listings</h3>
        <p className="text-gray-500 text-sm">Loading your listings...</p>
      </div>
    );
  }

  if (!crops || crops.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">My Listings</h3>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">{emptyMessage || 'You have not listed any crops yet.'}</p>
          <p className="text-sm text-gray-400 mt-2">List your first crop using the form above!</p>
        </div>
      </div>
    );
  }

  // Convert crops to listing card format
  const cropListings = crops.map(crop => ({
    id: crop._id || crop.id,
    crop: crop.name || crop.cropName || crop.crop || 'Unknown Crop',
    quantity: crop.quantity ? `${crop.quantity} quintals` : 'Not specified',
    price: Number(crop.price || 0).toLocaleString('en-IN'),
    location: crop.location || 'India',
    date: crop.createdAt ? new Date(crop.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">My Listings</h3>
      <div className="space-y-3">
        {cropListings.map((listing) => (
          <div key={listing.id} className="relative">
            <ListingCard listing={listing} />
            <button
              onClick={() => onDelete(listing.id)}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropList;