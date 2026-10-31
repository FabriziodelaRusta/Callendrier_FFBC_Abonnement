/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FFBCRando, CalendarDataset, InputGitHubFile } from './src/types';
import { generateICalendar } from './src/utils/icsGenerator';
import { matchDiscipline, normalizeProvince, getSeasonBounds } from './src/utils/filterUtils';
import { getDistanceFromPostalCode } from './src/utils/postalCodeGeo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// In-memory dataset
let cachedDataset: CalendarDataset | null = null;
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/FabriziodelaRusta/Input_files/main/calendrier_ffbc.json';
const GITHUB_API_INPUT_FILES = 'https://api.github.com/repos/FabriziodelaRusta/Input_files/contents';
const LOCAL_DATA_PATH = path.join(__dirname, 'src/data/calendrier_ffbc.json');

// Helper to load dataset
function loadInitialDataset(): CalendarDataset {
  try {
    if (fs.existsSync(LOCAL_DATA_PATH)) {
      const fileData = fs.readFileSync(LOCAL_DATA_PATH, 'utf-8');
      const parsed = JSON.parse(fileData);
      const items: FFBCRando[] = parsed.randonnées || parsed.randonnees || [];
      return {
        source: parsed.source || 'https://www.velo-liberte.be/calendrier/',
        annee: parsed.annee || '2026',
        date_extraction: parsed.date_extraction || '2026-10-24',
        nombre_randonnées: items.length,
        randonnées: items,
        lastLoaded: new Date().toISOString(),
        isLive: false,
      };
    }
  } catch (err) {
    console.error('Failed reading local dataset:', err);
  }

  return {
    source: 'https://www.velo-liberte.be/calendrier/',
    annee: '2026',
    date_extraction: new Date().toISOString().slice(0, 10),
    nombre_randonnées: 0,
    randonnées: [],
    lastLoaded: new Date().toISOString(),
    isLive: false,
  };
}

cachedDataset = loadInitialDataset();

// Async fetch from remote GitHub repository
async function refreshFromGitHub(): Promise<boolean> {
  try {
    const res = await fetch(GITHUB_RAW_URL, { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      const items: FFBCRando[] = json.randonnées || json.randonnees || [];
      cachedDataset = {
        source: json.source || 'https://www.velo-liberte.be/calendrier/',
        annee: json.annee || '2026',
        date_extraction: json.date_extraction || new Date().toISOString().slice(0, 10),
        nombre_randonnées: items.length,
        randonnées: items,
        lastLoaded: new Date().toISOString(),
        isLive: true,
      };
      try {
        fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(json, null, 2), 'utf-8');
      } catch {
        // ignore disk write errors
      }
      return true;
    }
  } catch (err) {
    console.warn('Could not refresh from GitHub:', err);
  }
  return false;
}

refreshFromGitHub().catch(() => {});

app.use(express.json());

// API: get dataset summary & list
app.get('/api/events', (_req: Request, res: Response) => {
  if (!cachedDataset) {
    cachedDataset = loadInitialDataset();
  }
  res.json(cachedDataset);
});

// API: fetch matching files from https://github.com/FabriziodelaRusta/Input_files
// Rule: files present in Input_files if the name contains 'route', 'gravel', 'tout' or a province name
app.get('/api/input-files', async (_req: Request, res: Response) => {
  try {
    const ghRes = await fetch(GITHUB_API_INPUT_FILES, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Calendrier-FFBC-App',
      },
      cache: 'no-cache',
    });

    if (ghRes.ok) {
      const files: any[] = await ghRes.json();
      const provinces = ['hainaut', 'namur', 'liege', 'liège', 'luxembourg', 'brabant'];

      const matchingFiles: InputGitHubFile[] = [];

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
          matchingFiles.push({
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

      return res.json({
        success: true,
        files: matchingFiles,
        totalInRepo: files.length,
      });
    }
  } catch (err) {
    console.warn('Error fetching input files from GitHub:', err);
  }

  res.json({
    success: false,
    files: [],
    totalInRepo: 0,
  });
});

// API: force refresh from GitHub
app.post('/api/refresh', async (_req: Request, res: Response) => {
  const success = await refreshFromGitHub();
  res.json({
    success,
    nombre_randonnées: cachedDataset?.nombre_randonnées || 0,
    date_extraction: cachedDataset?.date_extraction,
    lastLoaded: cachedDataset?.lastLoaded,
  });
});

// Helper to filter events based on query parameters
function filterDataset(
  items: FFBCRando[],
  options: {
    disciplines?: string[];
    provinces?: string[];
    start?: string;
    end?: string;
    postalCode?: string;
    maxKm?: number;
  }
): FFBCRando[] {
  return items.filter(rando => {
    // 1. Discipline check
    if (options.disciplines && options.disciplines.length > 0) {
      const matchAny = options.disciplines.some(d => matchDiscipline(rando, d as any));
      if (!matchAny) return false;
    }

    // 2. Province check
    if (options.provinces && options.provinces.length > 0 && !options.provinces.includes('ALL')) {
      const p = normalizeProvince(rando.province);
      const matchProv = options.provinces.some(op => op.toLowerCase() === p.toLowerCase());
      if (!matchProv) return false;
    }

    // 3. Date range check
    if (options.start && rando.date < options.start) return false;
    if (options.end && rando.date > options.end) return false;

    // 4. Distance by Belgian postal code check
    if (options.postalCode && options.maxKm && options.maxKm > 0) {
      const dist = getDistanceFromPostalCode(rando, options.postalCode);
      if (dist === null || dist > options.maxKm) {
        return false;
      }
    }

    return true;
  });
}

// API: iCalendar subscription feed generator
app.get(['/api/calendar.ics', '/api/calendar/:preset.ics'], (req: Request, res: Response) => {
  if (!cachedDataset) {
    cachedDataset = loadInitialDataset();
  }

  const preset = req.params.preset?.toLowerCase();
  const disciplinesQuery = req.query.disciplines ? String(req.query.disciplines).toUpperCase().split(',') : [];
  const provincesQuery = req.query.provinces ? String(req.query.provinces).split(',') : [];
  const startQuery = req.query.start ? String(req.query.start) : undefined;
  const endQuery = req.query.end ? String(req.query.end) : undefined;
  const nameQuery = req.query.name ? String(req.query.name) : undefined;
  const postalCodeQuery = req.query.postal_code ? String(req.query.postal_code) : undefined;
  const maxKmQuery = req.query.radius_km ? parseFloat(String(req.query.radius_km)) : undefined;

  let selectedDisciplines: string[] = disciplinesQuery;
  let selectedProvinces: string[] = provincesQuery;
  let start = startQuery;
  let end = endQuery;
  let calendarTitle = nameQuery || 'Calendrier FFBC';

  // Apply presets if route matched /api/calendar/:preset.ics
  if (preset) {
    switch (preset) {
      case 'all':
      case 'tout':
        calendarTitle = 'Calendrier FFBC (Tout)';
        break;
      case 'route':
        selectedDisciplines = ['ROUTE'];
        calendarTitle = 'FFBC - Route & Cyclo';
        break;
      case 'gravel':
        selectedDisciplines = ['GRAVEL'];
        calendarTitle = 'FFBC - Gravel';
        break;
      case 'vtt':
        selectedDisciplines = ['VTT'];
        calendarTitle = 'FFBC - VTT';
        break;
      case 'marche':
        selectedDisciplines = ['MARCHE'];
        calendarTitle = 'FFBC - Marche & Pédestre';
        break;
      case 'saison': {
        const bounds = getSeasonBounds();
        start = bounds.todayStr;
        end = bounds.seasonEndStr;
        calendarTitle = `FFBC - ${bounds.seasonLabel}`;
        break;
      }
      case 'hainaut':
        selectedProvinces = ['Hainaut'];
        calendarTitle = 'FFBC - Hainaut';
        break;
      case 'namur':
        selectedProvinces = ['Namur'];
        calendarTitle = 'FFBC - Namur';
        break;
      case 'liege':
        selectedProvinces = ['Liège'];
        calendarTitle = 'FFBC - Liège';
        break;
      case 'luxembourg':
        selectedProvinces = ['Luxembourg'];
        calendarTitle = 'FFBC - Luxembourg';
        break;
      case 'brabant-wallon':
        selectedProvinces = ['Brabant Wallon'];
        calendarTitle = 'FFBC - Brabant Wallon';
        break;
      default:
        calendarTitle = `Calendrier FFBC (${preset})`;
    }
  }

  const filtered = filterDataset(cachedDataset.randonnées, {
    disciplines: selectedDisciplines.length > 0 ? selectedDisciplines : undefined,
    provinces: selectedProvinces.length > 0 ? selectedProvinces : undefined,
    start,
    end,
    postalCode: postalCodeQuery,
    maxKm: maxKmQuery,
  });

  const icsContent = generateICalendar(filtered, {
    calendarName: calendarTitle,
    description: `Abonnement officiel aux événements FFBC - ${filtered.length} randonnées incluses`,
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${preset || 'calendrier_ffbc'}.ics"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(icsContent);
});

// Setup Vite middlewares in dev or express.static in prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
