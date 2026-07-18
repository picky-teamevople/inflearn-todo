'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppTitle } from '@/components/AppTitle';
import { DeadlineAlertBanner } from '@/components/DeadlineAlertBanner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Sidebar } from '@/components/Sidebar';
import { Toast } from '@/components/Toast';
import { TodoInput } from '@/components/TodoInput';
import { TodoList } from '@/components/TodoList';
import { normalizeCategory } from '@/lib/category';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useCategories } from '@/hooks/useCategories';
import { useTodos } from '@/hooks/useTodos';
import type { Todo } from '@/types/todo';

const TOAST_DURATION_MS = 2000;
const CLOCK_WIDGET_URL =
  'https://indify.co/widgets/live/clock/Qof5L0NJVhynoIEuU21q';

export default function Home() {
  const { todos, loading, error, addTodo, editTodo, toggleTodo, removeTodo, refresh } =
    useTodos();
  const {
    categories,
    error: categoriesError,
    addCategory,
    editCategory,
    removeCategory,
    reorderCategories,
  } = useCategories();
  const {
    title: appTitle,
    error: settingsError,
    updateTitle,
  } = useAppSettings();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage === null) {
      return;
    }
    const timer = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    document.title = appTitle;
  }, [appTitle]);

  const filteredTodos = useMemo(() => {
    if (selectedCategory === null) {
      return todos;
    }
    const key = normalizeCategory(selectedCategory);
    return todos.filter((todo) =>
      todo.categories.some((category) => normalizeCategory(category) === key)
    );
  }, [todos, selectedCategory]);

  function handleDeleteRequest(todo: Todo) {
    setDeleteTarget(todo);
  }

  function handleCancelDelete() {
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return { ok: false, error: '삭제할 항목이 없습니다' };
    }
    const result = await removeTodo(deleteTarget.id);
    if (result.ok) {
      setDeleteTarget(null);
    }
    return result;
  }

  async function handleToggle(id: string) {
    const target = todos.find((todo) => todo.id === id);
    const wasCompleted = target?.completed ?? false;
    const result = await toggleTodo(id);

    if (result.ok && !wasCompleted) {
      setToastMessage('완료되었습니다');
    }

    return result;
  }

  async function handleRenameCategory(id: string, name: string) {
    const target = categories.find((category) => category.id === id);
    const result = await editCategory(id, name);

    if (result.ok) {
      // 카테고리 이름 변경은 서버에서 기존 할 일의 표시값까지 함께 갱신하므로 다시 불러온다
      await refresh();

      if (
        target &&
        selectedCategory !== null &&
        normalizeCategory(selectedCategory) === normalizeCategory(target.name)
      ) {
        setSelectedCategory(name.trim());
      }
    }

    return result;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="w-full border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3 md:px-6">
          <AppTitle title={appTitle} onRename={updateTitle} />
          <iframe
            src={CLOCK_WIDGET_URL}
            title="시계 위젯"
            className="h-10 w-20 shrink-0 border-0 sm:h-12 sm:w-32 md:h-16 md:w-56"
            loading="lazy"
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col md:flex-row">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={addCategory}
          onRenameCategory={handleRenameCategory}
          onRemoveCategory={removeCategory}
          onReorderCategories={reorderCategories}
        />

        <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8">
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {categoriesError ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {categoriesError}
            </p>
          ) : null}

          {settingsError ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {settingsError}
            </p>
          ) : null}

          <div className="flex w-full max-w-2xl flex-col gap-6">
            <DeadlineAlertBanner todos={todos} />

            <TodoInput
              onSubmit={addTodo}
              categories={categories}
              activeCategory={selectedCategory}
            />

            {loading ? (
              <p className="text-sm text-neutral-500">불러오는 중...</p>
            ) : (
              <TodoList
                todos={filteredTodos}
                categories={categories}
                onToggle={handleToggle}
                onEdit={editTodo}
                onDeleteRequest={handleDeleteRequest}
              />
            )}
          </div>
        </main>
      </div>

      <DeleteConfirmDialog
        todo={deleteTarget}
        open={deleteTarget !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
