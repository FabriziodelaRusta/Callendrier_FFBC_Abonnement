/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, Copy, Check, ExternalLink, RefreshCw, FolderGit2, AlertCircle } from 'lucide-react';
import { FFBCRando, InputGitHubFile } from '../types';
import { DisciplineIcon } from './DisciplineIcon';

interface SubscriptionFeedsProps {
  allEvents: FFBCRando[];
}

export const SubscriptionFeeds: React.FC<SubscriptionFeedsProps> = () => {
  const [gitHubFiles, setGitHubFiles] = useState<InputGitHubFile[]>([]);
  const [isLoadingGh, setIsLoadingGh] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Dépôt source : FabriziodelaRusta/Input_files</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Abonnements prêts à l'emploi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Les calendriers listés ci-dessous correspondent aux fichiers disponibles.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchInputFiles}
            disabled={isLoadingGh}
            className="self-start md:self-center shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Rafraîchir la liste des fichiers depuis le dépôt source"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGh ? 'animate-spin text-blue-600' : ''}`} />
            <span>Vérifier source</span>
          </button>
        </div>
      </div>

      {/* SECTION: Fichiers présents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Fichiers présents
            </h3>
          </div>
          {gitHubFiles.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {gitHubFiles.length} fichier{gitHubFiles.length > 1 ? 's' : ''} disponible{gitHubFiles.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoadingGh ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
            <span>Inspection du dépôt source en cours...</span>
          </div>
        ) : gitHubFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gitHubFiles.map((file) => {
              const rawDownloadUrl = file.download_url;
              const webcalUrl = rawDownloadUrl.replace(/^https?:\/\//i, 'webcal://');

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
                          <h4 className="font-mono font-bold text-slate-900 text-xs sm:text-sm break-all">
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

                  {/* Actions: Un seul bouton S'abonner (sans mention iphone, sans google) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    {/* Un seul bouton S'abonner */}
                    <a
                      href={webcalUrl}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      title="S'abonner"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>S'abonner</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Direct Download .ics */}
                      <a
                        href={file.download_url}
                        download={file.name}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger .ics</span>
                      </a>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(file.download_url, file.name)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        {copiedId === file.name ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier le lien</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 text-slate-700 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Dépôt source surveillé</span>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed">
              Aucun fichier portant le mot route, gravel, tout ou un nom de province n'est actuellement disponible.
            </p>
            <p className="text-slate-500 text-xs">
              Dès que vous déposez des fichiers <code>.ics</code> dans le répertoire de{' '}
              <a
                href="https://github.com/FabriziodelaRusta/Input_files"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold text-blue-700"
              >
                FabriziodelaRusta/Input_files
              </a>{' '}
              (ex. <code>calendrier_route.ics</code>, <code>calendrier_gravel.ics</code>, <code>calendrier_tout.ics</code> ou <code>calendrier_hainaut.ics</code>), ils apparaîtront automatiquement ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
