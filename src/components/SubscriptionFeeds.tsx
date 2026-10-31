/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, Smartphone, Copy, Check, ExternalLink, RefreshCw, FolderGit2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { FFBCRando, InputGitHubFile } from '../types';
import { matchDiscipline, normalizeProvince, getSeasonBounds, PROVINCES_ORDER } from '../utils/filterUtils';
import { generateICalendar, downloadIcsFile } from '../utils/icsGenerator';
import { DisciplineIcon } from './DisciplineIcon';

interface SubscriptionFeedsProps {
  allEvents: FFBCRando[];
}

export const SubscriptionFeeds: React.FC<SubscriptionFeedsProps> = ({ allEvents }) => {
  const [gitHubFiles, setGitHubFiles] = useState<InputGitHubFile[]>([]);
  const [isLoadingGh, setIsLoadingGh] = useState(true);
  const [totalFilesInRepo, setTotalFilesInRepo] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const season = getSeasonBounds();

  // Fetch files from GitHub repo https://github.com/FabriziodelaRusta/Input_files
  const fetchInputFiles = useCallback(async () => {
    setIsLoadingGh(true);
    try {
      // 1. Try local backend endpoint
      const res = await fetch('/api/input-files');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setGitHubFiles(data.files);
          setTotalFilesInRepo(data.totalInRepo || data.files.length);
          setIsLoadingGh(false);
          return;
        }
      }

      // 2. Client fallback direct GitHub API call
      const ghRes = await fetch('https://api.github.com/repos/FabriziodelaRusta/Input_files/contents', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (ghRes.ok) {
        const files: any[] = await ghRes.json();
        setTotalFilesInRepo(files.length);
        const provinces = ['hainaut', 'namur', 'liege', 'liège', 'luxembourg', 'brabant'];
        const matches: InputGitHubFile[] = [];

        for (const f of files) {
          if (f.type !== 'file') continue;
          const nameLower = f.name.toLowerCase();

          let matchedCategory: InputGitHubFile['matchedCategory'] | null = null;
          let matchedLabel = '';
          let matchedProvince: string | undefined;

          if (nameLower.includes('route')) {
            matchedCategory = 'route';
            matchedLabel = 'Route & Cyclotourisme';
          } else if (nameLower.includes('gravel')) {
            matchedCategory = 'gravel';
            matchedLabel = 'Gravel';
          } else if (nameLower.includes('tout') || nameLower.includes('all')) {
            matchedCategory = 'tout';
            matchedLabel = 'Calendrier Complet (Tout)';
          } else {
            for (const p of provinces) {
              if (nameLower.includes(p)) {
                matchedCategory = 'province';
                matchedProvince = p.charAt(0).toUpperCase() + p.slice(1);
                matchedLabel = `Province : ${matchedProvince}`;
                break;
              }
            }
          }

          if (matchedCategory) {
            matches.push({
              name: f.name,
              path: f.path,
              size: f.size,
              download_url: f.download_url,
              html_url: f.html_url,
              type: f.type,
              matchedCategory,
              matchedLabel,
              province: matchedProvince,
            });
          }
        }
        setGitHubFiles(matches);
      }
    } catch (err) {
      console.warn('Could not fetch GitHub files:', err);
    } finally {
      setIsLoadingGh(false);
    }
  }, []);

  useEffect(() => {
    fetchInputFiles();
  }, [fetchInputFiles]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper to format file size in KB/MB
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Standard live generated feeds matching the user's categories:
  // "si le nom contient route ou gravel ou tout ou le nom d'une province"
  const standardFeeds = [
    {
      id: 'tout',
      title: 'Calendrier Complet (Tout)',
      subtitle: 'Toutes les randos & disciplines FFBC',
      category: 'tout' as const,
      preset: '/api/calendar/all.ics',
      count: allEvents.length,
      discIcon: null,
    },
    {
      id: 'route',
      title: 'Route & Cyclotourisme',
      subtitle: 'Sorties sur route et brevets',
      category: 'route' as const,
      preset: '/api/calendar/route.ics',
      count: allEvents.filter((e) => matchDiscipline(e, 'ROUTE')).length,
      discIcon: 'ROUTE' as const,
    },
    {
      id: 'gravel',
      title: 'Gravel FFBC',
      subtitle: 'Parcours mixtes et chemins gravel',
      category: 'gravel' as const,
      preset: '/api/calendar/gravel.ics',
      count: allEvents.filter((e) => matchDiscipline(e, 'GRAVEL')).length,
      discIcon: 'GRAVEL' as const,
    },
    {
      id: 'hainaut',
      title: 'Province : Hainaut',
      subtitle: 'Mons, Tournai, Charleroi, Thuin...',
      category: 'province' as const,
      preset: '/api/calendar/hainaut.ics',
      count: allEvents.filter((e) => normalizeProvince(e.province) === 'Hainaut').length,
      discIcon: null,
    },
    {
      id: 'namur',
      title: 'Province : Namur',
      subtitle: 'Meuse, Condroz, Sambre...',
      category: 'province' as const,
      preset: '/api/calendar/namur.ics',
      count: allEvents.filter((e) => normalizeProvince(e.province) === 'Namur').length,
      discIcon: null,
    },
    {
      id: 'liege',
      title: 'Province : Liège',
      subtitle: 'Pays de Herve, Fagnes, Ourthe...',
      category: 'province' as const,
      preset: '/api/calendar/liege.ics',
      count: allEvents.filter((e) => normalizeProvince(e.province) === 'Liège').length,
      discIcon: null,
    },
    {
      id: 'luxembourg',
      title: 'Province : Luxembourg',
      subtitle: 'Ardenne, Gaume, Semois...',
      category: 'province' as const,
      preset: '/api/calendar/luxembourg.ics',
      count: allEvents.filter((e) => normalizeProvince(e.province) === 'Luxembourg').length,
      discIcon: null,
    },
    {
      id: 'brabant-wallon',
      title: 'Province : Brabant Wallon',
      subtitle: 'Wavre, Nivelles, Waterloo...',
      category: 'province' as const,
      preset: '/api/calendar/brabant-wallon.ics',
      count: allEvents.filter((e) => normalizeProvince(e.province) === 'Brabant Wallon').length,
      discIcon: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Dépôt GitHub source : FabriziodelaRusta/Input_files</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Abonnements prêts à l'emploi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Les calendriers listés ci-dessous correspondent aux fichiers présents dans le dépôt{' '}
              <a
                href="https://github.com/FabriziodelaRusta/Input_files"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline font-medium hover:text-blue-800 inline-flex items-center gap-0.5"
              >
                <span>github.com/FabriziodelaRusta/Input_files</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              dont le nom contient <strong>route</strong>, <strong>gravel</strong>, <strong>tout</strong> ou le <strong>nom d'une province</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchInputFiles}
            disabled={isLoadingGh}
            className="self-start md:self-center shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Rafraîchir la liste des fichiers depuis GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGh ? 'animate-spin text-blue-600' : ''}`} />
            <span>Vérifier GitHub</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Fichiers directement détectés dans FabriziodelaRusta/Input_files */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Fichiers présents dans FabriziodelaRusta/Input_files ({gitHubFiles.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Critère : nom avec « route », « gravel », « tout » ou une province
          </span>
        </div>

        {isLoadingGh ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
            <span>Inspection du dépôt GitHub FabriziodelaRusta/Input_files en cours...</span>
          </div>
        ) : gitHubFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gitHubFiles.map((file) => {
              const rawDownloadUrl = file.download_url;
              const webcalUrl = rawDownloadUrl.replace(/^https?:\/\//i, 'webcal://');
              const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(rawDownloadUrl)}`;

              return (
                <div
                  key={file.name}
                  className="bg-white rounded-2xl border-2 border-blue-200/90 shadow-2xs hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {file.matchedCategory === 'route' && (
                          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                            <DisciplineIcon discipline="ROUTE" size={22} />
                          </div>
                        )}
                        {file.matchedCategory === 'gravel' && (
                          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                            <DisciplineIcon discipline="GRAVEL" size={22} />
                          </div>
                        )}
                        {file.matchedCategory === 'tout' && (
                          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg">
                            🌟
                          </div>
                        )}
                        {file.matchedCategory === 'province' && (
                          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 font-bold text-lg">
                            📍
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                            {file.matchedLabel}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm break-all">
                            {file.name}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {formatFileSize(file.size)}
                      </span>
                      <span>·</span>
                      <a
                        href={file.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>Voir sur GitHub</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Actions for this file */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    {/* iPhone / Apple Webcal Subscribe */}
                    <a
                      href={webcalUrl}
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                      title="S'abonner en direct sur iPhone / Apple Calendar"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>S'abonner (iPhone / Apple)</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Direct Download */}
                      <a
                        href={file.download_url}
                        download={file.name}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </a>

                      {/* Google Cal */}
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Google Cal</span>
                      </a>
                    </div>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(file.download_url, file.name)}
                      className="flex items-center justify-center gap-1.5 w-full py-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {copiedId === file.name ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Lien copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier le lien direct</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 sm:p-5 text-slate-700 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Dépôt GitHub surveillé en direct</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Aucun fichier portant le mot <strong>route</strong>, <strong>gravel</strong>, <strong>tout</strong> ou un <strong>nom de province</strong> n'est actuellement détecté dans{' '}
              <a
                href="https://github.com/FabriziodelaRusta/Input_files"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold text-blue-700"
              >
                FabriziodelaRusta/Input_files
              </a>{' '}
              ({totalFilesInRepo} fichier(s) présent(s) au total).
            </p>
            <p className="text-slate-500 text-xs">
              Dès que vous déposez des fichiers (par exemple <code>calendrier_route.ics</code>, <code>calendrier_gravel.ics</code>, <code>calendrier_tout.ics</code> ou <code>calendrier_hainaut.ics</code>), ils apparaîtront automatiquement ci-dessus.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: Flux officiels disponibles générés selon ces mêmes catégories */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Flux d'abonnement correspondants (Route, Gravel, Tout, Provinces)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Générés automatiquement à partir de <code>calendrier_ffbc.json</code>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {standardFeeds.map((feed) => {
            const feedUrl = `${origin}${feed.preset}`;
            const webcalUrl = feedUrl.replace(/^https?:\/\//i, 'webcal://');
            const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`;

            return (
              <div
                key={feed.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {feed.discIcon ? (
                        <div className={`p-1.5 rounded-lg ${feed.discIcon === 'ROUTE' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>
                          <DisciplineIcon discipline={feed.discIcon} size={18} />
                        </div>
                      ) : (
                        <span className="text-xl">
                          {feed.id === 'tout' ? '🌟' : '📍'}
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {feed.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                      {feed.count} randos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {feed.subtitle}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <a
                    href={webcalUrl}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>S'abonner (iPhone)</span>
                  </a>

                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={feed.preset}
                      download
                      className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Download className="w-3 h-3" />
                      <span>.ics</span>
                    </a>
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>Google</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(feedUrl, feed.id)}
                    className="w-full text-center text-[10px] text-slate-500 hover:text-slate-800 py-0.5 cursor-pointer"
                  >
                    {copiedId === feed.id ? '✓ Lien copié !' : 'Copier le lien d\'abonnement'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
