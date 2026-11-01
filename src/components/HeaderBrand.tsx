/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RefreshCw, HelpCircle, Calendar, Sparkles } from 'lucide-react';

interface HeaderBrandProps {
  onRefresh: () => void;
  isLoading: boolean;
  onOpenHelp: () => void;
  itemsCount: number;
  totalEventsCount: number;
  activeTab: 'generator' | 'subscriptions';
  onTabChange: (tab: 'generator' | 'subscriptions') => void;
}

export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  onRefresh,
  isLoading,
  onOpenHelp,
  itemsCount,
  totalEventsCount,
  activeTab,
  onTabChange,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Exact requested box from https://github.com/FabriziodelaRusta/Calendrier_FFBC_OSM */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 bg-slate-50/80 sm:bg-transparent p-1.5 sm:p-0 rounded-xl border sm:border-0 border-slate-200/70">
          {/* Club RPA Logo */}
          <div className="w-9 h-11 sm:w-12 sm:h-14 shrink-0 flex items-center justify-center relative">
            {logoLoaded ? (
              <img
                src="https://fabriziodelarusta.github.io/icons/logo-RPA_bleu.png"
                alt="Logo Club RPA"
                referrerPolicy="no-referrer"
                onError={() => setLogoLoaded(false)}
                className="max-h-full max-w-full object-contain filter drop-shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                RPA
              </div>
            )}
          </div>

          {/* Title: Calendrier FFBC / Subtitle: Abonnement */}
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Calendrier FFBC
              </h1>
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                v0.14
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-blue-600 leading-tight">
              Abonnez-vous
            </p>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">{itemsCount}</span>
              <span>sél.</span>
              <span>·</span>
              <span className="text-slate-600 font-medium">{totalEventsCount} randos FFBC</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Mobile & Desktop) - Randonnées tab removed per user request */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl order-3 md:order-2 w-full md:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => onTabChange('generator')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'generator'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Mon Calendrier (.ics)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('subscriptions')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Abonnements prêts</span>
          </button>
        </div>

        {/* Actions (Refresh + Help iPhone) */}
        <div className="flex items-center gap-1.5 sm:gap-2 order-2 md:order-3">
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            title="Guide d'installation iPhone et Google Calendar"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xs:inline">Aide iPhone / Calendrier</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 sm:p-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Recharger le calendrier depuis GitHub"
          >
            <RefreshCw className={`w-4 h-4 text-slate-700 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
