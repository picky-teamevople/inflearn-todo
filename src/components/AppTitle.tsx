'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_TITLE_MAX_LENGTH } from '@/lib/validation';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface AppTitleProps {
  title: string;
  onRename: (title: string) => Promise<ActionResult>;
}

export function AppTitle({ title, onRename }: AppTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function startEdit() {
    setValue(title);
    setError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await onRename(value);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }

    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            cancelEdit();
          }
        }}
        className="flex min-w-0 flex-1 items-center gap-1"
        noValidate
      >
        <Input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => {
            if (!submitting) {
              cancelEdit();
            }
          }}
          maxLength={APP_TITLE_MAX_LENGTH}
          aria-label="앱 이름 수정"
          aria-invalid={error !== null}
          className="h-8 min-w-0 flex-1 text-lg font-bold"
        />
        {error ? (
          <p role="alert" className="shrink-0 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="group flex min-w-0 flex-1 items-center gap-1">
      <h1 className="truncate text-lg font-bold text-neutral-900">{title}</h1>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={startEdit}
        aria-label="앱 이름 수정"
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <Pencil aria-hidden="true" />
      </Button>
    </div>
  );
}
