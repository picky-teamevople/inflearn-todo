'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TodoInput } from '@/components/TodoInput';
import type { Category } from '@/types/category';
import type { CreateTodoInput } from '@/types/todo';

interface MobileTodoFabProps {
  onSubmit: (input: CreateTodoInput) => Promise<{ ok: boolean; error?: string }>;
  categories: Category[];
  activeCategory?: string | null;
}

export function MobileTodoFab({
  onSubmit,
  categories,
  activeCategory,
}: MobileTodoFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="할 일 추가"
        className="fixed bottom-6 left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-xl data-open:slide-in-from-bottom data-closed:slide-out-to-bottom sm:max-w-full">
          <DialogTitle className="sr-only">할 일 추가</DialogTitle>
          <TodoInput
            onSubmit={onSubmit}
            categories={categories}
            activeCategory={activeCategory}
            onSubmitted={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
