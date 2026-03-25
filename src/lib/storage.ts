// src/lib/storage.ts
// Save and load fitness entries from the browser's localStorage.
// To swap to a real database later, only this file needs to change.

const DB_KEY = 'soma_fitness_entries_v1';

export const StorageService = {

  // Get ALL entries, newest first
  getAll() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      return entries.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    } catch {
      return [];
    }
  },

  // Save a new entry (or update existing one with same id)
  addEntry(entry) {
    try {
      const entries = this.getAll();
      const idx = entries.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        entries[idx] = entry; // update existing
      } else {
        entries.unshift(entry); // add new at top
      }
      localStorage.setItem(DB_KEY, JSON.stringify(entries));
      return true;
    } catch {
      return false;
    }
  },

  // Delete one entry by its id
  deleteEntry(id) {
    try {
      const entries = this.getAll().filter(e => e.id !== id);
      localStorage.setItem(DB_KEY, JSON.stringify(entries));
      return true;
    } catch {
      return false;
    }
  },

  // Wipe everything (use carefully!)
  clear() {
    localStorage.removeItem(DB_KEY);
  },
};
