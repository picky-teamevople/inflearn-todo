import type { DeadlineStatus, Todo } from '@/types/todo';

const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * completed=true면 항상 'normal'(강조 없음)
 * dueDate=null이면 'none'
 * !completed && dueDate <= now → 'overdue'
 * !completed && 0 < (dueDate - now) <= 24h → 'upcoming'
 * 그 외 → 'normal'
 */
export function getDeadlineStatus(
  dueDate: string | null,
  completed: boolean
): DeadlineStatus {
  if (completed) {
    return 'normal';
  }

  if (dueDate === null) {
    return 'none';
  }

  const dueTime = new Date(dueDate).getTime();
  const now = Date.now();
  const diff = dueTime - now;

  if (diff <= 0) {
    return 'overdue';
  }

  if (diff <= UPCOMING_WINDOW_MS) {
    return 'upcoming';
  }

  return 'normal';
}

export function useDeadlineStatus(todo: Todo): DeadlineStatus {
  return getDeadlineStatus(todo.dueDate, todo.completed);
}
