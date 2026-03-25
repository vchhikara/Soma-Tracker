// src/lib/storage.ts
// Storage service — Supabase backend with localStorage fallback.
// All components import from here. To swap backend, only change this file.

import { supabase } from './supabase'
import type { Profile, FitnessEntry, WorkoutSession } from '../types/fitness'

// ── LOCAL FALLBACK KEYS ───────────────────────────────────
const LS_PROFILES  = 'soma_profiles_v1'
const LS_ACTIVE    = 'soma_active_profile_v1'
const LS_ENTRIES   = (pid: string) => `soma_entries_${pid}_v1`
const LS_WORKOUTS  = (pid: string) => `soma_workouts_${pid}_v1`

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── PROFILES ──────────────────────────────────────────────
export const ProfileService = {
  async getAll(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at')
      if (error) throw error
      return data as Profile[]
    } catch {
      return lsGet<Profile[]>(LS_PROFILES, [])
    }
  },

  async upsert(profile: Profile): Promise<void> {
    lsSet(LS_PROFILES, [...lsGet<Profile[]>(LS_PROFILES, []).filter(p => p.id !== profile.id), profile])
    try {
      await supabase.from('profiles').upsert({ ...profile, created_at: profile.createdAt })
    } catch {}
  },

  async delete(id: string): Promise<void> {
    lsSet(LS_PROFILES, lsGet<Profile[]>(LS_PROFILES, []).filter(p => p.id !== id))
    try { await supabase.from('profiles').delete().eq('id', id) } catch {}
  },

  getActiveId(): string | null {
    return localStorage.getItem(LS_ACTIVE)
  },

  setActiveId(id: string | null): void {
    if (id) localStorage.setItem(LS_ACTIVE, id)
    else localStorage.removeItem(LS_ACTIVE)
  },
}

// ── FITNESS ENTRIES ───────────────────────────────────────
export const EntryService = {
  async getAll(profileId: string): Promise<FitnessEntry[]> {
    try {
      const { data, error } = await supabase
        .from('fitness_entries')
        .select('*')
        .eq('profile_id', profileId)
        .order('date', { ascending: false })
      if (error) throw error
      // Supabase stores nested JSON as jsonb — parse if needed
      return (data as any[]).map(row => ({
        id:           row.id,
        profile_id:   row.profile_id,
        date:         row.date,
        overall:      typeof row.overall === 'string'      ? JSON.parse(row.overall)      : row.overall,
        measurements: typeof row.measurements === 'string' ? JSON.parse(row.measurements) : row.measurements,
        bilateral:    typeof row.bilateral === 'string'    ? JSON.parse(row.bilateral)    : row.bilateral,
        created_at:   row.created_at,
        updated_at:   row.updated_at,
      })) as FitnessEntry[]
    } catch {
      return lsGet<FitnessEntry[]>(LS_ENTRIES(profileId), [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  },

  async upsert(entry: FitnessEntry): Promise<void> {
    // Update localStorage immediately for instant UI
    const all = lsGet<FitnessEntry[]>(LS_ENTRIES(entry.profile_id), [])
    const idx = all.findIndex(e => e.id === entry.id)
    if (idx >= 0) all[idx] = entry; else all.unshift(entry)
    lsSet(LS_ENTRIES(entry.profile_id), all)

    try {
      await supabase.from('fitness_entries').upsert({
        id:           entry.id,
        profile_id:   entry.profile_id,
        date:         entry.date,
        overall:      entry.overall,
        measurements: entry.measurements,
        bilateral:    entry.bilateral,
        updated_at:   new Date().toISOString(),
      })
    } catch {}
  },

  async delete(profileId: string, id: string): Promise<void> {
    lsSet(LS_ENTRIES(profileId), lsGet<FitnessEntry[]>(LS_ENTRIES(profileId), []).filter(e => e.id !== id))
    try { await supabase.from('fitness_entries').delete().eq('id', id) } catch {}
  },
}

// ── WORKOUTS ──────────────────────────────────────────────
export const WorkoutService = {
  async getAll(profileId: string): Promise<WorkoutSession[]> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('profile_id', profileId)
        .order('date', { ascending: false })
      if (error) throw error
      return (data as any[]).map(row => ({
        ...row,
        exercises: typeof row.exercises === 'string' ? JSON.parse(row.exercises) : row.exercises,
      })) as WorkoutSession[]
    } catch {
      return lsGet<WorkoutSession[]>(LS_WORKOUTS(profileId), [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  },

  async upsert(workout: WorkoutSession): Promise<void> {
    const all = lsGet<WorkoutSession[]>(LS_WORKOUTS(workout.profile_id), [])
    const idx = all.findIndex(w => w.id === workout.id)
    if (idx >= 0) all[idx] = workout; else all.unshift(workout)
    lsSet(LS_WORKOUTS(workout.profile_id), all)

    try {
      await supabase.from('workouts').upsert({
        id:         workout.id,
        profile_id: workout.profile_id,
        date:       workout.date,
        name:       workout.name,
        category:   workout.category,
        duration:   workout.duration,
        notes:      workout.notes,
        exercises:  workout.exercises,
        created_at: workout.created_at ?? new Date().toISOString(),
      })
    } catch {}
  },

  async delete(profileId: string, id: string): Promise<void> {
    lsSet(LS_WORKOUTS(profileId), lsGet<WorkoutSession[]>(LS_WORKOUTS(profileId), []).filter(w => w.id !== id))
    try { await supabase.from('workouts').delete().eq('id', id) } catch {}
  },
}
