import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/lib/storage';
import type { FitnessEntry } from '@/types/fitness';

export function useEntries() {
  const [entries, setEntries] = useState<FitnessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setEntries(StorageService.getAll());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addEntry = useCallback((entry: FitnessEntry) => {
    StorageService.addEntry(entry);
    refresh();
  }, [refresh]);

  const deleteEntry = useCallback((id: string) => {
    StorageService.deleteEntry(id);
    refresh();
  }, [refresh]);

  return { entries, loading, addEntry, deleteEntry, refresh };
}
