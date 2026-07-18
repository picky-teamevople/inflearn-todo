'use client';

import { Calendar } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  fromDueDateParts,
  nowAsDueDateParts,
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
import type { CreateTodoInput } from '@/types/todo';

interface TodoInputProps {
  onSubmit: (input: CreateTodoInput) => Promise<{ ok: boolean; error?: string }>;
  categories: Category[];
  activeCategory?: string | null;
}

export function TodoInput({ onSubmit, categories, activeCategory }: TodoInputProps) {
  const titleId = useId();
  const dueDateToggleId = useId();
  const categoryId = useId();

  const [title, setTitle] = useState('');
  const [dueDateEnabled, setDueDateEnabled] = useState(false);
  const [dueDateParts, setDueDateParts] = useState<DueDateParts>(
    nowAsDueDateParts
  );
  const [selectedCategory, setSelectedCategory] = useState(activeCategory ?? '');
  const [prevActiveCategory, setPrevActiveCategory] = useState(activeCategory);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (activeCategory !== prevActiveCategory) {
    setPrevActiveCategory(activeCategory);
    setSelectedCategory(activeCategory ?? '');
  }

  function resetForm() {
    setTitle('');
    setDueDateEnabled(false);
    setSelectedCategory(activeCategory ?? '');
    setFormError(null);
  }

  function handleDueDateToggle(checked: boolean) {
    setDueDateEnabled(checked);
    if (checked) {
      setDueDateParts(nowAsDueDateParts());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    const result = await onSubmit({
      title: title.trim(),
      dueDate: isoDueDate,
      categories: selectedCategories,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error ?? null);
      return;
    }

    resetForm();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-5"
      noValidate
    >
      <Input
        id={titleId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="할 일을 입력하세요"
        maxLength={TITLE_MAX_LENGTH}
        aria-label="할 일 제목"
        aria-invalid={formError !== null}
        aria-describedby={formError ? `${titleId}-error` : undefined}
        className="h-12 px-4 text-base md:text-lg"
      />

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex items-start gap-1.5">
          <div className="flex h-8 items-center gap-1.5">
            <Checkbox
              id={dueDateToggleId}
              checked={dueDateEnabled}
              onCheckedChange={(checked) => handleDueDateToggle(checked === true)}
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
                  setDueDateParts((prev) => ({ ...prev, date: event.target.value }))
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
                    setDueDateParts((prev) => ({ ...prev, time: event.target.value }))
                  }
                  aria-label="마감 시간 (hh:mm)"
                  className="h-8 w-20 text-sm"
                />
              </div>
            </div>
          ) : null}
        </div>

        <select
          id={categoryId}
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
        <p id={`${titleId}-error`} role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-12">
        추가
      </Button>
    </form>
  );
}
