/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * ============================================================================
 * PARAMÈTRES DE LA BANDE VERTICALE TRICOLORE (BORD DROIT DE L'ÉCRAN)
 * ============================================================================
 * Vous pouvez modifier ici :
 * 1. "color" : le code couleur (ex: code hexadécimal #38bdf8, #16a34a, #ffffff)
 * 2. "widthPx" : la largeur de chaque bande en pixels (ex: 6, 8, 10...)
 * ============================================================================
 */
export const CLUB_STRIPES_CONFIG = [
  {
    name: 'Bleu ciel',
    color: '#009ee2', // <-- MODIFIEZ ICI LA COULEUR BLEU CIEL
    widthPx: 8,       // <-- MODIFIEZ ICI LA LARGEUR (en pixels)
  },
    {
    name: 'Blanc',
    color: '#ffffff', // <-- MODIFIEZ ICI LA COULEUR BLANC
    widthPx: 4,       // <-- MODIFIEZ ICI LA LARGEUR (en pixels)
  },
  {
    name: 'Vert',
    color: '#5daf32', // <-- MODIFIEZ ICI LA COULEUR VERT
    widthPx: 4,       // <-- MODIFIEZ ICI LA LARGEUR (en pixels)
  },

];

interface ClubTricolorStripeProps {
  className?: string;
}

export const ClubTricolorStripe: React.FC<ClubTricolorStripeProps> = ({
  className = 'h-9 sm:h-12',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-row shrink-0 rounded-xs overflow-hidden border border-slate-300/80 shadow-2xs select-none ${className}`}
      title="Couleurs du club"
    >
      {CLUB_STRIPES_CONFIG.map((stripe, index) => (
        <div
          key={index}
          style={{
            backgroundColor: stripe.color,
            width: `${stripe.widthPx}px`,
          }}
          className="h-full shrink-0"
        />
      ))}
    </div>
  );
};
