// util/location.js
const axios = require('axios');
const HttpError = require('../models/http-error');

/**
 * Fast local dictionary for common Somalia places.
 * Add/adjust as you need (districts, markets, landmarks).
 */
const knownLocations = {
  hodan:        { lat: 2.0371, lng: 45.3055 },
  bakaaro:      { lat: 2.0403, lng: 45.3270 },
  howlwadaag:   { lat: 2.0400, lng: 45.3180 },
  hawl_wadaag:  { lat: 2.0400, lng: 45.3180 },
  warta_nabadda:{ lat: 2.0536, lng: 45.3300 },
  wadjir:       { lat: 2.0150, lng: 45.3000 },
  bondhere:     { lat: 2.0460, lng: 45.3450 },
  heliwaa:      { lat: 2.1190, lng: 45.3200 },
  daynile:      { lat: 2.0890, lng: 45.2680 },
  hodon:        { lat: 2.0371, lng: 45.3055 }, // common misspelling
};

// Safe default (Mogadishu center) so your app keeps working.
const DEFAULT_COORDS = { lat: 2.0469, lng: 45.3182 };

/**
 * Call OpenStreetMap Nominatim (free, no key).
 * We bias to Somalia using `countrycodes=so` and take the top hit.
 * Respect their usage policy: include a descriptive User-Agent.
 */
async function nominatimSearch(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json` +
              `&q=${encodeURIComponent(address)}` +
              `&countrycodes=so&limit=1`;

  const headers = {
    // Use your app’s name/email per Nominatim policy
    'User-Agent': 'safarx-mern-backend/1.0 (admin@safarx.example)',
  };

  const resp = await axios.get(url, { headers, timeout: 8000 });
  const arr = Array.isArray(resp.data) ? resp.data : [];
  if (arr.length === 0) return null;

  const first = arr[0];
  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
}

/**
 * Main resolver:
 * 1) exact/local dictionary hit
 * 2) Nominatim for Somalia
 * 3) default Mogadishu center (never throws)
 */
async function getCoordsForAddress(address) {
  if (!address || typeof address !== 'string') {
    // keep behavior consistent with your controllers
    throw new HttpError('Invalid address.', 422);
  }

  const key = address.toLowerCase().trim().replace(/\s+/g, '_');
  if (knownLocations[key]) {
    return knownLocations[key];
  }

  // Try with ", Somalia" suffix to improve hits for short names like "Hodan"
  const attempts = [
    address,
    `${address}, Mogadishu, Somalia`,
    `${address}, Somalia`,
  ];

  for (const query of attempts) {
    try {
      const coords = await nominatimSearch(query);
      if (coords) return coords;
      // If OSM returns nothing, try the next variant
    } catch {
      // Network/timeout: just try the next variant
    }
  }

  // Final fallback so your creation flow doesn’t break.
  return DEFAULT_COORDS;
}

module.exports = getCoordsForAddress;
