// src/lib/supabase.ts
// Supabase client — reads credentials from environment variables.
// NEVER hardcode keys here. Use your .env file.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Create a .env file in your project root with:\n' +
    '  VITE_SUPABASE_URL=https://uwsrmsrbqtwvhwdzjarl.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=sb_publishable_Abxh1xhFfFk1CxSkn1-RYA_HNz24gJa'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
