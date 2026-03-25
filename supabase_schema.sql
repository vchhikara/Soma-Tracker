-- ─────────────────────────────────────────────────────────
-- SOMA Tracker — Supabase SQL Schema
-- Run this in your Supabase project:
--   supabase.com → your project → SQL Editor → paste & run
-- ─────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── PROFILES ─────────────────────────────────────────────
create table if not exists profiles (
  id          text primary key,
  name        text not null,
  avatar      text not null default '💪',
  created_at  date not null default current_date
);

-- ── FITNESS ENTRIES ───────────────────────────────────────
create table if not exists fitness_entries (
  id           text primary key,
  profile_id   text not null references profiles(id) on delete cascade,
  date         date not null,
  overall      jsonb not null default '{}',
  measurements jsonb not null default '{}',
  bilateral    jsonb not null default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_entries_profile_date
  on fitness_entries(profile_id, date desc);

-- ── WORKOUTS ──────────────────────────────────────────────
create table if not exists workouts (
  id          text primary key,
  profile_id  text not null references profiles(id) on delete cascade,
  date        date not null,
  name        text not null default '',
  category    text not null default 'Strength',
  duration    text not null default '',
  notes       text not null default '',
  exercises   jsonb not null default '[]',
  created_at  timestamptz default now()
);

create index if not exists idx_workouts_profile_date
  on workouts(profile_id, date desc);

-- ── ROW LEVEL SECURITY (optional but recommended) ─────────
-- Uncomment below if you add Supabase Auth later.
-- alter table profiles       enable row level security;
-- alter table fitness_entries enable row level security;
-- alter table workouts        enable row level security;
