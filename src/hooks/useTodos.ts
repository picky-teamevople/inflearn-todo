'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (input: CreateTodoInput) => Promise<ActionResult>;
  editTodo: (id: string, patch: UpdateTodoInput) => Promise<ActionResult>;
  toggleTodo: (id: string) => Promise<ActionResult>;
  removeTodo: (id: string) => Promise<ActionResult>;
  refresh: () => Promise<void>;
}

const API_BASE = '/api/todos';
const GENERIC_ERROR_MESSAGE = '작업을 처리하지 못했습니다';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? GENERIC_ERROR_MESSAGE;
  } catch {
    return GENERIC_ERROR_MESSAGE;
  }
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        setError(await parseErrorMessage(response));
        return;
      }
      const data = (await response.json()) as Todo[];
      setTodos(data);
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTodos() {
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
        const data = (await response.json()) as Todo[];
        if (!cancelled) {
          setTodos(data);
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

    void loadTodos();

    return () => {
      cancelled = true;
    };
  }, []);

  const addTodo = useCallback(
    async (input: CreateTodoInput): Promise<ActionResult> => {
      try {
        const response = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          return { ok: false, error: await parseErrorMessage(response) };
        }

        const created = (await response.json()) as Todo;
        setTodos((prev) => [created, ...prev]);
        return { ok: true };
      } catch {
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }
    },
    []
  );

  const editTodo = useCallback(
    async (id: string, patch: UpdateTodoInput): Promise<ActionResult> => {
      try {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });

        if (!response.ok) {
          const errorMessage = await parseErrorMessage(response);
          if (response.status === 404) {
            setTodos((prev) => prev.filter((todo) => todo.id !== id));
          }
          return { ok: false, error: errorMessage };
        }

        const updated = (await response.json()) as Todo;
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updated : todo))
        );
        return { ok: true };
      } catch {
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }
    },
    []
  );

  const toggleTodo = useCallback(
    async (id: string): Promise<ActionResult> => {
      const target = todos.find((todo) => todo.id === id);
      if (!target) {
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }

      try {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !target.completed }),
        });

        if (!response.ok) {
          const errorMessage = await parseErrorMessage(response);
          if (response.status === 404) {
            setTodos((prev) => prev.filter((todo) => todo.id !== id));
          }
          return { ok: false, error: errorMessage };
        }

        const updated = (await response.json()) as Todo;
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updated : todo))
        );
        return { ok: true };
      } catch {
        return { ok: false, error: GENERIC_ERROR_MESSAGE };
      }
    },
    [todos]
  );

  const removeTodo = useCallback(async (id: string): Promise<ActionResult> => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response);
        if (response.status === 404) {
          setTodos((prev) => prev.filter((todo) => todo.id !== id));
        }
        return { ok: false, error: errorMessage };
      }

      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      return { ok: true };
    } catch {
      return { ok: false, error: GENERIC_ERROR_MESSAGE };
    }
  }, []);

  return {
    todos,
    loading,
    error,
    addTodo,
    editTodo,
    toggleTodo,
    removeTodo,
    refresh,
  };
}
