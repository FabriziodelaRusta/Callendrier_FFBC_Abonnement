/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FFBCRando } from '../types';
import { getDisciplineMatches } from './filterUtils';

/**
 * Escapes characters for iCalendar (RFC 5545)
 */
function escapeICalText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Folds lines longer than 75 octets per RFC 5545 specification
 */
function foldLine(line: string): string {
  const maxOctets = 75;
  // If line is short, return as is
  if (line.length <= maxOctets) return line;

  let result = '';
  let current = line;

  while (current.length > maxOctets) {
    result += current.substring(0, maxOctets) + '\r\n ';
    current = current.substring(maxOctets);
  }
  result += current;
  return result;
}

/**
 * Extracts start time (e.g. "08h00") from horaires string
 */
function parseStartTime(horaires: string | null | undefined): { hour: number; minute: number } | null {
  if (!horaires) return null;
  const match = horaires.match(/(\d{1,2})[h:](\d{2})/i);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return { hour: h, minute: m };
    }
  }
  return null;
}

/**
 * Formats a Date object to iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatUtcStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Returns the next day in YYYYMMDD for all-day events
 */
function getNextDay(dateStr: string): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const next = new Date(y, m, d + 1);
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, '0');
  const nd = String(next.getDate()).padStart(2, '0');
  return `${ny}${nm}${nd}`;
}

/**
 * Generates an RFC 5545 compliant .ics string for a list of FFBC randos.
 * Compatible with iPhone (Apple Calendar), Android, Google Calendar, and Outlook.
 */
export function generateICalendar(
  events: FFBCRando[],
  options: {
    calendarName?: string;
    description?: string;
  } = {}
): string {
  const calName = options.calendarName || 'Calendrier FFBC';
  const calDesc = options.description || 'Randonnées et brevets FFBC (Fédération Francophone Belge du Cyclotourisme)';
  const nowStamp = formatUtcStamp(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fabrizio de la Rusta//Calendrier FFBC//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calName)}`,
    `X-WR-CALDESC:${escapeICalText(calDesc)}`,
    'X-WR-TIMEZONE:Europe/Brussels',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Brussels',
    'X-LIC-LOCATION:Europe/Brussels',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  for (const rando of events) {
    if (!rando.date) continue;
    const cleanDate = rando.date.replace(/-/g, '');
    const disc = getDisciplineMatches(rando);

    // Build event emoji & prefix
    let emoji = '🚴';
    let prefix = 'Route';
    if (disc.isMarche && !disc.isRoute && !disc.isVtt && !disc.isGravel) {
      emoji = '🥾';
      prefix = 'Marche';
    } else if (disc.isGravel) {
      emoji = '🪨';
      prefix = 'Gravel';
    } else if (disc.isVtt) {
      emoji = '🌲';
      prefix = 'VTT';
    }

    // Determine start and end time
    let startTime: { hour: number; minute: number } | null = null;
    if (rando.parcours && rando.parcours.length > 0) {
      for (const p of rando.parcours) {
        startTime = parseStartTime(p.horaires);
        if (startTime) break;
      }
    }

    const eventLines: string[] = ['BEGIN:VEVENT'];
    eventLines.push(`UID:ffbc-${rando.id}-${cleanDate}@velo-liberte.be`);
    eventLines.push(`DTSTAMP:${nowStamp}`);

    if (startTime) {
      const sh = String(startTime.hour).padStart(2, '0');
      const sm = String(startTime.minute).padStart(2, '0');
      const eh = String(Math.min(23, startTime.hour + 4)).padStart(2, '0');
      eventLines.push(`DTSTART;TZID=Europe/Brussels:${cleanDate}T${sh}${sm}00`);
      eventLines.push(`DTEND;TZID=Europe/Brussels:${cleanDate}T${eh}${sm}00`);
    } else {
      // All day event
      const nextDayStr = getNextDay(rando.date);
      eventLines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      eventLines.push(`DTEND;VALUE=DATE:${nextDayStr}`);
    }

    // Summary
    const summary = `${emoji} [${prefix}] ${rando.nom}${rando.localite ? ` - ${rando.localite}` : ''}`;
    eventLines.push(`SUMMARY:${escapeICalText(summary)}`);

    // Location
    const locationParts: string[] = [];
    if (rando.lieu_depart) locationParts.push(rando.lieu_depart);
    if (rando.adresse) locationParts.push(rando.adresse);
    else if (rando.code_postal || rando.localite) {
      locationParts.push(`${rando.code_postal || ''} ${rando.localite || ''}`.trim());
    }
    if (rando.province) locationParts.push(rando.province);
    const locationStr = locationParts.join(', ');
    if (locationStr) {
      eventLines.push(`LOCATION:${escapeICalText(locationStr)}`);
    }

    // Description composition
    const descParts: string[] = [];
    descParts.push(`📌 ÉVÉNEMENT : ${rando.nom}`);
    if (rando.club) descParts.push(`🚴 Club organisateur : ${rando.club}`);
    if (rando.lieu_depart) descParts.push(`📍 Lieu de départ : ${rando.lieu_depart}`);
    if (rando.adresse) descParts.push(`🏠 Adresse : ${rando.adresse}`);
    if (rando.province) descParts.push(`🗺️ Province : ${rando.province}`);

    if (rando.parcours && rando.parcours.length > 0) {
      descParts.push('\n--- PARCOURS & CIRCUITS ---');
      for (const p of rando.parcours) {
        const details: string[] = [];
        if (p.distance_km) details.push(`${p.distance_km} km`);
        if (p.denivele) details.push(`${p.denivele}`);
        if (p.horaires) details.push(`Départ: ${p.horaires}`);
        if (p.ravitaillement) details.push(`Ravitaillement: ${p.ravitaillement}`);
        if (p.tarif) details.push(`Tarif: ${p.tarif}`);
        descParts.push(`• ${p.type || 'Circuit'}: ${details.join(' | ')}`);
      }
    }

    if (rando.remarque) {
      descParts.push(`\nℹ️ Remarque : ${rando.remarque}`);
    }

    if (rando.lien_itineraire) {
      descParts.push(`\n🗺️ Itinéraire Google Maps : ${rando.lien_itineraire}`);
      eventLines.push(`URL:${escapeICalText(rando.lien_itineraire)}`);
    }

    descParts.push('\n🔗 Source : Fédération Francophone Belge du Cyclotourisme (FFBC / Vélo Liberté)');
    descParts.push('📱 Calendrier préparé par Fabrizio de la Rusta (RPA)');

    eventLines.push(`DESCRIPTION:${escapeICalText(descParts.join('\n'))}`);

    // Categories
    const categories: string[] = ['FFBC', 'CYCLOTOURISME'];
    if (disc.isRoute) categories.push('ROUTE');
    if (disc.isGravel) categories.push('GRAVEL');
    if (disc.isVtt) categories.push('VTT');
    if (disc.isMarche) categories.push('MARCHE');
    if (rando.province) categories.push(rando.province.toUpperCase());
    eventLines.push(`CATEGORIES:${escapeICalText(categories.join(','))}`);

    eventLines.push('STATUS:CONFIRMED');
    eventLines.push('TRANSP:TRANSPARENT');
    eventLines.push('END:VEVENT');

    for (const el of eventLines) {
      lines.push(foldLine(el));
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Triggers a direct download of the generated .ics file.
 * In iOS Safari, opening/downloading this file opens the native iOS Calendar import sheet.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
