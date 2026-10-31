/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Calendar, MapPin, Navigation, Download, ExternalLink, Clock, DollarSign, Award, ChevronRight } from 'lucide-react';
import { FFBCRando } from '../types';
import { formatDateFrench, getDisciplineMatches } from '../utils/filterUtils';
import { generateICalendar, downloadIcsFile } from '../utils/icsGenerator';

import { DisciplineIcon } from './DisciplineIcon';

interface EventDetailModalProps {
  rando: FFBCRando | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ rando, onClose }) => {
  if (!rando) return null;

  const disc = getDisciplineMatches(rando);

  const handleDownloadSingle = () => {
    const ics = generateICalendar([rando], {
      calendarName: rando.nom,
      description: `${rando.nom} (${rando.club || 'FFBC'})`,
    });
    const filename = `FFBC_${rando.date}_${rando.nom.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.ics`;
    downloadIcsFile(filename, ics);
  };

  const mapUrl = rando.lien_itineraire || (rando.adresse ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rando.adresse)}` : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {rando.province || 'Belgique'}
              </span>
              {disc.isRoute && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-100 inline-flex items-center gap-1">
                  <DisciplineIcon discipline="ROUTE" size={13} />
                  <span>Route</span>
                </span>
              )}
              {disc.isGravel && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 inline-flex items-center gap-1">
                  <DisciplineIcon discipline="GRAVEL" size={13} />
                  <span>Gravel</span>
                </span>
              )}
              {disc.isMarche && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 inline-flex items-center gap-1">
                  <DisciplineIcon discipline="MARCHE" size={13} />
                  <span>Marche</span>
                </span>
              )}
              {disc.isVtt && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 inline-flex items-center gap-1">
                  <DisciplineIcon discipline="VTT" size={13} />
                  <span>VTT</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black leading-snug">
              {rando.nom}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-blue-200 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateFrench(rando.date)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto text-slate-700 text-sm">
          {/* Club & Lieu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Club Organisateur</div>
              <div className="font-bold text-slate-900 mt-0.5">{rando.club || 'Club affilié FFBC'}</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Localité & Province</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {rando.code_postal} {rando.localite} ({rando.province})
              </div>
            </div>

            {rando.lieu_depart && (
              <div className="sm:col-span-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Lieu de départ</div>
                <div className="text-slate-800 font-medium mt-0.5">{rando.lieu_depart}</div>
              </div>
            )}

            {rando.adresse && (
              <div className="sm:col-span-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Adresse exacte</div>
                <div className="text-slate-800 font-medium mt-0.5">{rando.adresse}</div>
              </div>
            )}
          </div>

          {/* Parcours breakdown */}
          {rando.parcours && rando.parcours.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Distances & Parcours proposés ({rando.parcours.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rando.parcours.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {p.type || 'Circuit'}
                      </span>
                      {p.distance_km && (
                        <span className="text-sm font-black text-slate-900">
                          {p.distance_km} km
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      {p.denivele && (
                        <div>
                          <strong>Dénivelé :</strong> {p.denivele}
                        </div>
                      )}
                      {p.horaires && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span><strong>Départ :</strong> {p.horaires}</span>
                        </div>
                      )}
                      {p.ravitaillement && (
                        <div>
                          <strong>Ravitaillement :</strong> {p.ravitaillement}
                        </div>
                      )}
                      {p.tarif && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-slate-400" />
                          <span><strong>Tarif :</strong> {p.tarif}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarque */}
          {rando.remarque && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold text-amber-900">ℹ️ Informations & Remarques :</div>
              <p className="text-xs text-amber-800 leading-relaxed">{rando.remarque}</p>
            </div>
          )}

          {/* External links */}
          {rando.liens_externes && rando.liens_externes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Liens utiles :</div>
              <div className="flex flex-wrap gap-2">
                {rando.liens_externes.map((lnk, idx) => (
                  <a
                    key={idx}
                    href={lnk.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-blue-700 transition-colors"
                  >
                    <span>{lnk.libelle || 'Lien'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Itinéraire Google Maps</span>
            </a>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleDownloadSingle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ajouter cette rando à mon calendrier (.ics)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
