/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Calendar, MapPin, ChevronRight, Download, Filter, ArrowUpDown } from 'lucide-react';
import { FFBCRando } from '../types';
import { formatDateFrench, getDisciplineMatches } from '../utils/filterUtils';
import { generateICalendar, downloadIcsFile } from '../utils/icsGenerator';

interface EventsPreviewListProps {
  events: FFBCRando[];
  onSelectEvent: (rando: FFBCRando) => void;
  onBackToGenerator?: () => void;
}

export const EventsPreviewList: React.FC<EventsPreviewListProps> = ({
  events,
  onSelectEvent,
  onBackToGenerator,
}) => {
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const text = `${e.nom} ${e.localite || ''} ${e.code_postal || ''} ${e.club || ''} ${e.province || ''} ${e.lieu_depart || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortAsc ? cmp : -cmp;
    });
  }, [events, search, sortAsc]);

  const handleDownloadSingle = (e: React.MouseEvent, rando: FFBCRando) => {
    e.stopPropagation();
    const ics = generateICalendar([rando], {
      calendarName: rando.nom,
      description: `${rando.nom} (${rando.club || 'FFBC'})`,
    });
    const filename = `FFBC_${rando.date}_${rando.nom.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.ics`;
    downloadIcsFile(filename, ics);
  };

  return (
    <div className="space-y-4">
      {/* Search and control bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ville, club, nom..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Info & Sort */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
          <span className="font-bold text-slate-700">
            {filteredEvents.length} rando{filteredEvents.length > 1 ? 's' : ''} trouvée{filteredEvents.length > 1 ? 's' : ''}
          </span>

          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span>{sortAsc ? 'Plus proche d\'abord' : 'Plus lointain d\'abord'}</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Aucune randonnée ne correspond à ces critères</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Essayez d'élargir la période de dates, d'ajouter plus de provinces ou de cocher d'autres disciplines dans l'onglet "Mon Calendrier".
          </p>
          {onBackToGenerator && (
            <button
              onClick={onBackToGenerator}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
            >
              Modifier mes filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEvents.map((rando) => {
            const disc = getDisciplineMatches(rando);
            const distances = (rando.parcours || [])
              .map((p) => (p.distance_km ? `${p.distance_km} km` : null))
              .filter(Boolean);

            return (
              <div
                key={rando.id}
                onClick={() => onSelectEvent(rando)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all p-4 cursor-pointer flex flex-col justify-between gap-3 group"
              >
                <div>
                  {/* Top line: Date & Province */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>{formatDateFrench(rando.date)}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {rando.province || 'Belgique'}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors line-clamp-1">
                    {rando.nom}
                  </h4>

                  {/* Club */}
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {rando.club || 'Club affilié FFBC'}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {rando.code_postal} {rando.localite}
                      {rando.lieu_depart ? ` (${rando.lieu_depart})` : ''}
                    </span>
                  </div>
                </div>

                {/* Bottom line: Badges + Distances + Quick Download */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {disc.isRoute && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        Route
                      </span>
                    )}
                    {disc.isGravel && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Gravel
                      </span>
                    )}
                    {disc.isMarche && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Marche
                      </span>
                    )}
                    {disc.isVtt && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                        VTT
                      </span>
                    )}
                    {distances.length > 0 && (
                      <span className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
                        {distances.join(' • ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadSingle(e, rando)}
                      title="Télécharger cette rando seule (.ics)"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
