/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Smartphone, Download, Calendar, ExternalLink, Check, Copy, Globe, AlertTriangle } from 'lucide-react';

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
          {/* Method 1: Webcal Subscription (iPhone / Apple) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm sm:text-base">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
              <span>S'abonner sur iPhone / iPad / Mac (Synchronisation directe)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              En touchant le bouton <strong>« S'abonner »</strong> sur votre iPhone, iOS ouvre directement l'application Calendrier et propose d'ajouter le flux. Vos rendez-vous et randonnées resteront automatiquement à jour.
            </p>
            <div className="bg-white p-3 rounded-lg border border-blue-100 flex items-center justify-between gap-2 text-xs">
              <code className="text-blue-800 truncate font-mono select-all">{feedUrl}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium cursor-pointer"
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
                <span>Ouvrir l'abonnement sur cet appareil</span>
              </a>
            </div>

            {/* Manual steps on iPhone */}
            <div className="pt-2 border-t border-blue-200/60">
              <h4 className="font-semibold text-slate-900 text-xs mb-1">
                Ajout manuel dans les Réglages iPhone :
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 ml-1">
                <li>Ouvrez <strong>Réglages</strong> &gt; <strong>Calendrier</strong> &gt; <strong>Comptes</strong>.</li>
                <li>Touchez <strong>Ajouter un compte</strong> &gt; <strong>Autre</strong>.</li>
                <li>Choisissez <strong>Ajouter un calendrier avec abonnement</strong>.</li>
                <li>Collez l'URL copiée et validez avec <strong>Enregistrer</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Google Calendar Section - Moved directly below iPhone per user request */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm sm:text-base">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Pour Google Calendar (Attention : obligatoire via la page web)</span>
            </div>

            <div className="flex items-start gap-2 bg-amber-100/70 p-3 rounded-lg border border-amber-300 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>Important :</strong> L'application mobile Google Agenda sur smartphone ne permet pas d'ajouter un abonnement par URL. L'abonnement <strong>doit obligatoirement être configuré depuis un navigateur web</strong> sur ordinateur (ou le navigateur de votre smartphone). Une fois ajouté sur le web, il apparaît et se synchronise automatiquement sur votre application mobile !
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">Procédure simple sur Google Calendar :</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 ml-1">
                <li>
                  Ouvrez la page web de Google Agenda :{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5"
                  >
                    <span>calendar.google.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>.
                </li>
                <li>Dans la colonne de gauche, à côté de <strong>Autres agendas</strong>, cliquez sur le signe <strong>+</strong>.</li>
                <li>Sélectionnez <strong>À partir de l'URL</strong>.</li>
                <li>Collez l'URL d'abonnement et cliquez sur <strong>Ajouter un agenda</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Method 3: Download .ics */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
              <Download className="w-4 h-4 text-slate-600" />
              <span>Alternative : Télécharger le fichier .ics</span>
            </div>
            <p className="text-xs text-slate-600">
              Vous pouvez aussi télécharger le fichier <code>.ics</code> directement pour importer les événements en une fois dans votre logiciel de calendrier (Apple Calendar, Outlook, Thunderbird...).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
