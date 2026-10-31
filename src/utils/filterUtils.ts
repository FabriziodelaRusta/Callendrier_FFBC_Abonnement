/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FFBCRando, DisciplineType } from '../types';

export const PROVINCES_ORDER = [
  'Hainaut',
  'Namur',
  'Liège',
  'Luxembourg',
  'Brabant Wallon',
  'Bruxelles',
  'Brabant Flamand',
  'Autres / France',
] as const;

export function normalizeProvince(provinceRaw: string | null | undefined): string {
  if (!provinceRaw || provinceRaw.trim() === '' || provinceRaw === 'Inconnu' || provinceRaw === 'Inconnue') {
    return 'Autres / France';
  }
  const clean = provinceRaw.trim();
  if (clean === 'Luxembourg - B' || clean === 'Luxembourg') return 'Luxembourg';
  if (clean === 'Liege' || clean === 'Liège') return 'Liège';
  if (clean.toLowerCase().includes('france')) return 'Autres / France';
  return clean;
}

export function getDisciplineMatches(rando: FFBCRando): {
  isRoute: boolean;
  isGravel: boolean;
  isVtt: boolean;
  isMarche: boolean;
  primary: DisciplineType;
} {
  const parcoursTypes = (rando.parcours || []).map(p => (p.type || '').toUpperCase());
  const nameUpper = (rando.nom || '').toUpperCase();
  const remarkUpper = (rando.remarque || '').toUpperCase();
  const locUpper = (rando.localite || '').toUpperCase();

  const isMarche =
    parcoursTypes.some(t => t.includes('MARCH') || t.includes('PEDESTRE') || t.includes('WALK')) ||
    nameUpper.includes('MARCHE') ||
    remarkUpper.includes('MARCHE') ||
    locUpper.includes('MARCHE');

  const isVtt =
    parcoursTypes.some(t => t.includes('VTT')) ||
    nameUpper.includes('VTT') ||
    remarkUpper.includes('VTT') ||
    locUpper.includes('VTT');

  const isGravel =
    parcoursTypes.some(t => t.includes('GRAVEL')) ||
    nameUpper.includes('GRAVEL') ||
    remarkUpper.includes('GRAVEL') ||
    locUpper.includes('GRAVEL');

  const isRoute =
    parcoursTypes.some(
      t =>
        t.includes('ROUTE') ||
        t.includes('CYCLO') ||
        t.includes('EASY') ||
        t.includes('DIAGONALE') ||
        t.includes('ETOILE') ||
        t.includes('BAD')
    ) ||
    (!isVtt && !isGravel && !isMarche) ||
    nameUpper.includes('CYCLO') ||
    nameUpper.includes('ROUTE');

  let primary: DisciplineType = 'ROUTE';
  if (isRoute) primary = 'ROUTE';
  else if (isGravel) primary = 'GRAVEL';
  else if (isVtt) primary = 'VTT';
  else if (isMarche) primary = 'MARCHE';

  return { isRoute, isGravel, isVtt, isMarche, primary };
}

export function matchDiscipline(rando: FFBCRando, discipline: DisciplineType): boolean {
  const flags = getDisciplineMatches(rando);
  switch (discipline) {
    case 'ROUTE':
      return flags.isRoute;
    case 'GRAVEL':
      return flags.isGravel;
    case 'MARCHE':
      return flags.isMarche;
    case 'VTT':
      return flags.isVtt;
    default:
      return true;
  }
}

/**
 * Computes cycling season range.
 * Rule: cycling season ends on October 31.
 * If today is after Oct 31 (month is 11 or 12), the season ends Oct 31 of next year.
 * Example given by user: on 2 Nov 2026, events will be from 2 Nov 2026 to 31 Oct 2027.
 * If today is on or before Oct 31, season ends Oct 31 of current year.
 */
export function getSeasonBounds(refDate: Date = new Date()): {
  todayStr: string;
  seasonEndStr: string;
  seasonLabel: string;
} {
  const y = refDate.getFullYear();
  const m = refDate.getMonth() + 1; // 1-12
  const d = refDate.getDate();

  const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  let endYear = y;
  // If we are in November or December (or on Oct 31 afternoon transitioning to new season)
  if (m > 10) {
    endYear = y + 1;
  } else if (m === 10 && d === 31) {
    // If today is exactly Oct 31, the user might want either current season or next season;
    // To allow picking the full upcoming season starting tomorrow, provide next year's Oct 31
    // or keep current year Oct 31. Since dataset currently has 2026 events, let's keep 2026-10-31 or 2026-12-31.
    // If m === 10 and d === 31, let's set endYear = y.
    endYear = y;
  }

  const seasonEndStr = `${endYear}-10-31`;
  // Une saison commence le 1er nov de l'année précédente et se termine le 31 oct de l'année en cours
  // Exemple : le 2 nov 2026 est dans la saison 2027 -> simplement "Saison 2027"
  const seasonLabel = `Saison ${endYear}`;

  return {
    todayStr,
    seasonEndStr,
    seasonLabel,
  };
}

export function formatDateFrench(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
