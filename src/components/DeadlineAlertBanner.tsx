import { getDeadlineStatus } from '@/hooks/useDeadlineStatus';
import type { Todo } from '@/types/todo';

interface DeadlineAlertBannerProps {
  todos: Todo[];
}

export function DeadlineAlertBanner({ todos }: DeadlineAlertBannerProps) {
  const upcomingTodos = todos.filter(
    (todo) => getDeadlineStatus(todo.dueDate, todo.completed) === 'upcoming'
  );

  if (upcomingTodos.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4"
    >
      <p className="text-sm font-semibold text-amber-800">
        마감 임박 (24시간 이내) 할 일 {upcomingTodos.length}건
      </p>
      <ul className="flex flex-col gap-1">
        {upcomingTodos.map((todo) => (
          <li key={todo.id} className="text-sm text-amber-700">
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
