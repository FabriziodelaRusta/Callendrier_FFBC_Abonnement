/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Download,
  Calendar,
  Check,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
  Info,
  RotateCcw,
  Navigation,
  MapPin,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { FFBCRando, FilterCriteria, DisciplineType } from '../types';
import {
  PROVINCES_ORDER,
  normalizeProvince,
  matchDiscipline,
  getSeasonBounds,
  formatDateFrench,
  getDisciplineMatches,
} from '../utils/filterUtils';
import { generateICalendar, downloadIcsFile } from '../utils/icsGenerator';
import {
  getBelgianPostalCodeCoord,
  getDistanceFromPostalCode,
  POPULAR_BELGIAN_POSTAL_CODES,
  searchBelgianGazetteer,
  GazetteerItem,
} from '../utils/postalCodeGeo';
import { DisciplineIcon } from './DisciplineIcon';

interface CustomCalendarGeneratorProps {
  allEvents: FFBCRando[];
  criteria: FilterCriteria;
  onCriteriaChange: (updater: (prev: FilterCriteria) => FilterCriteria) => void;
  onSelectEvent: (rando: FFBCRando) => void;
}

export const CustomCalendarGenerator: React.FC<CustomCalendarGeneratorProps> = ({
  allEvents,
  criteria,
  onCriteriaChange,
  onSelectEvent,
}) => {
  const seasonBounds = useMemo(() => getSeasonBounds(), []);
  const seasonYear = useMemo(() => {
    const match = seasonBounds.seasonLabel.match(/\d{4}/);
    return match ? match[0] : String(new Date().getFullYear());
  }, [seasonBounds.seasonLabel]);

  // Default calendar name: Mon_calendrier_FFBC_ suivi de l'année (saison)
  const defaultCalName = `Mon_calendrier_FFBC_${seasonYear}`;
  const [customName, setCustomName] = useState(defaultCalName);

  // Gazetteer state with debounce
  const [gazetteerQuery, setGazetteerQuery] = useState(
    criteria.distance.cityName
      ? `${criteria.distance.postalCode} ${criteria.distance.cityName}`
      : criteria.distance.postalCode || ''
  );
  const [suggestions, setSuggestions] = useState<GazetteerItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const gazetteerRef = useRef<HTMLDivElement>(null);

  const [listSearch, setListSearch] = useState('');
  const [sortMode, setSortMode] = useState<'date' | 'distance'>('date');
  const [showEventsList, setShowEventsList] = useState(true);

  // Debounced search for gazetteer (proposes city/postal code after 250ms)
  useEffect(() => {
    if (!gazetteerQuery || gazetteerQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const results = searchBelgianGazetteer(gazetteerQuery);
      setSuggestions(results);
    }, 250);

    return () => clearTimeout(timer);
  }, [gazetteerQuery]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gazetteerRef.current && !gazetteerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recognized Belgian city/coord for current postal code
  const currentPostalCoord = useMemo(() => {
    if (!criteria.distance.postalCode) return null;
    return getBelgianPostalCodeCoord(criteria.distance.postalCode);
  }, [criteria.distance.postalCode]);

  // Compute matching events in real time
  const matchingEvents = useMemo(() => {
    return allEvents
      .map((rando) => {
        let computedDistanceKm: number | undefined;
        if (criteria.distance.enabled && criteria.distance.postalCode) {
          const dist = getDistanceFromPostalCode(rando, criteria.distance.postalCode);
          if (dist !== null) {
            computedDistanceKm = dist;
          }
        }
        return {
          ...rando,
          computedDistanceKm,
        };
      })
      .filter((rando) => {
        // 1. Discipline filter
        const isRoute = criteria.disciplines.ROUTE && matchDiscipline(rando, 'ROUTE');
        const isGravel = criteria.disciplines.GRAVEL && matchDiscipline(rando, 'GRAVEL');
        const isMarche = criteria.disciplines.MARCHE && matchDiscipline(rando, 'MARCHE');
        const isVtt = criteria.disciplines.VTT && matchDiscipline(rando, 'VTT');

        if (!isRoute && !isGravel && !isMarche && !isVtt) {
          return false;
        }

        // 2. Province filter
        if (!criteria.allProvinces) {
          const normP = normalizeProvince(rando.province);
          if (!criteria.provinces.includes(normP)) {
            return false;
          }
        }

        // 3. Date range filter (appliqué uniquement si le filtre période est activé)
        if (criteria.periodEnabled) {
          if (criteria.startDate && rando.date < criteria.startDate) {
            return false;
          }
          if (criteria.endDate && rando.date > criteria.endDate) {
            return false;
          }
        }

        // 4. Distance selection filter
        if (criteria.distance.enabled && criteria.distance.postalCode) {
          if (rando.computedDistanceKm === undefined) {
            return false;
          }
          if (rando.computedDistanceKm > criteria.distance.maxKm) {
            return false;
          }
        }

        // 5. Text search query if present
        if (criteria.searchQuery.trim() !== '') {
          const q = criteria.searchQuery.toLowerCase();
          const text = `${rando.nom} ${rando.localite || ''} ${rando.code_postal || ''} ${rando.club || ''} ${rando.lieu_depart || ''}`.toLowerCase();
          if (!text.includes(q)) return false;
        }

        return true;
      });
  }, [allEvents, criteria]);

  // Sorted and searched events for the bottom preview
  const displayEvents = useMemo(() => {
    let list = matchingEvents;
    if (listSearch.trim() !== '') {
      const q = listSearch.toLowerCase();
      list = list.filter((e) => {
        const text = `${e.nom} ${e.localite || ''} ${e.code_postal || ''} ${e.club || ''} ${e.province || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      if (sortMode === 'distance' && a.computedDistanceKm !== undefined && b.computedDistanceKm !== undefined) {
        return a.computedDistanceKm - b.computedDistanceKm;
      }
      return a.date.localeCompare(b.date);
    });
  }, [matchingEvents, listSearch, sortMode]);

  // Discipline counts
  const disciplineCounts = useMemo(() => {
    let route = 0;
    let gravel = 0;
    let marche = 0;
    let vtt = 0;
    for (const ev of allEvents) {
      if (matchDiscipline(ev, 'ROUTE')) route++;
      if (matchDiscipline(ev, 'GRAVEL')) gravel++;
      if (matchDiscipline(ev, 'MARCHE')) marche++;
      if (matchDiscipline(ev, 'VTT')) vtt++;
    }
    return { route, gravel, marche, vtt };
  }, [allEvents]);

  // Province counts
  const provinceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of allEvents) {
      const p = normalizeProvince(ev.province);
      counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [allEvents]);

  // Handlers for Disciplines
  const handleToggleDiscipline = (disc: DisciplineType) => {
    onCriteriaChange((prev) => ({
      ...prev,
      disciplines: {
        ...prev.disciplines,
        [disc]: !prev.disciplines[disc],
      },
    }));
  };

  const handleSelectAllDisciplines = (select: boolean) => {
    onCriteriaChange((prev) => ({
      ...prev,
      disciplines: {
        ROUTE: select,
        GRAVEL: select,
        MARCHE: select,
        VTT: select,
      },
    }));
  };

  // Handlers for Provinces
  const handleToggleAllProvinces = () => {
    onCriteriaChange((prev) => {
      const nextAll = !prev.allProvinces;
      return {
        ...prev,
        allProvinces: nextAll,
        provinces: nextAll ? [...PROVINCES_ORDER] : [],
      };
    });
  };

  const handleToggleProvince = (province: string) => {
    onCriteriaChange((prev) => {
      const exists = prev.provinces.includes(province);
      let newProvinces: string[];
      if (exists) {
        newProvinces = prev.provinces.filter((p) => p !== province);
      } else {
        newProvinces = [...prev.provinces, province];
      }
      return {
        ...prev,
        provinces: newProvinces,
        allProvinces: newProvinces.length === PROVINCES_ORDER.length,
      };
    });
  };

  // Handlers for Dates & Period Filter
  const handleTogglePeriodFilter = (enabled: boolean) => {
    onCriteriaChange((prev) => ({ ...prev, periodEnabled: enabled }));
  };

  const handleSetStartDate = (val: string) => {
    onCriteriaChange((prev) => ({ ...prev, startDate: val, periodEnabled: true }));
  };

  const handleSetEndDate = (val: string) => {
    onCriteriaChange((prev) => ({ ...prev, endDate: val, periodEnabled: true }));
  };

  const applyPresetSeason = () => {
    onCriteriaChange((prev) => ({
      ...prev,
      startDate: seasonBounds.todayStr,
      endDate: seasonBounds.seasonEndStr,
      periodEnabled: true,
    }));
  };

  const applyPresetFull2026 = () => {
    onCriteriaChange((prev) => ({
      ...prev,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      periodEnabled: true,
    }));
  };

  const applyPresetNext3Months = () => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    onCriteriaChange((prev) => ({
      ...prev,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      periodEnabled: true,
    }));
  };

  // Distance selection handlers
  const handleToggleDistanceFilter = (enabled: boolean) => {
    onCriteriaChange((prev) => ({
      ...prev,
      distance: {
        ...prev.distance,
        enabled,
      },
    }));
  };

  const handleSelectGazetteerItem = (item: GazetteerItem) => {
    setGazetteerQuery(`${item.zip} ${item.city}`);
    setShowSuggestions(false);
    onCriteriaChange((prev) => ({
      ...prev,
      distance: {
        ...prev.distance,
        postalCode: item.zip,
        cityName: item.city,
        enabled: true,
      },
    }));
  };

  const handleSelectPopularCity = (code: string, city: string) => {
    setGazetteerQuery(`${code} ${city}`);
    setShowSuggestions(false);
    onCriteriaChange((prev) => ({
      ...prev,
      distance: {
        ...prev.distance,
        postalCode: code,
        cityName: city,
        enabled: true,
      },
    }));
  };

  const handleClearDistance = () => {
    setGazetteerQuery('');
    onCriteriaChange((prev) => ({
      ...prev,
      distance: {
        ...prev.distance,
        postalCode: '',
        cityName: undefined,
        enabled: false,
      },
    }));
  };

  const handleSetMaxKm = (km: number) => {
    onCriteriaChange((prev) => ({
      ...prev,
      distance: {
        ...prev.distance,
        maxKm: km,
        enabled: true,
      },
    }));
  };

  const handleResetFilters = () => {
    setGazetteerQuery('');
    setCustomName(defaultCalName);
    onCriteriaChange(() => ({
      disciplines: { ROUTE: true, GRAVEL: true, MARCHE: true, VTT: true },
      provinces: [...PROVINCES_ORDER],
      allProvinces: true,
      periodEnabled: false,
      startDate: seasonBounds.todayStr,
      endDate: seasonBounds.seasonEndStr,
      distance: {
        enabled: false,
        postalCode: '',
        maxKm: 50,
      },
      searchQuery: '',
    }));
  };

  // Download Action
  const handleDownloadIcs = () => {
    const finalName = customName.trim() || defaultCalName;
    const periodDesc = criteria.periodEnabled
      ? ` du ${criteria.startDate} au ${criteria.endDate}`
      : ' - Toutes les dates';
    const distDesc = criteria.distance.enabled && criteria.distance.postalCode
      ? ` - Rayon max ${criteria.distance.maxKm} km autour de ${criteria.distance.postalCode}`
      : '';
    const icsContent = generateICalendar(matchingEvents, {
      calendarName: finalName,
      description: `Calendrier FFBC (${matchingEvents.length} événements sélectionnés${periodDesc}${distDesc})`,
    });
    const filename = `${finalName.replace(/\s+/g, '_')}.ics`;
    downloadIcsFile(filename, icsContent);
  };

  return (
    <div className="space-y-6">
      {/* Hero explanation - Exact requested text */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Générateur de Calendrier sur mesure</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Créez votre propre calendrier FFBC
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Sélectionnez vos disciplines (Route, Gravel, Marche, VTT), la période, vos provinces ou le rayon kilométrique autour d'un code postal belge pour télécharger votre fichier .ics et mettre à jour votre calendrier
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="self-start md:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Criteria Form (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Type d'événement (Disciplines) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Type d'événement (Disciplines)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Cochez les types d'épreuves à intégrer dans votre calendrier
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAllDisciplines(true)}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Tout cocher
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllDisciplines(false)}
                  className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {/* Disciplines Cards with authentic cycling SVG icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Route */}
              <label
                className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  criteria.disciplines.ROUTE
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={criteria.disciplines.ROUTE}
                    onChange={() => handleToggleDiscipline('ROUTE')}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                      <DisciplineIcon discipline="ROUTE" size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Route</div>
                      <p className="text-[11px] text-slate-500">Cyclotourisme, Brevets, Flèches</p>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                  {disciplineCounts.route}
                </span>
              </label>

              {/* Gravel */}
              <label
                className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  criteria.disciplines.GRAVEL
                    ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={criteria.disciplines.GRAVEL}
                    onChange={() => handleToggleDiscipline('GRAVEL')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <DisciplineIcon discipline="GRAVEL" size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Gravel</div>
                      <p className="text-[11px] text-slate-500">Chemins non goudronnés & mixtes</p>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                  {disciplineCounts.gravel}
                </span>
              </label>

              {/* Marche */}
              <label
                className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  criteria.disciplines.MARCHE
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={criteria.disciplines.MARCHE}
                    onChange={() => handleToggleDiscipline('MARCHE')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                      <DisciplineIcon discipline="MARCHE" size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Marche</div>
                      <p className="text-[11px] text-slate-500">Marches d'automne & pédestres</p>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {disciplineCounts.marche}
                </span>
              </label>

              {/* VTT */}
              <label
                className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  criteria.disciplines.VTT
                    ? 'border-teal-600 bg-teal-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={criteria.disciplines.VTT}
                    onChange={() => handleToggleDiscipline('VTT')}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-100 text-teal-800 shrink-0">
                      <DisciplineIcon discipline="VTT" size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">VTT</div>
                      <p className="text-[11px] text-slate-500">Tout-terrain & sentiers boisés</p>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 shrink-0">
                  {disciplineCounts.vtt}
                </span>
              </label>
            </div>
          </div>

          {/* SECTION 2: Selection par Distance (Code postal belge OU Ville avec recherche gazetteer) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Sélection par distance (Code postal ou Ville belge & Rayon)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Entrez un code postal ou une ville belge pour sélectionner les randos dans un rayon de X km
                  </p>
                </div>
              </div>

              {/* Toggle switch for distance filter */}
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={criteria.distance.enabled}
                  onChange={(e) => handleToggleDistanceFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={criteria.distance.enabled ? 'text-blue-700' : 'text-slate-500'}>
                  Activer le filtre distance
                </span>
              </label>
            </div>

            {/* Inputs: Gazetteer search input & radius */}
            <div className={`space-y-4 transition-opacity ${criteria.distance.enabled ? 'opacity-100' : 'opacity-60'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gazetteer Input (Ville ou Code postal) */}
                <div className="space-y-1.5 relative" ref={gazetteerRef}>
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Code postal ou Ville belge :</span>
                    {currentPostalCoord && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ {currentPostalCoord.name || criteria.distance.postalCode}
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={gazetteerQuery}
                      onFocus={() => setShowSuggestions(suggestions.length > 0)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGazetteerQuery(val);
                        setShowSuggestions(true);
                        // If user entered exactly 4 digits, resolve directly
                        if (/^\d{4}$/.test(val.trim())) {
                          onCriteriaChange((prev) => ({
                            ...prev,
                            distance: {
                              ...prev.distance,
                              postalCode: val.trim(),
                              enabled: true,
                            },
                          }));
                        }
                      }}
                      placeholder="Tapez un code postal ou nom de ville (ex : Mons, 7000, Namur...)"
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-semibold text-slate-900 bg-white"
                    />
                    {gazetteerQuery && (
                      <button
                        type="button"
                        onClick={handleClearDistance}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Effacer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Gazetteer Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {suggestions.map((item) => (
                        <button
                          key={`${item.zip}-${item.city}`}
                          type="button"
                          onClick={() => handleSelectGazetteerItem(item)}
                          className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-900">{item.city}</span>
                            <span className="text-slate-500 font-mono">({item.zip})</span>
                          </div>
                          <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">
                            Choisir
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    Recherche instantanée : tapez quelques lettres ou chiffres pour voir les communes belges
                  </p>
                </div>

                {/* Radius Km input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <label>Rayon de recherche :</label>
                    <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      ≤ {criteria.distance.maxKm} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={criteria.distance.maxKm}
                    onChange={(e) => handleSetMaxKm(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  {/* Quick km buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[20, 35, 50, 75, 100].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => handleSetMaxKm(km)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          criteria.distance.maxKm === km
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {km} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular Belgian Cities Shortcuts */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-500 font-semibold mr-1.5">Villes fréquentes :</span>
                <div className="inline-flex flex-wrap gap-1 mt-1">
                  {POPULAR_BELGIAN_POSTAL_CODES.slice(0, 8).map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectPopularCity(item.code, item.city)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        criteria.distance.postalCode === item.code
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.code} {item.city}
                    </button>
                  ))}
                </div>
              </div>

              {criteria.distance.enabled && criteria.distance.postalCode && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Filtre actif : randos dont le départ est situé à moins de <strong>{criteria.distance.maxKm} km</strong> de <strong>{criteria.distance.cityName || criteria.distance.postalCode}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDistanceFilter(false)}
                    className="text-[11px] text-blue-700 hover:underline font-semibold shrink-0 cursor-pointer"
                  >
                    Désactiver
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Provinces (Checkboxes) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Provinces
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Cochez la ou les provinces ou "Toutes les provinces"
                  </p>
                </div>
              </div>

              {/* Master Checkbox: Tout */}
              <button
                type="button"
                onClick={handleToggleAllProvinces}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold cursor-pointer"
              >
                {criteria.allProvinces ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Toutes les provinces</span>
              </button>
            </div>

            {/* Province Checkboxes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PROVINCES_ORDER.map((prov) => {
                const isChecked = criteria.allProvinces || criteria.provinces.includes(prov);
                const count = provinceCounts[prov] || 0;

                return (
                  <label
                    key={prov}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'border-blue-400 bg-blue-50/40 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleProvince(prov)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{prov}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 ml-1">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Période (Deux champs date) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Période (Calendrier)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Sélectionnez votre date de début et de fin
                  </p>
                </div>
              </div>

              {/* Toggle switch for period filter */}
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={criteria.periodEnabled}
                  onChange={(e) => handleTogglePeriodFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={criteria.periodEnabled ? 'text-blue-700' : 'text-slate-500'}>
                  Activer le filtre période
                </span>
              </label>
            </div>

            {/* Inputs: Presets & Dates */}
            <div className={`space-y-4 transition-opacity ${criteria.periodEnabled ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Quick preset buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium mr-1">Raccourcis :</span>
                  <button
                    type="button"
                    onClick={applyPresetSeason}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
                  >
                    Saison en cours (Aujourd'hui → 31 Oct)
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetNext3Months}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    3 prochains mois
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetFull2026}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Année 2026 complète
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Règle de saison :</span>
                  <span className="text-blue-700 font-bold">{seasonBounds.seasonLabel}</span>
                </div>
              </div>

              {/* Date Picker Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Date de début :
                  </label>
                  <input
                    type="date"
                    value={criteria.startDate}
                    onChange={(e) => handleSetStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-900 bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    {formatDateFrench(criteria.startDate)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Date de fin :
                  </label>
                  <input
                    type="date"
                    value={criteria.endDate}
                    onChange={(e) => handleSetEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-900 bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    {formatDateFrench(criteria.endDate)}
                  </p>
                </div>
              </div>

              {criteria.periodEnabled ? (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Filtre actif : randos du <strong>{formatDateFrench(criteria.startDate)}</strong> au <strong>{formatDateFrench(criteria.endDate)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePeriodFilter(false)}
                    className="text-[11px] text-blue-700 hover:underline font-semibold shrink-0 cursor-pointer"
                  >
                    Désactiver
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Filtre période inactif : toutes les dates sont incluses sans restriction.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePeriodFilter(true)}
                    className="text-[11px] text-blue-700 hover:underline font-semibold shrink-0 cursor-pointer"
                  >
                    Activer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Action & Export Card (1 span) - Cleaned per user request */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 space-y-5 sticky top-20">
            {/* Counter */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-blue-300 font-bold">
                Événements correspondants
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
                <span>{matchingEvents.length}</span>
                <span className="text-sm font-medium text-slate-300">randonnées</span>
              </div>
              <p className="text-xs text-slate-300">
                sur un total de {allEvents.length} randos FFBC
                {criteria.periodEnabled && (
                  <span className="block text-blue-200 mt-0.5">
                    • Période : {formatDateFrench(criteria.startDate)} → {formatDateFrench(criteria.endDate)}
                  </span>
                )}
                {criteria.distance.enabled && criteria.distance.postalCode && (
                  <span className="block text-blue-200 mt-0.5">
                    • Rayon : ≤ {criteria.distance.maxKm} km de {criteria.distance.cityName || criteria.distance.postalCode}
                  </span>
                )}
              </p>
            </div>

            {/* Custom name input (default: Mon_calendrier_FFBC_YYYY) */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="block text-xs font-medium text-blue-200">
                Nom de votre calendrier :
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={defaultCalName}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Primary Action Button: Download .ics */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDownloadIcs}
                disabled={matchingEvents.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
              >
                <Download className="w-5 h-5 text-white" />
                <span>Télécharger le fichier .ics</span>
              </button>
            </div>

            {/* Button to view/hide list */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowEventsList(!showEventsList)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{showEventsList ? 'Masquer la liste des randonnées' : `Consulter les ${matchingEvents.length} randos sélectionnées`}</span>
                {showEventsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Liste intégrée des événements correspondants avec recherche et tri */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Randonnées sélectionnées ({matchingEvents.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowEventsList(!showEventsList)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{showEventsList ? 'Masquer la liste' : 'Afficher la liste'}</span>
              {showEventsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showEventsList && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Filtrer par ville, club, nom..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600"
                />
              </div>

              {/* Sort button */}
              {criteria.distance.enabled && criteria.distance.postalCode && (
                <button
                  type="button"
                  onClick={() => setSortMode(sortMode === 'date' ? 'distance' : 'date')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 cursor-pointer shrink-0"
                  title="Basculer le tri par date ou par distance"
                >
                  <ArrowUpDown className="w-3 h-3 text-blue-600" />
                  <span>{sortMode === 'date' ? 'Trier par Distance' : 'Trier par Date'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {showEventsList && (
          <div>
            {displayEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                <p className="font-semibold text-slate-700">Aucune randonnée ne correspond à ces critères</p>
                <p>Élargissez votre rayon kilométrique ou vos dates pour trouver des événements.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayEvents.slice(0, 60).map((rando) => {
                  const disc = getDisciplineMatches(rando);
                  const distances = (rando.parcours || [])
                    .map((p) => (p.distance_km ? `${p.distance_km} km` : null))
                    .filter(Boolean);

                  return (
                    <div
                      key={rando.id}
                      onClick={() => onSelectEvent(rando)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all bg-white cursor-pointer flex flex-col justify-between gap-2.5 group"
                    >
                      <div>
                        {/* Date & Province / Distance Badge */}
                        <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateFrench(rando.date)}</span>
                          </span>

                          {rando.computedDistanceKm !== undefined && (
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                              <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{rando.computedDistanceKm} km</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 transition-colors line-clamp-1">
                          {rando.nom}
                        </h4>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {rando.code_postal} {rando.localite} ({rando.province})
                          </span>
                        </div>
                      </div>

                      {/* Bottom line: Discipline badge + Distances */}
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {disc.isRoute && (
                            <span className="font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                              <DisciplineIcon discipline="ROUTE" size={12} />
                              <span>Route</span>
                            </span>
                          )}
                          {disc.isGravel && (
                            <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                              <DisciplineIcon discipline="GRAVEL" size={12} />
                              <span>Gravel</span>
                            </span>
                          )}
                          {disc.isMarche && (
                            <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <DisciplineIcon discipline="MARCHE" size={12} />
                              <span>Marche</span>
                            </span>
                          )}
                          {disc.isVtt && (
                            <span className="font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 inline-flex items-center gap-1">
                              <DisciplineIcon discipline="VTT" size={12} />
                              <span>VTT</span>
                            </span>
                          )}
                        </div>

                        {distances.length > 0 && (
                          <span className="font-semibold text-slate-500 truncate max-w-[120px]">
                            {distances.join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {displayEvents.length > 60 && (
              <p className="text-center text-xs text-slate-400 pt-3">
                Affichage des 60 premières randonnées sur {displayEvents.length} sélectionnées. Toutes les {displayEvents.length} randos seront incluses dans votre fichier .ics !
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
