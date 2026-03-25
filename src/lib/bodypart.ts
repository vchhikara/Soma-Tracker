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