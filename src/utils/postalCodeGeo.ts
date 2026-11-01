/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FFBCRando } from '../types';
import postalCodesRaw from '../data/postalCodesBelgium.json';
import belgianCitiesRaw from '../data/belgianCities.json';
import { EVENT_COORDINATES } from '../data/coordinatesDb';

export interface GeoPoint {
  lat: number;
  lng: number;
  name?: string;
  city?: string;
  zip?: string;
}

export interface GazetteerItem {
  zip: string;
  city: string;
  label: string;
  lat: number;
  lng: number;
}

const belgianPostalCodes: Record<string, GeoPoint> = postalCodesRaw as Record<string, GeoPoint>;

interface RawCity {
  zip: string;
  city: string;
  lat: number;
  lng: number;
}

const allBelgianCities: RawCity[] = belgianCitiesRaw as RawCity[];

// Normalize string for accent-insensitive search
function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Popular Belgian cities for quick shortcuts
export const POPULAR_BELGIAN_POSTAL_CODES = [
  { code: '7000', city: 'Mons', province: 'Hainaut' },
  { code: '6000', city: 'Charleroi', province: 'Hainaut' },
  { code: '7500', city: 'Tournai', province: 'Hainaut' },
  { code: '5000', city: 'Namur', province: 'Namur' },
  { code: '5500', city: 'Dinant', province: 'Namur' },
  { code: '5590', city: 'Ciney', province: 'Namur' },
  { code: '4000', city: 'Liège', province: 'Liège' },
  { code: '4800', city: 'Verviers', province: 'Liège' },
  { code: '4500', city: 'Huy', province: 'Liège' },
  { code: '6700', city: 'Arlon', province: 'Luxembourg' },
  { code: '6800', city: 'Libramont', province: 'Luxembourg' },
  { code: '6900', city: 'Marche-en-Famenne', province: 'Luxembourg' },
  { code: '1300', city: 'Wavre', province: 'Brabant Wallon' },
  { code: '1400', city: 'Nivelles', province: 'Brabant Wallon' },
  { code: '1348', city: 'Louvain-la-Neuve', province: 'Brabant Wallon' },
  { code: '1000', city: 'Bruxelles', province: 'Bruxelles' },
] as const;

/**
 * Looks up coordinates for a 4-digit Belgian postal code or city
 */
export function getBelgianPostalCodeCoord(postalCodeOrCity: string): GeoPoint | null {
  if (!postalCodeOrCity) return null;
  const clean = postalCodeOrCity.trim();

  // 1. Direct match by zip in belgianCities
  const cityMatch = allBelgianCities.find(
    (c) => c.zip === clean || normalizeSearch(c.city) === normalizeSearch(clean)
  );
  if (cityMatch) {
    return {
      lat: cityMatch.lat,
      lng: cityMatch.lng,
      name: cityMatch.city,
      city: cityMatch.city,
      zip: cityMatch.zip,
    };
  }

  // 2. Direct match in postalCodesBelgium
  if (belgianPostalCodes[clean]) {
    return belgianPostalCodes[clean];
  }
  const numeric = String(parseInt(clean, 10));
  if (belgianPostalCodes[numeric]) {
    return belgianPostalCodes[numeric];
  }

  return null;
}

/**
 * Great-circle distance between two points in kilometers (Haversine formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolves the geographic coordinates of an FFBC rando
 */
export function getRandoCoordinates(rando: FFBCRando): GeoPoint | null {
  // 1. Direct coordinates on event
  if (typeof rando.latitude === 'number' && typeof rando.longitude === 'number' && rando.latitude !== 0) {
    return { lat: rando.latitude, lng: rando.longitude, name: rando.localite || undefined };
  }

  // 2. Curated coordinates table by ID
  if (rando.id && EVENT_COORDINATES[rando.id]) {
    return EVENT_COORDINATES[rando.id];
  }

  // 3. Belgian postal code or locality
  if (rando.code_postal) {
    const cp = rando.code_postal.trim();
    const coord = getBelgianPostalCodeCoord(cp);
    if (coord) return coord;
  }

  return null;
}

/**
 * Computes distance in km from a Belgian postal code / city to the rando departure point
 */
export function getDistanceFromPostalCode(
  rando: FFBCRando,
  originPostalCodeOrCity: string
): number | null {
  const origin = getBelgianPostalCodeCoord(originPostalCodeOrCity);
  if (!origin) return null;

  const randoCoord = getRandoCoordinates(rando);
  if (!randoCoord) return null;

  return calculateDistanceKm(origin.lat, origin.lng, randoCoord.lat, randoCoord.lng);
}

/**
 * Gazetteer search: searches Belgian cities and postal codes with prefix & fuzzy matching
 */
export function searchBelgianGazetteer(query: string): GazetteerItem[] {
  if (!query || query.trim().length < 2) return [];
  const q = normalizeSearch(query);

  const results: GazetteerItem[] = [];
  const seen = new Set<string>();

  // 1. Exact postal code prefix match
  for (const c of allBelgianCities) {
    if (c.zip.startsWith(q)) {
      const key = `${c.zip}-${c.city}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          zip: c.zip,
          city: c.city,
          label: `${c.zip} ${c.city}`,
          lat: c.lat,
          lng: c.lng,
        });
      }
    }
    if (results.length >= 10) break;
  }

  // 2. City name starts with query
  for (const c of allBelgianCities) {
    const normCity = normalizeSearch(c.city);
    if (normCity.startsWith(q)) {
      const key = `${c.zip}-${c.city}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          zip: c.zip,
          city: c.city,
          label: `${c.city} (${c.zip})`,
          lat: c.lat,
          lng: c.lng,
        });
      }
    }
    if (results.length >= 12) break;
  }

  // 3. City name contains query (if still room)
  if (results.length < 8) {
    for (const c of allBelgianCities) {
      const normCity = normalizeSearch(c.city);
      if (normCity.includes(q) && !normCity.startsWith(q)) {
        const key = `${c.zip}-${c.city}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            zip: c.zip,
            city: c.city,
            label: `${c.city} (${c.zip})`,
            lat: c.lat,
            lng: c.lng,
          });
        }
      }
      if (results.length >= 12) break;
    }
  }

  return results.slice(0, 10);
}
