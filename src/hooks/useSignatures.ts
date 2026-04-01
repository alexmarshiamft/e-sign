import { useState, useCallback } from 'react';
import { SavedSignature } from '../types';

const STORAGE_KEY = 'esign_signatures';

function load(): SavedSignature[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(sigs: SavedSignature[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs));
  } catch {
    // quota exceeded
  }
}

export function useSignatures() {
  const [signatures, setSignatures] = useState<SavedSignature[]>(load);

  const persist = useCallback((sigs: SavedSignature[]) => {
    setSignatures(sigs);
    save(sigs);
  }, []);

  const addSignature = useCallback(
    (name: string, dataUrl: string) => {
      const sig: SavedSignature = {
        id: crypto.randomUUID(),
        name,
        dataUrl,
        createdAt: Date.now(),
      };
      persist([...load(), sig]);
      return sig;
    },
    [persist]
  );

  const deleteSignature = useCallback(
    (id: string) => {
      persist(load().filter((s) => s.id !== id));
    },
    [persist]
  );

  return { signatures, addSignature, deleteSignature };
}
