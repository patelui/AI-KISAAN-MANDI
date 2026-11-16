const GEOCODE_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LOCATION = 'Delhi';

const weatherCodeMap = {
  0: { condition: 'Sunny', forecast: 'Clear skies' },
  1: { condition: 'Mostly Sunny', forecast: 'Mostly clear' },
  2: { condition: 'Partly Cloudy', forecast: 'A few clouds' },
  3: { condition: 'Cloudy', forecast: 'Cloudy conditions' },
  45: { condition: 'Foggy', forecast: 'Fog and mist' },
  48: { condition: 'Foggy', forecast: 'Rime fog' },
  51: { condition: 'Drizzle', forecast: 'Light drizzle' },
  53: { condition: 'Drizzle', forecast: 'Moderate drizzle' },
  55: { condition: 'Drizzle', forecast: 'Heavy drizzle' },
  61: { condition: 'Rainy', forecast: 'Light rain' },
  63: { condition: 'Rainy', forecast: 'Moderate rain' },
  65: { condition: 'Rainy', forecast: 'Heavy rain' },
  71: { condition: 'Snowy', forecast: 'Light snow' },
  73: { condition: 'Snowy', forecast: 'Moderate snow' },
  75: { condition: 'Snowy', forecast: 'Heavy snow' },
  80: { condition: 'Rainy', forecast: 'Light showers' },
  81: { condition: 'Rainy', forecast: 'Moderate showers' },
  82: { condition: 'Rainy', forecast: 'Heavy showers' },
  95: { condition: 'Thunderstorm', forecast: 'Thunderstorms expected' },
  96: { condition: 'Thunderstorm', forecast: 'Thunderstorm with hail' },
  99: { condition: 'Thunderstorm', forecast: 'Severe thunderstorm' },
};

const knownLocationAliases = {
  vadadora: 'Vadodara',
  vadodara: 'Vadodara',
  baroda: 'Vadodara',
  waghodia: 'Waghodia',
  parul: 'Vadodara',
  'parul university': 'Vadodara',
  bengaluru: 'Bangalore',
  bengalooru: 'Bangalore',
};

const normalizeLocationValue = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  return knownLocationAliases[trimmed.toLowerCase()] || trimmed;
};

const addUniqueCandidate = (candidates, value) => {
  const normalized = normalizeLocationValue(value);
  if (!normalized) return;
  if (!candidates.includes(normalized)) {
    candidates.push(normalized);
  }
};

const expandLocationInput = (input = '') => {
  const expanded = [];
  const rawParts = String(input || '')
    .split(/[,/\n]+/)
    .map((part) => part.replace(/\b(university|campus|college)\b/gi, '').trim())
    .filter(Boolean);

  rawParts.forEach((part) => {
    addUniqueCandidate(expanded, part);
    const words = part.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      addUniqueCandidate(expanded, words[words.length - 1]);
      addUniqueCandidate(expanded, words[0]);
    }
  });

  if (rawParts.length > 1) {
    addUniqueCandidate(expanded, rawParts.slice(0, 2).join(' '));
  }

  return expanded;
};

export const getProfileLocationCandidates = (profile = {}, locationHint = '') => {
  const candidates = [];

  if (locationHint) {
    expandLocationInput(locationHint).forEach((value) => addUniqueCandidate(candidates, value));
  }

  [profile.city, profile.district, profile.state, profile.address].forEach((field) => {
    expandLocationInput(field).forEach((value) => addUniqueCandidate(candidates, value));
  });

  addUniqueCandidate(candidates, DEFAULT_LOCATION);

  return candidates;
};

export const resolveLocationLabel = (profile = {}) => {
  const parts = [profile.city, profile.district, profile.state]
    .filter(Boolean)
    .map((value) => String(value).trim());

  if (parts.length) {
    return parts.join(', ');
  }

  if (profile.address) {
    return String(profile.address).trim();
  }

  return 'Your farm location';
};

const geocodeLocation = async (name) => {
  const params = new URLSearchParams({
    name,
    count: '1',
    language: 'en',
    format: 'json',
    countryCode: 'IN',
  });

  const response = await fetch(`${GEOCODE_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.results?.[0] || null;
};

export const resolveWeatherLocation = async (inputs = []) => {
  const candidates = [];

  (Array.isArray(inputs) ? inputs : [inputs]).forEach((input) => {
    expandLocationInput(input).forEach((value) => addUniqueCandidate(candidates, value));
  });

  if (!candidates.length) {
    addUniqueCandidate(candidates, DEFAULT_LOCATION);
  }

  for (const candidate of candidates) {
    try {
      const result = await geocodeLocation(candidate);
      if (result) {
        return result;
      }
    } catch (error) {
      console.error('Geocoding lookup failed for', candidate, error);
    }
  }

  if (!candidates.includes(DEFAULT_LOCATION)) {
    try {
      const fallback = await geocodeLocation(DEFAULT_LOCATION);
      if (fallback) {
        return fallback;
      }
    } catch (error) {
      console.error('Fallback geocoding failed', error);
    }
  }

  return null;
};

const fetchCurrentWeather = async (latitude, longitude) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode',
    timezone: 'Asia/Kolkata',
  });

  const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather API failed with status ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.reason || 'Weather API returned an error');
  }

  return data;
};

const mapCurrentWeather = (geocodeResult, weatherData, locationLabel) => {
  const current = weatherData.current || {};
  const code = current.weathercode;
  const mapped = weatherCodeMap[code] || weatherCodeMap[0];

  const hasTemperature = Number.isFinite(current.temperature_2m);

  return {
    locationName:
      [geocodeResult.name, geocodeResult.admin1, geocodeResult.country]
        .filter(Boolean)
        .join(', ') || locationLabel,
    temperature: hasTemperature ? Math.round(current.temperature_2m) : null,
    condition: mapped.condition,
    humidity: Number.isFinite(current.relative_humidity_2m)
      ? Math.round(current.relative_humidity_2m)
      : null,
    windSpeed: Number.isFinite(current.wind_speed_10m)
      ? Math.round(current.wind_speed_10m)
      : null,
    forecast: mapped.forecast,
    updatedAt: current.time || null,
    isFallbackLocation: false,
  };
};

const buildUnavailableWeather = (locationLabel, message) => ({
  locationName: locationLabel,
  temperature: null,
  condition: null,
  humidity: null,
  windSpeed: null,
  forecast: message,
  updatedAt: null,
  isFallbackLocation: false,
});

export const getCurrentWeatherForProfile = async (profile = {}, locationHint = '') => {
  const locationLabel = resolveLocationLabel(profile);
  const candidates = getProfileLocationCandidates(profile, locationHint);

  try {
    const result = await resolveWeatherLocation(candidates);

    if (!result) {
      return buildUnavailableWeather(
        locationLabel,
        'Weather data unavailable for this location. Update your city in Profile.'
      );
    }

    const weatherData = await fetchCurrentWeather(result.latitude, result.longitude);
    const weather = mapCurrentWeather(result, weatherData, locationLabel);

    const profileHasLocation = Boolean(profile.city || profile.district || profile.state);
    weather.isFallbackLocation = !profileHasLocation && result.name === DEFAULT_LOCATION;

    if (weather.isFallbackLocation) {
      weather.forecast = `${weather.forecast} Add your city in Profile for local weather.`;
    }

    return weather;
  } catch (error) {
    console.error('Weather fetch failed', error);
    return buildUnavailableWeather(
      locationLabel,
      'Weather data unavailable right now. Please try again.'
    );
  }
};

export const getForecastForProfileAndDate = async (profile = {}, selectedDate, locationHint = '') => {
  const locationLabel = resolveLocationLabel(profile);
  const candidates = getProfileLocationCandidates(profile, locationHint);

  try {
    const result = await resolveWeatherLocation(candidates);

    if (!result || !selectedDate) {
      return { locationName: locationLabel, forecast: [], error: 'Location not found' };
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const params = new URLSearchParams({
      latitude: String(result.latitude),
      longitude: String(result.longitude),
      hourly: 'temperature_2m,precipitation_probability,weathercode',
      timezone: 'Asia/Kolkata',
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
    });

    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Forecast API failed with status ${response.status}`);
    }

    const weatherData = await response.json();
    if (weatherData.error) {
      throw new Error(weatherData.reason || 'Forecast API returned an error');
    }

    const hourly = weatherData.hourly || {};
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const rain = hourly.precipitation_probability || [];
    const codes = hourly.weathercode || [];

    const selectedDayEntries = times
      .map((time, index) => ({
        time,
        temp: Number.isFinite(temps[index]) ? Math.round(temps[index]) : null,
        rain: Number.isFinite(rain[index]) ? Math.round(rain[index]) : 0,
        code: codes[index],
        condition: (weatherCodeMap[codes[index]] || weatherCodeMap[0]).condition,
      }))
      .filter((entry) => entry.time.startsWith(selectedDate));

    return {
      locationName:
        [result.name, result.admin1, result.country].filter(Boolean).join(', ') || locationLabel,
      forecast: selectedDayEntries.slice(0, 8),
      error: selectedDayEntries.length ? '' : 'No forecast available for this date.',
    };
  } catch (error) {
    console.error('Forecast fetch failed', error);
    return {
      locationName: locationLabel,
      forecast: [],
      error: 'Weather forecast unavailable right now.',
    };
  }
};
