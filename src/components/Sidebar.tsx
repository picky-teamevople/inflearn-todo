'use client';

import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { CategoryFormSheet } from '@/components/CategoryFormSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_NAME_MAX_LENGTH } from '@/lib/validation';
import type { Category } from '@/types/category';

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface SidebarProps {
  categories: Category[];
  selectedCategory: string | null; // null이면 "전체"
  onSelectCategory: (category: string | null) => void;
  onAddCategory: (name: string) => Promise<ActionResult>;
  onRenameCategory: (id: string, name: string) => Promise<ActionResult>;
  onRemoveCategory: (id: string) => Promise<ActionResult>;
  onReorderCategories: (orderedIds: string[]) => Promise<ActionResult>;
}

function navItemClass(active: boolean): string {
  return active
    ? 'truncate rounded-md border-2 border-neutral-900 px-3 py-2 text-left text-sm font-medium text-neutral-900'
    : 'truncate rounded-md border-2 border-transparent px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100';
}

function categoryLabelClass(active: boolean): string {
  return active
    ? 'flex-1 truncate rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-900'
    : 'flex-1 truncate rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100';
}

export function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onRemoveCategory,
  onReorderCategories,
}: SidebarProps) {
  const addInputId = useId();

  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [dragHandleId, setDragHandleId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const isAllActive = selectedCategory === null;

  async function handleAddSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddSubmitting(true);
    const result = await onAddCategory(newName);
    setAddSubmitting(false);

    if (!result.ok) {
      setAddError(result.error ?? null);
      return;
    }

    setAddError(null);
    setNewName('');
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) {
      return;
    }

    setEditSubmitting(true);
    const result = await onRenameCategory(editingId, editingName);
    setEditSubmitting(false);

    if (!result.ok) {
      setEditError(result.error ?? null);
      return;
    }

    cancelEdit();
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    const result = await onRemoveCategory(id);
    setRemovingId(null);

    if (!result.ok) {
      setRemoveError(result.error ?? null);
      return;
    }

    setRemoveError(null);
  }

  function handleDragStart(event: React.DragEvent<HTMLLIElement>, id: string) {
    if (dragHandleId !== id) {
      event.preventDefault();
      return;
    }
    setDraggedId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }

  function handleDragOver(event: React.DragEvent<HTMLLIElement>, id: string) {
    if (draggedId === null || draggedId === id) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  }

  function resetDragState() {
    setDraggedId(null);
    setDragOverId(null);
    setDragHandleId(null);
  }

  async function handleDrop(event: React.DragEvent<HTMLLIElement>, targetId: string) {
    event.preventDefault();

    if (draggedId === null || draggedId === targetId) {
      resetDragState();
      return;
    }

    const ids = categories.map((category) => category.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    resetDragState();

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const next = [...ids];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, draggedId);

    const result = await onReorderCategories(next);
    if (!result.ok) {
      setReorderError(result.error ?? null);
      return;
    }

    setReorderError(null);
  }

  return (
    <nav
      aria-label="카테고리"
      className="relative flex min-w-0 gap-1 overflow-x-auto border-b border-neutral-200 p-3 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:p-4"
    >
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        aria-current={isAllActive ? 'true' : undefined}
        className={`shrink-0 ${navItemClass(isAllActive)}`}
      >
        전체
      </button>

      <ul className="contents md:flex md:flex-col md:gap-1">
        {categories.map((category) => {
          const active = selectedCategory === category.name;
          const isEditing = editingId === category.id;

          if (isEditing) {
            return (
              <li key={category.id} className="w-40 shrink-0 md:w-auto">
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-1">
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEdit();
                      }
                    }}
                    onBlur={() => {
                      if (!editSubmitting) {
                        cancelEdit();
                      }
                    }}
                    maxLength={CATEGORY_NAME_MAX_LENGTH}
                    aria-label={`${category.name} 카테고리 이름 수정`}
                    aria-invalid={editError !== null}
                    className="h-8 px-3 text-sm"
                  />
                  {editError ? (
                    <p role="alert" className="px-1 text-xs text-red-600">
                      {editError}
                    </p>
                  ) : null}
                </form>
              </li>
            );
          }

          return (
            <li
              key={category.id}
              draggable={dragHandleId === category.id}
              onDragStart={(event) => handleDragStart(event, category.id)}
              onDragOver={(event) => handleDragOver(event, category.id)}
              onDrop={(event) => void handleDrop(event, category.id)}
              onDragEnd={resetDragState}
              className={`group relative flex shrink-0 items-center rounded-md border-t-2 ${
                draggedId === category.id ? 'opacity-40' : ''
              } ${dragOverId === category.id ? 'border-neutral-400' : 'border-transparent'}`}
            >
              <span
                onMouseDown={() => setDragHandleId(category.id)}
                onMouseUp={() => setDragHandleId(null)}
                className="absolute left-0.5 z-10 hidden shrink-0 cursor-grab items-center text-neutral-400 opacity-0 transition-opacity active:cursor-grabbing md:flex md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                aria-hidden="true"
              >
                <GripVertical className="size-3" />
              </span>
              <div
                className={`flex flex-1 items-center gap-0.5 rounded-md border-2 ${
                  active ? 'border-neutral-900' : 'border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectCategory(category.name)}
                  aria-current={active ? 'true' : undefined}
                  className={categoryLabelClass(active)}
                >
                  {category.name}
                </button>
                <div className="hidden shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity md:flex md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => startEdit(category)}
                    aria-label={`카테고리 ${category.name} 수정`}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => void handleRemove(category.id)}
                    disabled={removingId === category.id}
                    aria-label={`카테고리 ${category.name} 삭제`}
                    className="hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {removeError ? (
        <p role="alert" className="w-40 shrink-0 px-1 text-xs text-red-600 md:w-auto">
          {removeError}
        </p>
      ) : null}

      {reorderError ? (
        <p role="alert" className="w-40 shrink-0 px-1 text-xs text-red-600 md:w-auto">
          {reorderError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setMobileAddOpen(true)}
        className={`flex shrink-0 items-center gap-1 md:hidden ${navItemClass(false)}`}
      >
        <Plus className="size-4" aria-hidden="true" />
        할일그룹 추가
      </button>

      <form
        onSubmit={handleAddSubmit}
        className="hidden w-40 shrink-0 flex-col gap-1 md:mt-2 md:flex md:w-auto md:border-t md:border-neutral-200 md:pt-2"
        noValidate
      >
        <div className="flex items-center gap-1">
          <label htmlFor={addInputId} className="sr-only">
            새 카테고리 이름
          </label>
          <Input
            id={addInputId}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="카테고리 추가"
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            aria-invalid={addError !== null}
            className="h-8 px-3 text-sm"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-xs"
            disabled={addSubmitting}
            aria-label="카테고리 추가"
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        {addError ? (
          <p role="alert" className="px-1 text-xs text-red-600">
            {addError}
          </p>
        ) : null}
      </form>

      <CategoryFormSheet
        open={mobileAddOpen}
        title="할일그룹 추가"
        onOpenChange={setMobileAddOpen}
        onSubmit={onAddCategory}
      />
    </nav>
  );
}
