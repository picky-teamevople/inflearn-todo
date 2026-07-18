'use client';

import { useMemo, useState } from 'react';
import { TodoItem } from '@/components/TodoItem';
import type { Category } from '@/types/category';
import type { Todo, UpdateTodoInput } from '@/types/todo';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  onToggle: (id: string) => Promise<ActionResult>;
  onEdit: (id: string, patch: UpdateTodoInput) => Promise<ActionResult>;
  onDeleteRequest: (todo: Todo) => void;
}

type CompletionFilter = 'all' | 'completed' | 'incomplete';

const FILTERS: { value: CompletionFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'incomplete', label: '미완료' },
  { value: 'completed', label: '완료' },
];

function filterTabClass(active: boolean): string {
  return active
    ? 'rounded-md border-2 border-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-900'
    : 'rounded-md border-2 border-transparent px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100';
}

export function TodoList({
  todos,
  categories,
  onToggle,
  onEdit,
  onDeleteRequest,
}: TodoListProps) {
  const [filter, setFilter] = useState<CompletionFilter>('all');

  const filteredTodos = useMemo(() => {
    if (filter === 'completed') {
      return todos.filter((todo) => todo.completed);
    }
    if (filter === 'incomplete') {
      return todos.filter((todo) => !todo.completed);
    }
    return todos;
  }, [todos, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="완료 상태 필터"
        className="flex w-fit gap-1 rounded-lg bg-neutral-50 p-1"
      >
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={filterTabClass(filter === item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredTodos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          표시할 할 일이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              categories={categories}
              onToggle={onToggle}
              onEdit={onEdit}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
