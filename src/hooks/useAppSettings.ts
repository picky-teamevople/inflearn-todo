'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppSettings } from '@/types/settings';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface UseAppSettingsReturn {
  title: string;
  loading: boolean;
  error: string | null;
  updateTitle: (title: string) => Promise<ActionResult>;
}

const API_BASE = '/api/settings';
const DEFAULT_TITLE = 'To Do';
const GENERIC_ERROR_MESSAGE = '작업을 처리하지 못했습니다';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? GENERIC_ERROR_MESSAGE;
  } catch {
    return GENERIC_ERROR_MESSAGE;
  }
}

export function useAppSettings(): UseAppSettingsReturn {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
          if (!cancelled) {
            setError(await parseErrorMessage(response));
          }
          return;
        }
        const data = (await response.json()) as AppSettings;
        if (!cancelled) {
          setTitle(data.title);
        }
      } catch {
        if (!cancelled) {
          setError(GENERIC_ERROR_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateTitle = useCallback(
    async (nextTitle: string): Promise<ActionResult> => {
      try {
        const response = await fetch(API_BASE, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: nextTitle }),
        });

        if (!response.ok) {
          return { ok: false, error: await parseErrorMessage(response) };
        }

        const updated = (await response.json()) as AppSettings;
        setTitle(updated.title);
        return { ok: true };
      } catch {
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }
    },
    []
  );

  return { title, loading, error, updateTitle };
}
