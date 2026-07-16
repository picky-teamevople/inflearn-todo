'use client';

import { Calendar, Pencil, Trash2, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CompleteToggle } from '@/components/CompleteToggle';
import { DueDateBadge } from '@/components/DueDateBadge';
import { Input } from '@/components/ui/input';
import {
  fromDueDateParts,
  nowAsDueDateParts,
  toDueDateParts,
  type DueDateParts,
} from '@/lib/dueDateParts';
import {
  TITLE_MAX_LENGTH,
  validateCategories,
  validateDueDate,
  validateTitle,
  VALIDATION_MESSAGES,
} from '@/lib/validation';
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
  const [title, setTitle] = useState(todo.title);
  const [dueDateEnabled, setDueDateEnabled] = useState(todo.dueDate !== null);
  const [dueDateParts, setDueDateParts] = useState<DueDateParts>(() =>
    toDueDateParts(todo.dueDate)
  );
  const [selectedCategory, setSelectedCategory] = useState(
    todo.categories[0] ?? ''
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleToggle() {
    setToggling(true);
    const result = await onToggle(todo.id);
    setToggling(false);
    setToggleError(result.ok ? null : result.error ?? null);
  }

  function startEdit() {
    setTitle(todo.title);
    setDueDateEnabled(todo.dueDate !== null);
    setDueDateParts(toDueDateParts(todo.dueDate));
    setSelectedCategory(todo.categories[0] ?? '');
    setFormError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFormError(null);
  }

  function handleDueDateToggle(checked: boolean) {
    setDueDateEnabled(checked);
    if (checked) {
      setDueDateParts(nowAsDueDateParts());
    }
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const titleResult = validateTitle(title);
    if (!titleResult.valid) {
      setFormError(titleResult.error ?? null);
      return;
    }

    let isoDueDate: string | null = null;
    if (dueDateEnabled) {
      isoDueDate = fromDueDateParts(dueDateParts);
      if (isoDueDate === null) {
        setFormError(VALIDATION_MESSAGES.DUE_DATE_TIME_INVALID);
        return;
      }
    }

    const dueDateResult = validateDueDate(isoDueDate);
    if (!dueDateResult.valid) {
      setFormError(dueDateResult.error ?? null);
      return;
    }

    const selectedCategories = selectedCategory ? [selectedCategory] : [];
    const categoriesResult = validateCategories(selectedCategories);
    if (!categoriesResult.valid) {
      setFormError(categoriesResult.error ?? null);
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const result = await onEdit(todo.id, {
      title: title.trim(),
      dueDate: isoDueDate,
      categories: selectedCategories,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error ?? null);
      return;
    }

    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-neutral-300 bg-neutral-50 p-3">
        <form
          onSubmit={handleEditSubmit}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEdit();
            }
          }}
          className="flex flex-col gap-3"
          noValidate
        >
          <div className="flex items-start gap-2">
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX_LENGTH}
              aria-label="할 일 제목 수정"
              aria-invalid={formError !== null}
              className="h-10 flex-1 text-base"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={cancelEdit}
              aria-label="수정 취소"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-start gap-1.5">
              <div className="flex h-8 items-center gap-1.5">
                <Checkbox
                  checked={dueDateEnabled}
                  onCheckedChange={(checked) =>
                    handleDueDateToggle(checked === true)
                  }
                  aria-label="마감일 설정"
                />
                <Calendar className="size-4 text-neutral-400" aria-hidden="true" />
              </div>
              {dueDateEnabled ? (
                <div className="flex flex-col gap-1">
                  <Input
                    type="date"
                    value={dueDateParts.date}
                    onChange={(event) =>
                      setDueDateParts((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                    aria-label="마감 날짜"
                    className="h-8 w-auto text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <select
                      value={dueDateParts.period}
                      onChange={(event) =>
                        setDueDateParts((prev) => ({
                          ...prev,
                          period: event.target.value === 'PM' ? 'PM' : 'AM',
                        }))
                      }
                      aria-label="오전/오후"
                      className="h-8 rounded-md border border-neutral-300 bg-transparent px-2 text-sm text-neutral-700 outline-none focus-visible:border-neutral-500"
                    >
                      <option value="AM">오전</option>
                      <option value="PM">오후</option>
                    </select>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="hh:mm"
                      value={dueDateParts.time}
                      onChange={(event) =>
                        setDueDateParts((prev) => ({
                          ...prev,
                          time: event.target.value,
                        }))
                      }
                      aria-label="마감 시간 (hh:mm)"
                      className="h-8 w-20 text-sm"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              aria-label="카테고리"
              className="h-8 rounded-md border border-neutral-300 bg-transparent px-2 text-sm text-neutral-700 outline-none focus-visible:border-neutral-500"
            >
              <option value="">미분류</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="sr-only">
            저장
          </button>
        </form>
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

        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={startEdit}
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
      </div>
    </li>
  );
}
