/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DisciplineType } from '../types';

interface DisciplineIconProps {
  discipline: DisciplineType | 'ALL';
  className?: string;
  size?: number;
}

/**
 * High-fidelity cycling discipline SVG icons:
 * - ROUTE: Road bike with drop handlebars and skinny tires
 * - GRAVEL: Gravel bike with flared drop bars, endurance frame & all-road gravel terrain
 * - VTT: Mountain bike (MTB) with straight flat handlebar, front suspension fork & knobby tires
 * - MARCHE: Hiking boots / walker silhouette
 */
export const DisciplineIcon: React.FC<DisciplineIconProps> = ({
  discipline,
  className = 'w-5 h-5',
  size = 20,
}) => {
  switch (discipline) {
    case 'ROUTE':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-label="Vélo Route"
        >
          {/* Rear wheel */}
          <circle cx="5" cy="17" r="3.5" />
          {/* Front wheel */}
          <circle cx="19" cy="17" r="3.5" />
          {/* Frame & Crank */}
          <circle cx="11.5" cy="17" r="1" />
          {/* Chainstay & Seatstay */}
          <path d="M5 17l6.5 0" />
          <path d="M5 17l4.5-9" />
          {/* Seat tube */}
          <path d="M11.5 17l-2-9" />
          {/* Saddle */}
          <path d="M8 8h3" strokeWidth="2.2" />
          {/* Down tube & Top tube */}
          <path d="M11.5 17l4-9" />
          <path d="M9.5 8h6" />
          {/* Fork */}
          <path d="M19 17l-3.5-9" />
          {/* Road Drop Handlebars (Guidon course cintré vers le bas) */}
          <path d="M14.5 8h1.8c.8 0 1.2.6 1.2 1.3 0 .8-.5 1.4-1.2 1.4h-.6" strokeWidth="2" />
        </svg>
      );

    case 'GRAVEL':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-label="Vélo Gravel"
        >
          {/* Rear gravel wheel with textured tread */}
          <circle cx="5" cy="16.5" r="3.8" strokeDasharray="3 1.5" />
          <circle cx="5" cy="16.5" r="1.5" />
          {/* Front gravel wheel with textured tread */}
          <circle cx="19" cy="16.5" r="3.8" strokeDasharray="3 1.5" />
          <circle cx="19" cy="16.5" r="1.5" />
          {/* Crank & Frame */}
          <circle cx="11.5" cy="16.5" r="1.2" fill="currentColor" fillOpacity="0.2" />
          <path d="M5 16.5l6.5 0" />
          <path d="M5 16.5l4.5-8.5" />
          <path d="M11.5 16.5l-2-8.5" />
          {/* Saddle */}
          <path d="M8 8h3.2" strokeWidth="2.2" />
          {/* Top tube & Down tube */}
          <path d="M9.5 8l6 1.2" />
          <path d="M11.5 16.5l4-7.3" />
          {/* Fork */}
          <path d="M19 16.5l-3.5-7.3" />
          {/* Flared Gravel Drop Handlebars (Guidon évasé spécifique Gravel) */}
          <path d="M14.5 8.5h1.5c.7 0 1.3.4 1.5 1 .3.8-.2 1.6-1 1.7l-1 .2" strokeWidth="2" />
          {/* Gravel pebbles/trail base dots */}
          <path d="M2 21.5h20" strokeWidth="1.2" strokeDasharray="1.5 2" opacity="0.6" />
        </svg>
      );

    case 'VTT':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-label="VTT Mountain Bike"
        >
          {/* Heavy tread knobby MTB Rear wheel */}
          <circle cx="5" cy="16" r="4" strokeWidth="2.2" strokeDasharray="2 1.5" />
          <circle cx="5" cy="16" r="1.5" />
          {/* Heavy tread knobby MTB Front wheel */}
          <circle cx="19" cy="16" r="4" strokeWidth="2.2" strokeDasharray="2 1.5" />
          <circle cx="19" cy="16" r="1.5" />
          {/* Sloping MTB frame & rear suspension linkage */}
          <circle cx="11.5" cy="16" r="1.2" fill="currentColor" fillOpacity="0.3" />
          <path d="M5 16l6.5 0" />
          <path d="M5 16l4.5-8.5" />
          <path d="M11.5 16l-2-8.5" />
          {/* MTB Saddle */}
          <path d="M8 7.5h3.5" strokeWidth="2.4" />
          {/* Aggressive sloping top tube & beefy down tube */}
          <path d="M9.5 7.5l5.5 2" />
          <path d="M11.5 16l3.5-6.5" />
          {/* Front suspension fork with stanchion markers */}
          <path d="M19 16l-4-6.5" strokeWidth="2.2" />
          {/* Flat MTB Handlebar (Cintre plat large VTT tout-terrain) */}
          <path d="M13.5 8.5h4" strokeWidth="2.5" />
          {/* Rocky terrain obstacle under front tire */}
          <path d="M16 21l2-2.5 2 2.5" strokeWidth="1.5" strokeLinejoin="miter" opacity="0.7" />
        </svg>
      );

    case 'MARCHE':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-label="Marche Randonnée"
        >
          {/* Walker head */}
          <circle cx="13.5" cy="4.5" r="2" />
          {/* Walker body & backpack */}
          <path d="M13 6.5l-2 5.5 3 2.5-1 6.5" />
          <path d="M10 8.5l-3 1.5" strokeWidth="2.5" opacity="0.6" />
          {/* Walker front leg */}
          <path d="M14 14.5l2 3.5 2.5.5" />
          {/* Walking stick / Bâton de marche */}
          <path d="M16 8l-2 13" strokeWidth="1.6" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
  }
};
