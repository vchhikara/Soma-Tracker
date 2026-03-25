// ============================================================
// src/types/fitness.ts
// Complete TypeScript schema — drop this into your Vite/Next.js
// project. All measurements strictly in inches except where noted.
// ============================================================

export interface HeightMeasurement {
  /** Integer feet component (e.g. 5 for 5'11") */
  feet: number;
  /** Remaining inches component (e.g. 11 for 5'11") */
  inches: number;
}

/** Overall body metrics — weight in kg, height in ft+in */
export interface OverallMetrics {
  heightFt: number | null;
  heightIn: number | null;
  /** kg */
  weight: number | null;
  /** percentage 0–100 */
  bodyFatPct: number | null;
}

/** Single-point circumference measurements — ALL IN INCHES */
export interface CircumferenceMeasurements {
  neck: number | null;
  shoulders: number | null;
  chest: number | null;
  belly: number | null;
  waist: number | null;
  glutes: number | null;
}

/** Bilateral limb measurements — ALL IN INCHES */
export interface BilateralMeasurements {
  bicepsL: number | null;
  bicepsR: number | null;
  forearmsL: number | null;
  forearmsR: number | null;
  wristsL: number | null;
  wristsR: number | null;
  /** Maximum circumference (mid-thigh) */
  thighsMaxL: number | null;
  thighsMaxR: number | null;
  /** Minimum circumference (near knee) */
  thighsMinL: number | null;
  thighsMinR: number | null;
  calvesL: number | null;
  calvesR: number | null;
  anklesL: number | null;
  anklesR: number | null;
}

/**
 * Primary fitness entry.
 * id: unique string (e.g. `entry_${Date.now()}`)
 * date: ISO 8601 date string "YYYY-MM-DD" — acts as logical primary key
 *
 * Storage note: this interface is designed so that
 * localStorage can be swapped for a Supabase/PostgreSQL
 * backend by replacing StorageService methods only.
 * The `id` field maps to a UUID primary key in SQL.
 */
export interface FitnessEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  overall: OverallMetrics;
  measurements: CircumferenceMeasurements;
  bilateral: BilateralMeasurements;
  /** Optional free-text note */
  notes?: string;
  /** ISO timestamp of creation */
  createdAt?: string;
  /** ISO timestamp of last update */
  updatedAt?: string;
}

/** Maps a dot on the 3D model mesh to a data field */
export interface BodyPartDescriptor {
  /** Must match the mesh name in your .glb file exactly */
  id: string;
  label: string;
  /** Dot-path into FitnessEntry, e.g. "measurements.waist" */
  field: string;
  unit: 'in' | 'kg' | '%';
  category: 'overall' | 'measurements' | 'bilateral';
  /** 'L' | 'R' for bilateral parts */
  side?: 'L' | 'R';
  /** SVG X position as % (0–100) for 2D fallback */
  svgX: number;
  /** SVG Y position as % (0–100) for 2D fallback */
  svgY: number;
}

// ============================================================
// src/types/storage.ts — Storage interface for easy backend swap
// ============================================================

export interface IStorageService {
  getAll(): FitnessEntry[];
  getById(id: string): FitnessEntry | null;
  addEntry(entry: FitnessEntry): boolean;
  updateEntry(entry: FitnessEntry): boolean;
  deleteEntry(id: string): boolean;
  clear(): void;
}

// ============================================================
// src/lib/storage.ts — LocalStorage implementation
// Swap this class for a SupabaseStorageService or
// PostgreSQLStorageService without touching any components.
// ============================================================

const DB_KEY = 'soma_fitness_entries_v1';

export const StorageService: IStorageService = {
  getAll(): FitnessEntry[] {
    try {
      const raw = localStorage.getItem(DB_KEY);
      const entries: FitnessEntry[] = raw ? JSON.parse(raw) : [];
      return entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch {
      return [];
    }
  },

  getById(id: string): FitnessEntry | null {
    return this.getAll().find(e => e.id === id) ?? null;
  },

  addEntry(entry: FitnessEntry): boolean {
    try {
      const entries = this.getAll();
      const withMeta = {
        ...entry,
        createdAt: entry.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = entries.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        entries[idx] = { ...entries[idx], ...withMeta, updatedAt: new Date().toISOString() };
      } else {
        entries.unshift(withMeta);
      }
      localStorage.setItem(DB_KEY, JSON.stringify(entries));
      return true;
    } catch {
      return false;
    }
  },

  updateEntry(entry: FitnessEntry): boolean {
    return this.addEntry(entry); // upsert
  },

  deleteEntry(id: string): boolean {
    try {
      const filtered = this.getAll().filter(e => e.id !== id);
      localStorage.setItem(DB_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },

  clear(): void {
    localStorage.removeItem(DB_KEY);
  },
};

// ============================================================
// src/lib/bodyParts.ts — Body part descriptors
// The `id` in each entry MUST match the mesh name in your .glb
// ============================================================

import type { BodyPartDescriptor } from '@/types/fitness';

export const BODY_PARTS: BodyPartDescriptor[] = [
  // ── NECK / UPPER BODY ──────────────────────────────────
  { id: 'neck',        label: 'Neck',             field: 'measurements.neck',      unit: 'in', category: 'measurements', svgX: 50, svgY: 11 },
  { id: 'shoulders',   label: 'Shoulders',        field: 'measurements.shoulders', unit: 'in', category: 'measurements', svgX: 50, svgY: 18 },
  { id: 'chest',       label: 'Chest',            field: 'measurements.chest',     unit: 'in', category: 'measurements', svgX: 50, svgY: 24 },

  // ── TORSO ──────────────────────────────────────────────
  { id: 'belly',       label: 'Belly',            field: 'measurements.belly',     unit: 'in', category: 'measurements', svgX: 50, svgY: 31 },
  { id: 'waist',       label: 'Waist',            field: 'measurements.waist',     unit: 'in', category: 'measurements', svgX: 50, svgY: 36 },
  { id: 'glutes',      label: 'Glutes',           field: 'measurements.glutes',    unit: 'in', category: 'measurements', svgX: 50, svgY: 44 },

  // ── ARMS bilateral ─────────────────────────────────────
  { id: 'bicepsL',     label: 'Left Bicep',       field: 'bilateral.bicepsL',      unit: 'in', category: 'bilateral', side: 'L', svgX: 27, svgY: 26 },
  { id: 'bicepsR',     label: 'Right Bicep',      field: 'bilateral.bicepsR',      unit: 'in', category: 'bilateral', side: 'R', svgX: 73, svgY: 26 },
  { id: 'forearmsL',   label: 'Left Forearm',     field: 'bilateral.forearmsL',    unit: 'in', category: 'bilateral', side: 'L', svgX: 22, svgY: 34 },
  { id: 'forearmsR',   label: 'Right Forearm',    field: 'bilateral.forearmsR',    unit: 'in', category: 'bilateral', side: 'R', svgX: 78, svgY: 34 },
  { id: 'wristsL',     label: 'Left Wrist',       field: 'bilateral.wristsL',      unit: 'in', category: 'bilateral', side: 'L', svgX: 18, svgY: 41 },
  { id: 'wristsR',     label: 'Right Wrist',      field: 'bilateral.wristsR',      unit: 'in', category: 'bilateral', side: 'R', svgX: 82, svgY: 41 },

  // ── LEGS bilateral ─────────────────────────────────────
  { id: 'thighsMaxL',  label: 'Left Thigh (max)', field: 'bilateral.thighsMaxL',   unit: 'in', category: 'bilateral', side: 'L', svgX: 36, svgY: 52 },
  { id: 'thighsMaxR',  label: 'Right Thigh (max)',field: 'bilateral.thighsMaxR',   unit: 'in', category: 'bilateral', side: 'R', svgX: 64, svgY: 52 },
  { id: 'thighsMinL',  label: 'Left Thigh (min)', field: 'bilateral.thighsMinL',   unit: 'in', category: 'bilateral', side: 'L', svgX: 36, svgY: 62 },
  { id: 'thighsMinR',  label: 'Right Thigh (min)',field: 'bilateral.thighsMinR',   unit: 'in', category: 'bilateral', side: 'R', svgX: 64, svgY: 62 },
  { id: 'calvesL',     label: 'Left Calf',        field: 'bilateral.calvesL',      unit: 'in', category: 'bilateral', side: 'L', svgX: 37, svgY: 73 },
  { id: 'calvesR',     label: 'Right Calf',       field: 'bilateral.calvesR',      unit: 'in', category: 'bilateral', side: 'R', svgX: 63, svgY: 73 },
  { id: 'anklesL',     label: 'Left Ankle',       field: 'bilateral.anklesL',      unit: 'in', category: 'bilateral', side: 'L', svgX: 37, svgY: 82 },
  { id: 'anklesR',     label: 'Right Ankle',      field: 'bilateral.anklesR',      unit: 'in', category: 'bilateral', side: 'R', svgX: 63, svgY: 82 },
];
