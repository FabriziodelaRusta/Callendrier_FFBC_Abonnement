/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Smartphone, Download, Calendar, ExternalLink, Check, Copy } from 'lucide-react';

interface IphoneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleUrl?: string;
}

export const IphoneGuideModal: React.FC<IphoneGuideModalProps> = ({
  isOpen,
  onClose,
  sampleUrl,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://calendrier-ffbc.app';
  const feedUrl = sampleUrl || `${currentOrigin}/api/calendar/saison.ics`;
  const webcalUrl = feedUrl.replace(/^https?:\/\//i, 'webcal://');

  const handleCopy = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Guide d'installation iPhone & Calendrier</h2>
              <p className="text-xs text-blue-200">Compatibilité universelle : iPhone, iPad, Mac, Android, Google Calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Method 1: Webcal Subscription (Live sync) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm sm:text-base">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
              <span>Méthode recommandée : S'abonner avec synchronisation en direct (Webcal)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              En vous abonnant via <strong>Webcal</strong>, votre iPhone ou Google Agenda synchronise automatiquement les dates, heures et parcours mis à jour.
            </p>
            <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between gap-2 text-xs">
              <code className="text-blue-800 truncate font-mono select-all">{feedUrl}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
            <div className="pt-1">
              <a
                href={webcalUrl}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Ouvrir l'abonnement sur cet appareil (iPhone / Mac)</span>
              </a>
            </div>
          </div>

          {/* Steps for iPhone */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Comment s'abonner manuellement sur iPhone (iOS) :</span>
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-600 ml-1">
              <li>Ouvrez l'application <strong>Réglages</strong> sur votre iPhone.</li>
              <li>Touchez <strong>Calendrier</strong> puis <strong>Comptes</strong>.</li>
              <li>Touchez <strong>Ajouter un compte</strong> &gt; <strong>Autre</strong>.</li>
              <li>Choisissez <strong>Ajouter un calendrier avec abonnement</strong>.</li>
              <li>Collez l'URL copiée ci-dessus puis touchez <strong>Suivant</strong> et <strong>Enregistrer</strong>.</li>
            </ol>
          </div>

          {/* Method 2: Download .ics */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm sm:text-base">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Méthode alternative : Télécharger le fichier .ics</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Lorsque vous cliquez sur <strong>Télécharger .ics</strong> sur votre iPhone (Safari) :
            </p>
            <ol className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 ml-1">
              <li>Safari télécharge le fichier <code>calendrier_ffbc.ics</code>.</li>
              <li>Touchez l'icône de téléchargement dans la barre Safari ou ouvrez le fichier téléchargé.</li>
              <li>L'application Calendrier d'Apple s'ouvre avec l'option <strong>« Ajouter tout »</strong>.</li>
              <li>Les événements sont immédiatement intégrés dans votre calendrier habituel !</li>
            </ol>
          </div>

          {/* Google Calendar */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm sm:text-base">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Pour Google Calendar (Ordinateur ou Smartphone) :</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Rendez-vous sur <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">calendar.google.com</a>. Dans le panneau de gauche, à côté de <strong>Autres agendas</strong>, cliquez sur <strong>+</strong> puis sur <strong>À partir de l'URL</strong>, et collez le lien du flux.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
