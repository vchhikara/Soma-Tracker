// src/types/fitness.ts
// Complete TypeScript schema for SOMA Tracker.
// All circumference measurements are in inches.
// Weight in kg. Height in feet + inches.

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: string // "YYYY-MM-DD"
}

export interface OverallMetrics {
  heightFt: string
  heightIn: string
  weight: string       // kg
  bodyFatPct: string   // %
}

/** All circumference values in inches */
export interface CircumferenceMeasurements {
  neck: string
  shoulders: string
  chest: string
  belly: string
  waist: string
  glutes: string
}

/** Bilateral limb values in inches */
export interface BilateralMeasurements {
  bicepsL: string;    bicepsR: string
  forearmsL: string;  forearmsR: string
  wristsL: string;    wristsR: string
  thighsMaxL: string; thighsMaxR: string
  thighsMinL: string; thighsMinR: string
  calvesL: string;    calvesR: string
  anklesL: string;    anklesR: string
}

/** Primary body measurement entry */
export interface FitnessEntry {
  id: string
  profile_id: string
  date: string           // "YYYY-MM-DD"
  overall: OverallMetrics
  measurements: CircumferenceMeasurements
  bilateral: BilateralMeasurements
  created_at?: string
  updated_at?: string
}

/** One set within an exercise — allows different reps/weight per set */
export interface SetRow {
  id: string
  reps: string
  weight: string         // numeric string, or note if bodyweight
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  unit: 'kg' | 'lbs' | 'bodyweight'
  setRows: SetRow[]
}

export interface WorkoutSession {
  id: string
  profile_id: string
  date: string           // "YYYY-MM-DD"
  name: string
  category: string
  duration: string       // minutes
  notes: string
  exercises: Exercise[]
  created_at?: string
}

/** Body part descriptor — links a 3D mesh name to a data field */
export interface BodyPartDescriptor {
  id: string             // must match mesh name in .glb exactly
  label: string
  field: string          // dot-path into FitnessEntry
  unit: 'in' | 'kg' | '%'
  side?: 'L' | 'R'
  category?: 'measurements' | 'bilateral'
  svgX?: number
  svgY?: number
}
