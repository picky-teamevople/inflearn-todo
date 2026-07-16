'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Category } from '@/types/category';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (name: string) => Promise<ActionResult>;
  editCategory: (id: string, name: string) => Promise<ActionResult>;
  removeCategory: (id: string) => Promise<ActionResult>;
  reorderCategories: (orderedIds: string[]) => Promise<ActionResult>;
}

const API_BASE = '/api/categories';
const GENERIC_ERROR_MESSAGE = '작업을 처리하지 못했습니다';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? GENERIC_ERROR_MESSAGE;
  } catch {
    return GENERIC_ERROR_MESSAGE;
  }
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
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
        const data = (await response.json()) as Category[];
        if (!cancelled) {
          setCategories(data);
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

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const addCategory = useCallback(async (name: string): Promise<ActionResult> => {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        return { ok: false, error: await parseErrorMessage(response) };
      }

      const created = (await response.json()) as Category;
      setCategories((prev) => [...prev, created]);
      return { ok: true };
    } catch {
      return { ok: false, error: GENERIC_ERROR_MESSAGE };
    }
  }, []);

  const editCategory = useCallback(
    async (id: string, name: string): Promise<ActionResult> => {
      try {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          return { ok: false, error: await parseErrorMessage(response) };
        }

        const updated = (await response.json()) as Category;
        setCategories((prev) =>
          prev.map((category) => (category.id === id ? updated : category))
        );
        return { ok: true };
      } catch {
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }
    },
    []
  );

  const removeCategory = useCallback(async (id: string): Promise<ActionResult> => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response);
        if (response.status === 404) {
          setCategories((prev) => prev.filter((category) => category.id !== id));
        }
        return { ok: false, error: errorMessage };
      }

      setCategories((prev) => prev.filter((category) => category.id !== id));
      return { ok: true };
    } catch {
      return { ok: false, error: GENERIC_ERROR_MESSAGE };
    }
  }, []);

  const reorderCategories = useCallback(
    async (orderedIds: string[]): Promise<ActionResult> => {
      const previous = categories;
      const byId = new Map(previous.map((category) => [category.id, category]));
      const optimistic = orderedIds
        .map((id) => byId.get(id))
        .filter((category): category is Category => category !== undefined);
      setCategories(optimistic);

      try {
        const response = await fetch(API_BASE, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });

        if (!response.ok) {
          setCategories(previous);
          return { ok: false, error: await parseErrorMessage(response) };
        }

        const updated = (await response.json()) as Category[];
        setCategories(updated);
        return { ok: true };
      } catch {
        setCategories(previous);
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }
    },
    [categories]
  );

  return {
    categories,
    loading,
    error,
    addCategory,
    editCategory,
    removeCategory,
    reorderCategories,
  };
}
