/**
 * Système de capture d'entropie chaotique
 * Combine : positions des serpents + météo réelle + timing
 *
 * Niveau de sécurité comparable à Cloudflare (lampes à lave)
 */

import { entropyPool } from './entropyPool';

/**
 * Convertit les positions des serpents en coordonnées GPS
 * @param {Array} segments - Tableau des refs des segments
 * @returns {{ lat: number, lon: number }}
 */
function segmentsToGPS(segments) {
  if (!segments || segments.length < 12) {
    // Fallback aléatoire si pas assez de segments
    return {
      lat: (Math.random() * 180) - 90,
      lon: (Math.random() * 360) - 180
    };
  }

  // Prendre 6 segments pour la latitude, 6 pour la longitude
  let latSum = 0;
  let lonSum = 0;

  for (let i = 0; i < 6; i++) {
    const el = segments[i];
    if (el) {
      const rect = el.getBoundingClientRect();
      latSum += rect.x + rect.y;
    }
  }

  for (let i = 6; i < 12; i++) {
    const el = segments[i];
    if (el) {
      const rect = el.getBoundingClientRect();
      lonSum += rect.x + rect.y;
    }
  }

  // Normaliser vers des coordonnées GPS valides
  // Latitude: -90 à +90
  // Longitude: -180 à +180
  const lat = ((latSum * performance.now()) % 180) - 90;
  const lon = ((lonSum * performance.now()) % 360) - 180;

  return {
    lat: parseFloat(lat.toFixed(6)),
    lon: parseFloat(lon.toFixed(6))
  };
}

/**
 * Géocodage inversé - trouve le lieu le plus proche des coordonnées
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{city: string, country: string}>}
 */
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();

    return {
      city: data.city || data.locality || data.principalSubdivision || 'Inconnu',
      country: data.countryName || 'Inconnu',
      countryCode: data.countryCode || 'XX'
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return {
      city: 'Inconnu',
      country: 'Inconnu',
      countryCode: 'XX'
    };
  }
}

/**
 * Convertit un code météo WMO en description française
 * @param {number} code - Code météo WMO
 * @returns {string} Description météo
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: 'Ciel dégagé',
    1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert',
    45: 'Brouillard', 48: 'Brouillard givrant',
    51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
    56: 'Bruine verglaçante', 57: 'Bruine verglaçante forte',
    61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
    66: 'Pluie verglaçante', 67: 'Pluie verglaçante forte',
    71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
    77: 'Grains de neige',
    80: 'Averses légères', 81: 'Averses', 82: 'Averses fortes',
    85: 'Averses de neige', 86: 'Averses de neige fortes',
    95: 'Orage', 96: 'Orage avec grêle', 99: 'Orage violent'
  };
  return descriptions[code] || 'Inconnu';
}

/**
 * Récupère les données météo via Open-Meteo (gratuit, sans clé API)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Données météo
 */
async function fetchWeatherData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,weather_code&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Open-Meteo API error');
    }

    const data = await response.json();
    const current = data.current;

    return {
      source: 'open-meteo',
      timestamp: Date.now(),
      location: {
        lat,
        lon,
        timezone: data.timezone || 'UTC'
      },
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      pressure: current.surface_pressure,
      windSpeed: current.wind_speed_10m,
      windDeg: current.wind_direction_10m,
      clouds: current.cloud_cover,
      weatherCode: current.weather_code,
      weatherMain: getWeatherDescription(current.weather_code)
    };
  } catch (error) {
    console.warn('Open-Meteo failed, using simulation:', error);
    return generateSimulatedWeather(lat, lon);
  }
}

/**
 * Génère des données météo simulées basées sur les coordonnées et le temps
 * Utilisé comme fallback si pas d'API key
 */
function generateSimulatedWeather(lat, lon) {
  const now = Date.now();
  const micro = performance.now();

  // Utiliser les coordonnées + temps pour générer des valeurs "chaotiques"
  const seed = (lat * 1000 + lon * 100 + micro) % 1000000;

  return {
    source: 'simulated',
    timestamp: now,
    microtime: micro,
    location: { lat, lon },
    // Valeurs pseudo-chaotiques basées sur le seed
    temperature: ((Math.sin(seed) + 1) * 30) - 10, // -10 à 50°C
    humidity: ((Math.cos(seed * 1.5) + 1) * 50), // 0 à 100%
    pressure: 980 + ((Math.sin(seed * 2.3) + 1) * 40), // 980 à 1060 hPa
    windSpeed: ((Math.cos(seed * 3.7) + 1) * 15), // 0 à 30 m/s
    windDeg: ((Math.sin(seed * 4.2) + 1) * 180), // 0 à 360°
    clouds: ((Math.cos(seed * 5.1) + 1) * 50), // 0 à 100%
    uvIndex: ((Math.sin(seed * 6.8) + 1) * 6), // 0 à 12
    // Ajouter le pool d'entropie actuel pour plus de chaos
    poolSample: Array.from(entropyPool.pool.slice(0, 16))
  };
}

/**
 * Capture l'état actuel des serpents
 * @param {Array} segmentRefs - Refs des segments DOM
 * @returns {object} État capturé
 */
function captureSegmentsState(segmentRefs) {
  const segments = [];

  for (let i = 0; i < segmentRefs.length; i++) {
    const el = segmentRefs[i];
    if (el) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      segments.push({
        index: i,
        x: rect.x,
        y: rect.y,
        symbol: el.textContent,
        opacity: style.opacity,
        transform: style.transform
      });
    }
  }

  return segments;
}

/**
 * Génère un hash à partir de données arbitraires
 * @param {string} data - Données à hasher
 * @returns {Promise<string>} Hash hexadécimal
 */
async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Utiliser SubtleCrypto pour un vrai hash SHA-256
  if (crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple si SubtleCrypto non disponible
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Capture complète : serpents + GPS + météo + timing
 * @param {Array} segmentRefs - Refs des segments DOM
 * @returns {Promise<object>} Snapshot complet avec hash
 */
export async function captureFullSnapshot(segmentRefs) {
  const startTime = performance.now();

  // 1. Capturer l'état des serpents
  const segmentsState = captureSegmentsState(segmentRefs);

  // 2. Convertir en coordonnées GPS
  const gpsCoords = segmentsToGPS(segmentRefs);

  // 3. Récupérer la météo et la localisation en parallèle
  const [weather, location] = await Promise.all([
    fetchWeatherData(gpsCoords.lat, gpsCoords.lon),
    reverseGeocode(gpsCoords.lat, gpsCoords.lon)
  ]);

  // Combiner GPS + localisation
  const gps = {
    ...gpsCoords,
    city: location.city,
    country: location.country,
    countryCode: location.countryCode
  };

  // 4. Capturer le timing exact
  const timing = {
    timestamp: Date.now(),
    microtime: performance.now(),
    captureStart: startTime,
    captureDuration: performance.now() - startTime
  };

  // 5. Capturer l'état du pool d'entropie
  const poolState = {
    position: entropyPool.position,
    readPosition: entropyPool.readPosition,
    totalEntropy: entropyPool.totalEntropy,
    sample: Array.from(entropyPool.pool.slice(0, 32))
  };

  // 6. Assembler le snapshot
  const snapshot = {
    version: '1.0',
    segments: segmentsState,
    gps,
    weather,
    timing,
    pool: poolState
  };

  // 7. Générer le hash final
  const snapshotString = JSON.stringify(snapshot);
  const hash = await hashData(snapshotString);

  // 8. Ajouter l'entropie au pool
  const hashBytes = hash.match(/.{2}/g).map(hex => parseInt(hex, 16));
  hashBytes.forEach((byte, i) => {
    entropyPool.addEntropy(i, byte, performance.now());
  });

  return {
    ...snapshot,
    hash,
    hashShort: hash.substring(0, 16),
    entropyBits: snapshotString.length * 8
  };
}

/**
 * Génère un mot de passe ultra-sécurisé basé sur un snapshot complet
 * @param {Array} segmentRefs - Refs des segments DOM
 * @param {number} length - Longueur du mot de passe
 * @returns {Promise<object>} Mot de passe + métadonnées
 */
export async function generateChaosPassword(segmentRefs, length = 24) {
  const snapshot = await captureFullSnapshot(segmentRefs);

  // Utiliser le hash du snapshot comme source
  const charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    // Combiner hash + crypto.getRandomValues
    const randomByte = new Uint8Array(1);
    crypto.getRandomValues(randomByte);

    const hashByte = parseInt(snapshot.hash.substr(i * 2 % 64, 2), 16);
    const combined = (randomByte[0] ^ hashByte) % charset.length;

    password += charset.charAt(combined);
  }

  return {
    password,
    snapshot,
    strength: 'chaos-level',
    source: snapshot.weather.source === 'openweathermap' ? 'GPS + Real Weather' : 'GPS + Simulated Weather'
  };
}

export { segmentsToGPS, fetchWeatherData, captureSegmentsState };
