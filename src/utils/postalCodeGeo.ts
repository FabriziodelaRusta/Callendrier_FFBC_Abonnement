/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FFBCRando } from '../types';
import postalCodesRaw from '../data/postalCodesBelgium.json';
import { EVENT_COORDINATES } from '../data/coordinatesDb';

export interface GeoPoint {
  lat: number;
  lng: number;
  name?: string;
}

const belgianPostalCodes: Record<string, GeoPoint> = postalCodesRaw as Record<string, GeoPoint>;

// Famous Belgian cities with their postal codes for quick selection
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
 * Looks up coordinates for a 4-digit Belgian postal code
 */
export function getBelgianPostalCodeCoord(postalCode: string): GeoPoint | null {
  if (!postalCode) return null;
  const clean = postalCode.trim();
  if (belgianPostalCodes[clean]) {
    return belgianPostalCodes[clean];
  }
  // If user entered e.g. 7334 or 07334
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
  // 1. Direct explicit coordinates on event
  if (typeof rando.latitude === 'number' && typeof rando.longitude === 'number' && rando.latitude !== 0) {
    return { lat: rando.latitude, lng: rando.longitude, name: rando.localite || undefined };
  }

  // 2. Curated coordinates table by ID
  if (rando.id && EVENT_COORDINATES[rando.id]) {
    return EVENT_COORDINATES[rando.id];
  }

  // 3. Belgian postal code
  if (rando.code_postal) {
    const cp = rando.code_postal.trim();
    if (belgianPostalCodes[cp]) {
      return belgianPostalCodes[cp];
    }
  }

  return null;
}

/**
 * Computes distance in km from a Belgian postal code to the rando departure point
 */
export function getDistanceFromPostalCode(
  rando: FFBCRando,
  originPostalCode: string
): number | null {
  const origin = getBelgianPostalCodeCoord(originPostalCode);
  if (!origin) return null;

  const randoCoord = getRandoCoordinates(rando);
  if (!randoCoord) return null;

  return calculateDistanceKm(origin.lat, origin.lng, randoCoord.lat, randoCoord.lng);
}

/**
 * Returns matching postal code suggestions for user input
 */
export function searchBelgianPostalCodes(query: string): Array<{ code: string; label: string }> {
  if (!query || query.length < 2) return [];
  const q = query.trim().toLowerCase();

  const results: Array<{ code: string; label: string }> = [];

  // Match in popular cities first
  for (const item of POPULAR_BELGIAN_POSTAL_CODES) {
    if (item.code.startsWith(q) || item.city.toLowerCase().includes(q)) {
      results.push({
        code: item.code,
        label: `${item.code} ${item.city} (${item.province})`,
      });
    }
  }

  // Match in general database if needed
  if (results.length < 6) {
    for (const [code, val] of Object.entries(belgianPostalCodes)) {
      if (code.startsWith(q) && !results.some((r) => r.code === code)) {
        results.push({
          code,
          label: `${code} ${val.name || ''}`.trim(),
        });
        if (results.length >= 8) break;
      }
    }
  }

  return results.slice(0, 8);
}
