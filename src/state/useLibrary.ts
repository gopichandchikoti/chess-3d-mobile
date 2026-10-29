import { useCallback, useEffect, useState } from 'react';
import { copy } from '../core/content';
import type { LibraryData, StringStorage } from '../core/contracts';
import { emptyLibrary } from '../core/schema';
import { decodeLibrary } from '../core/storage';
export function useLibrary(storage: StringStorage) {
  const [data, setData] = useState<LibraryData>(emptyLibrary);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const raw = await storage.get();
        if (!active) return;
        const decoded = raw === null ? { data: emptyLibrary(), issue: null } : decodeLibrary(raw);
        if (!active) return;
        setData(decoded.data);
        setStorageError(decoded.issue ? copy.corrupt : '');
        setReady(true);
      } catch {
        if (active) {
          setStorageError(copy.storageError);
          setReady(true);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [storage]);
  useEffect(() => {
    if (!ready || !dirty) return;
    let active = true;
    storage.set(JSON.stringify(data)).then(
      () => {
        if (active) setStorageError('');
      },
      () => {
        if (active) setStorageError(copy.storageError);
      },
    );
    return () => {
      active = false;
    };
  }, [data, dirty, ready, storage]);
  const update = useCallback((change: (current: LibraryData) => LibraryData) => {
    setDirty(true);
    setData(change);
  }, []);
  const reset = useCallback(async () => {
    try {
      await storage.remove();
      setDirty(false);
      setData(emptyLibrary());
      setStorageError('');
    } catch {
      setStorageError(copy.storageError);
    }
  }, [storage]);
  return { data, ready, update, reset, storageError };
}
