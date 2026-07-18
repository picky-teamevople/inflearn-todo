import { randomUUID } from 'crypto';
import { readJson, writeJson } from '@/lib/blobJsonStore';
import { dedupeCategories, UNCATEGORIZED_LABEL } from '@/lib/category';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo';

interface TodosFile {
  todos: Todo[];
}

function pathnameFor(userId: string): string {
  return `todos/${userId}.json`;
}

function resolveCategories(categories: string[] | undefined): string[] {
  const deduped = dedupeCategories(categories ?? []);
  return deduped.length > 0 ? deduped : [UNCATEGORIZED_LABEL];
}

/** 사용자의 Todo 목록 읽기 (없으면 []) */
export async function readTodos(userId: string): Promise<Todo[]> {
  const parsed = await readJson<TodosFile>(pathnameFor(userId), { todos: [] });
  return parsed.todos ?? [];
}

/** Todo 목록 전체 저장 */
export async function writeTodosAtomic(
  userId: string,
  todos: Todo[]
): Promise<void> {
  const payload: TodosFile = { todos };
  await writeJson(pathnameFor(userId), payload);
}

/** 목록 최상단에 추가될 신규 Todo 생성 후 저장 */
export async function createTodo(
  userId: string,
  input: CreateTodoInput
): Promise<Todo> {
  const todos = await readTodos(userId);
  const now = new Date().toISOString();

  const newTodo: Todo = {
    id: randomUUID(),
    title: input.title.trim(),
    completed: false,
    dueDate: input.dueDate ?? null,
    categories: resolveCategories(input.categories),
    createdAt: now,
    updatedAt: now,
  };

  const next = [newTodo, ...todos];
  await writeTodosAtomic(userId, next);
  return newTodo;
}

/** 완료 토글 등 부분 수정, 없으면 null 반환 */
export async function updateTodo(
  userId: string,
  id: string,
  patch: UpdateTodoInput
): Promise<Todo | null> {
  const todos = await readTodos(userId);
  const index = todos.findIndex((todo) => todo.id === id);

  if (index === -1) {
    return null;
  }

  const current = todos[index];
  const updated: Todo = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
    ...(patch.categories !== undefined
      ? { categories: resolveCategories(patch.categories) }
      : {}),
    updatedAt: new Date().toISOString(),
  };

  const next = [...todos];
  next[index] = updated;
  await writeTodosAtomic(userId, next);
  return updated;
}

/** 카테고리 이름이 바뀐 경우, 해당 이름을 참조하는 모든 Todo의 표시값을 새 이름으로 교체 */
export async function renameCategoryInTodos(
  userId: string,
  previousName: string,
  nextName: string
): Promise<void> {
  const todos = await readTodos(userId);
  let changed = false;

  const next = todos.map((todo) => {
    if (!todo.categories.includes(previousName)) {
      return todo;
    }

    changed = true;
    return {
      ...todo,
      categories: dedupeCategories(
        todo.categories.map((category) =>
          category === previousName ? nextName : category
        )
      ),
      updatedAt: new Date().toISOString(),
    };
  });

  if (changed) {
    await writeTodosAtomic(userId, next);
  }
}

/** 삭제 후 저장, 성공 여부 반환 */
export async function deleteTodo(userId: string, id: string): Promise<boolean> {
  const todos = await readTodos(userId);
  const next = todos.filter((todo) => todo.id !== id);

  if (next.length === todos.length) {
    return false;
  }

  await writeTodosAtomic(userId, next);
  return true;
}
