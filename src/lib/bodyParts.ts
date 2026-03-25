// src/lib/bodyParts.ts
// Maps 3D mesh names to data fields.
// The `id` MUST match the mesh name in your .glb exactly — case sensitive.

import type { BodyPartDescriptor } from '../types/fitness'

export const BODY_PARTS: BodyPartDescriptor[] = [
  { id: 'neck',       label: 'Neck',              field: 'measurements.neck',      unit: 'in', category: 'measurements', svgX: 0, svgY: 0 },
  { id: 'shoulders',  label: 'Shoulders',         field: 'measurements.shoulders', unit: 'in', category: 'measurements', svgX: 0, svgY: 0 },
  { id: 'chest',      label: 'Chest',             field: 'measurements.chest',     unit: 'in', category: 'measurements', svgX: 0, svgY: 0 },
  { id: 'belly',      label: 'Belly',             field: 'measurements.belly',     unit: 'in', category: 'measurements', svgX: 0, svgY: 0 },
  { id: 'waist',      label: 'Waist',             field: 'measurements.waist',     unit: 'in', category: 'measurements', svgX: 0, svgY: 0 },
  { id: 'glutes',     label: 'Glutes',            field: 'measurements.glutes',    unit: 'in', category: 'measurements', svgX: 0, svgY: 0 },
  { id: 'bicepsL',    label: 'Left Bicep',        field: 'bilateral.bicepsL',      unit: 'in', side: 'L', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'bicepsR',    label: 'Right Bicep',       field: 'bilateral.bicepsR',      unit: 'in', side: 'R', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'forearmsL',  label: 'Left Forearm',      field: 'bilateral.forearmsL',    unit: 'in', side: 'L', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'forearmsR',  label: 'Right Forearm',     field: 'bilateral.forearmsR',    unit: 'in', side: 'R', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'wristsL',    label: 'Left Wrist',        field: 'bilateral.wristsL',      unit: 'in', side: 'L', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'wristsR',    label: 'Right Wrist',       field: 'bilateral.wristsR',      unit: 'in', side: 'R', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'thighsMaxL', label: 'Left Thigh (max)',  field: 'bilateral.thighsMaxL',   unit: 'in', side: 'L', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'thighsMaxR', label: 'Right Thigh (max)', field: 'bilateral.thighsMaxR',   unit: 'in', side: 'R', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'thighsMinL', label: 'Left Thigh (min)',  field: 'bilateral.thighsMinL',   unit: 'in', side: 'L', category: 'bilateral', svgX: 0, svgY: 0 },
  { id: 'thighsMinR', label: 'Right Thigh (min)', field: 'bilateral.thighsMinR',   unit: 'in', side: 'R', category: 'bilateral', svgX: 0, svgY: 0 },
];

export const PART_MAP = Object.fromEntries(BODY_PARTS.map(p => [p.id, p]))
