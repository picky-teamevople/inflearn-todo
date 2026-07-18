'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CATEGORY_NAME_MAX_LENGTH } from '@/lib/validation';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface CategoryFormSheetProps {
  open: boolean;
  title: string;
  initialName?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<ActionResult>;
}

export function CategoryFormSheet({
  open,
  title,
  initialName = '',
  onOpenChange,
  onSubmit,
}: CategoryFormSheetProps) {
  const inputId = useId();

  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(initialName);
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await onSubmit(name);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }

    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-xl data-open:slide-in-from-bottom data-closed:slide-out-to-bottom sm:max-w-full">
        <DialogTitle className="text-base font-medium">{title}</DialogTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id={inputId}
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="할 일 그룹 이름"
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            aria-label="할 일 그룹 이름"
            aria-invalid={error !== null}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="h-12 px-4 text-base"
          />

          {error ? (
            <p id={`${inputId}-error`} role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting || name.trim().length < 1}
            className="h-12"
          >
            저장
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
