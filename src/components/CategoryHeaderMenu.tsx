'use client';

import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CategoryFormSheet } from '@/components/CategoryFormSheet';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category } from '@/types/category';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface CategoryHeaderMenuProps {
  category: Category;
  onRename: (id: string, name: string) => Promise<ActionResult>;
  onRemove: (id: string) => Promise<ActionResult>;
  onRemoved: () => void;
}

export function CategoryHeaderMenu({
  category,
  onRename,
  onRemove,
  onRemoved,
}: CategoryHeaderMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleConfirmDelete() {
    const result = await onRemove(category.id);
    if (result.ok) {
      setDeleteOpen(false);
      onRemoved();
    }
    return result;
  }

  return (
    <div className="flex items-center gap-1 md:hidden">
      <h2 className="truncate text-lg font-semibold text-neutral-900">
        {category.name}
      </h2>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${category.name} 할일그룹 설정`}
            />
          }
        >
          <MoreVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil aria-hidden="true" />
            이름 수정
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryFormSheet
        open={renameOpen}
        title="할일그룹 이름 수정"
        initialName={category.name}
        onOpenChange={setRenameOpen}
        onSubmit={(name) => onRename(category.id, name)}
      />

      <DeleteConfirmDialog
        todo={null}
        open={deleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
        title="할일그룹을 삭제하시겠습니까?"
        description={`"${category.name}" 그룹을 삭제하면 되돌릴 수 없습니다.`}
      />
    </div>
  );
}
