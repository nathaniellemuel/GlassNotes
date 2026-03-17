import { useState, useEffect, useCallback } from 'react';
import type { Folder } from '@/types/folder';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';

const STORAGE_KEY = 'glassnotes_folders';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    const stored = await storage.get<Folder[]>(STORAGE_KEY);
    setFolders(stored ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const createFolder = useCallback(
    (name: string, parentId?: string): Folder => {
      const folder: Folder = {
        id: generateId(),
        name,
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setFolders((prev) => {
        const updated = [...prev, folder];
        storage.set(STORAGE_KEY, updated);
        return updated;
      });
      return folder;
    },
    [],
  );

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, name, updatedAt: Date.now() } : f,
      );
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => {
      const childrenMap = new Map<string, string[]>();
      for (const folder of prev) {
        if (!folder.parentId) continue;
        const children = childrenMap.get(folder.parentId) ?? [];
        children.push(folder.id);
        childrenMap.set(folder.parentId, children);
      }

      const toDelete = new Set<string>([id]);
      const stack = [id];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;
        const children = childrenMap.get(current) ?? [];
        for (const childId of children) {
          if (!toDelete.has(childId)) {
            toDelete.add(childId);
            stack.push(childId);
          }
        }
      }

      const updated = prev.filter((f) => !toDelete.has(f.id));
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  return {
    folders,
    isLoading,
    loadFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  };
}
