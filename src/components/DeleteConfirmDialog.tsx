'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Todo } from '@/types/todo';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface DeleteConfirmDialogProps {
  todo: Todo | null;
  open: boolean;
  onConfirm: () => Promise<ActionResult>;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  todo,
  open,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    onCancel();
  }

  async function handleConfirm() {
    setDeleting(true);
    const result = await onConfirm();
    setDeleting(false);

    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }

    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>할 일을 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>
            {todo
              ? `"${todo.title}" 항목을 삭제하면 되돌릴 수 없습니다.`
              : '이 항목을 삭제하면 되돌릴 수 없습니다.'}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={deleting}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
