/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateICalendar } from '../src/utils/icsGenerator.js';
import { matchDiscipline, normalizeProvince, getSeasonBounds } from '../src/utils/filterUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const calendarOutputDir = path.resolve(distDir, 'api', 'calendar');

// Ensure output directories exist
fs.mkdirSync(calendarOutputDir, { recursive: true });

// Read dataset
const datasetPath = path.resolve(rootDir, 'src', 'data', 'calendrier_ffbc.json');
let events = [];

try {
  const raw = fs.readFileSync(datasetPath, 'utf-8');
  const parsed = JSON.parse(raw);
  events = parsed.randonnées || parsed.randonnees || [];
  console.log(`[Static Builder] Loaded ${events.length} events from ${datasetPath}`);
} catch (err) {
  console.error('[Static Builder] Failed reading dataset:', err);
  process.exit(1);
}

const season = getSeasonBounds();

const presets = [
  {
    name: 'all.ics',
    title: 'Calendrier FFBC (Tout)',
    desc: 'Toutes les randonnées officielles FFBC',
    filter: () => true,
  },
  {
    name: 'tout.ics',
    title: 'Calendrier FFBC (Tout)',
    desc: 'Toutes les randonnées officielles FFBC',
    filter: () => true,
  },
  {
    name: 'route.ics',
    title: 'FFBC - Route & Cyclotourisme',
    desc: 'Randonnées et brevets sur route FFBC',
    filter: (e) => matchDiscipline(e, 'ROUTE'),
  },
  {
    name: 'gravel.ics',
    title: 'FFBC - Gravel',
    desc: 'Randonnées Gravel et mixtes FFBC',
    filter: (e) => matchDiscipline(e, 'GRAVEL'),
  },
  {
    name: 'vtt.ics',
    title: 'FFBC - VTT',
    desc: 'Randonnées tout-terrain VTT FFBC',
    filter: (e) => matchDiscipline(e, 'VTT'),
  },
  {
    name: 'marche.ics',
    title: 'FFBC - Marche & Pédestre',
    desc: 'Marches et randonnées pédestres FFBC',
    filter: (e) => matchDiscipline(e, 'MARCHE'),
  },
  {
    name: 'saison.ics',
    title: `FFBC - ${season.seasonLabel}`,
    desc: `Randonnées FFBC pour la ${season.seasonLabel} en cours`,
    filter: (e) => e.date >= season.todayStr && e.date <= season.seasonEndStr,
  },
  {
    name: 'hainaut.ics',
    title: 'FFBC - Hainaut',
    desc: 'Randonnées FFBC en province de Hainaut',
    filter: (e) => normalizeProvince(e.province) === 'Hainaut',
  },
  {
    name: 'namur.ics',
    title: 'FFBC - Namur',
    desc: 'Randonnées FFBC en province de Namur',
    filter: (e) => normalizeProvince(e.province) === 'Namur',
  },
  {
    name: 'liege.ics',
    title: 'FFBC - Liège',
    desc: 'Randonnées FFBC en province de Liège',
    filter: (e) => normalizeProvince(e.province) === 'Liège',
  },
  {
    name: 'luxembourg.ics',
    title: 'FFBC - Luxembourg',
    desc: 'Randonnées FFBC en province de Luxembourg',
    filter: (e) => normalizeProvince(e.province) === 'Luxembourg',
  },
  {
    name: 'brabant-wallon.ics',
    title: 'FFBC - Brabant Wallon',
    desc: 'Randonnées FFBC en province de Brabant Wallon',
    filter: (e) => normalizeProvince(e.province) === 'Brabant Wallon',
  },
];

for (const preset of presets) {
  const filtered = events.filter(preset.filter);
  const icsData = generateICalendar(filtered, {
    calendarName: preset.title,
    description: preset.desc,
  });
  const outPath = path.join(calendarOutputDir, preset.name);
  fs.writeFileSync(outPath, icsData, 'utf-8');
  console.log(`[Static Builder] Generated ${preset.name} (${filtered.length} events) -> ${outPath}`);
}

// Copy index.html to 404.html for GitHub Pages routing support
const indexHtmlPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, notFoundPath);
  console.log('[Static Builder] Copied index.html to 404.html for GitHub Pages');
}

// Write .nojekyll in dist so GitHub Pages does not ignore files starting with _ or folders
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');
console.log('[Static Builder] Created .nojekyll for GitHub Pages compatibility');
