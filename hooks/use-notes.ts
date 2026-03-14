import { useState, useEffect, useCallback } from 'react';
import type { Note, NotePreview } from '@/types/note';
import { storage } from '@/utils/storage';
import { stripFormatting } from '@/utils/formatting';

const STORAGE_KEY = 'glassnotes_all_notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const stored = await storage.get<Note[]>(STORAGE_KEY);
    setNotes(stored ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const saveNote = useCallback(async (note: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      const updated = exists ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev];
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const togglePin = useCallback(async (id: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n,
      );
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const getNote = useCallback(
    (id: string): Note | undefined => {
      return notes.find((n) => n.id === id);
    },
    [notes],
  );

  const filteredNotes: NotePreview[] = notes
    .filter((n) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    })
    .map((n) => ({
      id: n.id,
      title: n.title || 'Untitled',
      updatedAt: n.updatedAt,
      isPinned: n.isPinned,
      preview: stripFormatting(n.content).slice(0, 100),
    }));

  return {
    notes,
    filteredNotes,
    isLoading,
    searchQuery,
    setSearchQuery,
    saveNote,
    deleteNote,
    togglePin,
    getNote,
    loadNotes,
  };
}
