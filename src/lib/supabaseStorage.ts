import { createClient } from '@supabase/supabase-js';
import type { IStorageService, FitnessEntry } from '@/types/fitness';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SupabaseStorageService: IStorageService = {
  async getAll() {
    const { data } = await supabase
      .from('fitness_entries')
      .select('*')
      .order('date', { ascending: false });
    return data ?? [];
  },
  async addEntry(entry: FitnessEntry) {
    const { error } = await supabase
      .from('fitness_entries')
      .upsert(entry);
    return !error;
  },
  // ... etc
};
