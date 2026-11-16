const DEFAULT_STATE = 'Gujarat';
const DEFAULT_DISTRICT = 'Vadodara';

export const readFarmerProfile = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return {};
    }

    return JSON.parse(storedUser);
  } catch {
    return {};
  }
};

export const buildDefaultLocationLabel = (profile = readFarmerProfile()) => {
  const parts = [profile.city, profile.district, profile.state]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (parts.length) {
    return [...new Set(parts)].join(', ');
  }

  return `${DEFAULT_DISTRICT}, ${DEFAULT_STATE}`;
};

export const parseLocationForMandi = (locationInput = '', profile = readFarmerProfile()) => {
  const parts = String(locationInput || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      district: parts[0],
      state: parts[parts.length - 1],
    };
  }

  if (parts.length === 1 && parts[0].toLowerCase() !== 'india') {
    return {
      district: parts[0],
      state: profile.state?.trim() || DEFAULT_STATE,
    };
  }

  return {
    district: profile.district?.trim() || profile.city?.trim() || DEFAULT_DISTRICT,
    state: profile.state?.trim() || DEFAULT_STATE,
  };
};

export const formatMandiPrice = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  return `₹${Number(value).toLocaleString('en-IN')}`;
};
