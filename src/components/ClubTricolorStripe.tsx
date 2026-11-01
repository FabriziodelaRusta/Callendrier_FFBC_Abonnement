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
    color: '#38bdf8', // <-- MODIFIEZ ICI LA COULEUR BLEU CIEL
    widthPx: 6,       // <-- MODIFIEZ ICI LA LARGEUR (en pixels)
  },
  {
    name: 'Vert',
    color: '#16a34a', // <-- MODIFIEZ ICI LA COULEUR VERT
    widthPx: 6,       // <-- MODIFIEZ ICI LA LARGEUR (en pixels)
  },
  {
    name: 'Blanc',
    color: '#ffffff', // <-- MODIFIEZ ICI LA COULEUR BLANC
    widthPx: 6,       // <-- MODIFIEZ ICI LA LARGEUR (en pixels)
  },
];

export const ClubTricolorStripe: React.FC = () => {
  return (
    <aside
      aria-hidden="true"
      className="fixed top-0 left-0 bottom-0 h-screen z-50 pointer-events-none flex flex-row shadow-xs select-none"
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
    </aside>
  );
};
