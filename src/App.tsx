/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FFBCRando, FilterCriteria } from './types';
import { HeaderBrand } from './components/HeaderBrand';
import { CustomCalendarGenerator } from './components/CustomCalendarGenerator';
import { SubscriptionFeeds } from './components/SubscriptionFeeds';
import { EventDetailModal } from './components/EventDetailModal';
import { IphoneGuideModal } from './components/IphoneGuideModal';
import { PROVINCES_ORDER, getSeasonBounds } from './utils/filterUtils';
import fallbackDataset from './data/calendrier_ffbc.json';

export default function App() {
  const seasonBounds = useMemo(() => getSeasonBounds(), []);

  const [allEvents, setAllEvents] = useState<FFBCRando[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'subscriptions'>('generator');
  const [selectedRando, setSelectedRando] = useState<FFBCRando | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [extractionDate, setExtractionDate] = useState<string>('2026-10-24');

  // Filter criteria state with distance filter
  const [criteria, setCriteria] = useState<FilterCriteria>({
    disciplines: {
      ROUTE: true,
      GRAVEL: true,
      MARCHE: true,
      VTT: true,
    },
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
  });

  // Load dataset
  const loadDataset = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (data.randonnées && data.randonnées.length > 0) {
          setAllEvents(data.randonnées);
          if (data.date_extraction) setExtractionDate(data.date_extraction);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    // Direct bundled fallback
    const items: FFBCRando[] = (fallbackDataset as any).randonnées || [];
    setAllEvents(items);
    if ((fallbackDataset as any).date_extraction) {
      setExtractionDate((fallbackDataset as any).date_extraction);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDataset().finally(() => setIsLoading(false));
  }, [loadDataset]);

  // Refresh handler (pulls fresh data from remote GitHub)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (res.ok) {
        await loadDataset();
      } else {
        // Direct fetch from GitHub raw if API fails
        const ghRes = await fetch('https://raw.githubusercontent.com/FabriziodelaRusta/Input_files/main/calendrier_ffbc.json');
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          setAllEvents(ghData.randonnées || []);
          if (ghData.date_extraction) setExtractionDate(ghData.date_extraction);
        }
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered count for header badge
  const filteredCount = useMemo(() => {
    return allEvents.filter((ev) => {
      if (criteria.periodEnabled) {
        if (criteria.startDate && ev.date < criteria.startDate) return false;
        if (criteria.endDate && ev.date > criteria.endDate) return false;
      }
      return true;
    }).length;
  }, [allEvents, criteria.periodEnabled, criteria.startDate, criteria.endDate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 1. Header with exact requested brand box - Randonnées tab removed */}
      <HeaderBrand
        onRefresh={handleRefresh}
        isLoading={isRefreshing || isLoading}
        onOpenHelp={() => setIsHelpOpen(true)}
        itemsCount={filteredCount}
        totalEventsCount={allEvents.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {isLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Chargement du calendrier officiel FFBC...</p>
          </div>
        ) : (
          <>
            {activeTab === 'generator' && (
              <CustomCalendarGenerator
                allEvents={allEvents}
                criteria={criteria}
                onCriteriaChange={setCriteria}
                onSelectEvent={setSelectedRando}
              />
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionFeeds
                allEvents={allEvents}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Footer (Exact version requested: v0.14 — Fabrizio de la Rusta) */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 space-y-1 select-none">
        <div id="footer" className="font-medium text-slate-700">
          v<sub id="version" className="font-bold text-blue-600">0.14</sub> — Fabrizio de la Rusta
        </div>
        <div className="text-[11px] text-slate-400">
          données en consultation libre provenant de Fédération Francophone Belge du Cyclotourisme (FFBC / Vélo Liberté) · Extraction : {extractionDate}
        </div>
      </footer>

      {/* Modals */}
      <EventDetailModal
        rando={selectedRando}
        onClose={() => setSelectedRando(null)}
      />

      <IphoneGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
