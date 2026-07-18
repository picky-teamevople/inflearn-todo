'use client';

import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteToggle } from '@/components/CompleteToggle';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DueDateBadge } from '@/components/DueDateBadge';
import { TodoEditForm } from '@/components/TodoEditForm';
import type { Category } from '@/types/category';
import type { Todo, UpdateTodoInput } from '@/types/todo';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface TodoItemProps {
  todo: Todo;
  categories: Category[];
  onToggle: (id: string) => Promise<ActionResult>;
  onEdit: (id: string, patch: UpdateTodoInput) => Promise<ActionResult>;
  onDeleteRequest: (todo: Todo) => void;
}

export function TodoItem({
  todo,
  categories,
  onToggle,
  onEdit,
  onDeleteRequest,
}: TodoItemProps) {
  const checkboxId = useId();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);

  async function handleToggle() {
    setToggling(true);
    const result = await onToggle(todo.id);
    setToggling(false);
    setToggleError(result.ok ? null : result.error ?? null);
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-neutral-300 bg-neutral-50 p-3">
        <TodoEditForm
          todo={todo}
          categories={categories}
          onEdit={onEdit}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="group flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
      <div className="flex items-start gap-3">
        <CompleteToggle
          id={checkboxId}
          checked={todo.completed}
          onCheckedChange={() => void handleToggle()}
          disabled={toggling}
          aria-label={todo.completed ? '완료 취소' : '완료로 표시'}
        />
        <div className="flex flex-1 flex-col gap-1.5 pt-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={checkboxId}
              className={
                todo.completed
                  ? 'text-neutral-400 line-through'
                  : 'text-neutral-900'
              }
            >
              {todo.title}
            </label>
            <span
              className={
                todo.completed
                  ? 'text-xs font-medium text-neutral-500'
                  : 'text-xs font-medium text-blue-600'
              }
            >
              {todo.completed ? '완료' : '미완료'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DueDateBadge dueDate={todo.dueDate} completed={todo.completed} />
            {todo.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600"
              >
                {category}
              </span>
            ))}
          </div>

          {toggleError ? (
            <p role="alert" className="text-sm text-red-600">
              {toggleError}
            </p>
          ) : null}
        </div>

        <div className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity md:flex md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            aria-label={`${todo.title} 수정`}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeleteRequest(todo)}
            aria-label={`${todo.title} 삭제`}
            className="hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${todo.title} 더보기`}
                className="shrink-0 md:hidden"
              />
            }
          >
            <MoreVertical aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setMobileEditOpen(true)}>
              <Pencil aria-hidden="true" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteRequest(todo)}
            >
              <Trash2 aria-hidden="true" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={mobileEditOpen} onOpenChange={setMobileEditOpen}>
        <DialogContent className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-xl data-open:slide-in-from-bottom data-closed:slide-out-to-bottom sm:max-w-full">
          <DialogTitle className="text-base font-medium">할 일 수정</DialogTitle>
          <TodoEditForm
            todo={todo}
            categories={categories}
            onEdit={onEdit}
            onCancel={() => setMobileEditOpen(false)}
            onSaved={() => setMobileEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </li>
  );
}
