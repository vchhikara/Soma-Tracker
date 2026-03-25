import type { FitnessEntry } from './fitness'

export interface IStorageService {
  getAll(): FitnessEntry[];
  getById(id: string): FitnessEntry | null;
  addEntry(entry: FitnessEntry): boolean;
  updateEntry(entry: FitnessEntry): boolean;
  deleteEntry(id: string): boolean;
  clear(): void;
}
