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

export function TodoList({
  todos,
  categories,
  onToggle,
  onEdit,
  onDeleteRequest,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
        표시할 할 일이 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
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
  );
}
