/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParcoursItem {
  type: string;
  distance_km: number | null;
  denivele: string | number | null;
  difficulte: string | null;
  horaires: string | null;
  ravitaillement: string | null;
  tarif: string | null;
}

export interface ExternalLink {
  libelle: string;
  url: string;
}

export interface FFBCRando {
  id: string;
  nom: string;
  date: string; // YYYY-MM-DD
  province: string | null;
  code_postal: string | null;
  localite: string | null;
  texte_calendrier?: string | null;
  lieu_depart?: string | null;
  adresse?: string | null;
  lien_itineraire?: string | null;
  club?: string | null;
  parcours?: ParcoursItem[];
  remarque?: string | null;
  liens_externes?: ExternalLink[];
  latitude?: number | null;
  longitude?: number | null;
  computedDistanceKm?: number; // distance from selected Belgian postal code
}

export type DisciplineType = 'ROUTE' | 'GRAVEL' | 'MARCHE' | 'VTT';

export interface CalendarDataset {
  source: string;
  annee?: string | number;
  date_extraction: string;
  nombre_randonnées: number;
  randonnées: FFBCRando[];
  lastLoaded?: string;
  isLive?: boolean;
}

export interface DistanceFilter {
  enabled: boolean;
  postalCode: string; // 4-digit Belgian postal code (e.g. 7000)
  maxKm: number; // radius in km (e.g. 50 km)
}

export interface FilterCriteria {
  disciplines: {
    ROUTE: boolean;
    GRAVEL: boolean;
    MARCHE: boolean;
    VTT: boolean;
  };
  provinces: string[]; // selected province names
  allProvinces: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  distance: DistanceFilter;
  searchQuery: string;
}

export interface InputGitHubFile {
  name: string;
  path: string;
  size: number;
  download_url: string;
  html_url: string;
  type: string;
  matchedCategory: 'route' | 'gravel' | 'tout' | 'province' | 'other';
  matchedLabel: string;
  discipline?: DisciplineType;
  province?: string;
}
