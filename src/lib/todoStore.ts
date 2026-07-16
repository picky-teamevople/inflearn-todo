import { randomUUID } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { dedupeCategories, UNCATEGORIZED_LABEL } from '@/lib/category';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'todos.json');
const TEMP_FILE = path.join(DATA_DIR, 'todos.json.tmp');

interface TodosFile {
  todos: Todo[];
}

function resolveCategories(categories: string[] | undefined): string[] {
  const deduped = dedupeCategories(categories ?? []);
  return deduped.length > 0 ? deduped : [UNCATEGORIZED_LABEL];
}

/** JSON 파일 읽기 (파일 없으면 []) */
export async function readTodos(): Promise<Todo[]> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as TodosFile;
    return parsed.todos ?? [];
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
}

/** 임시 파일에 쓴 뒤 rename으로 원자적 교체 */
export async function writeTodosAtomic(todos: Todo[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: TodosFile = { todos };
  await writeFile(TEMP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  await rename(TEMP_FILE, DATA_FILE);
}

/** 목록 최상단에 추가될 신규 Todo 생성 후 저장 */
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const todos = await readTodos();
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
  await writeTodosAtomic(next);
  return newTodo;
}

/** 완료 토글 등 부분 수정, 없으면 null 반환 */
export async function updateTodo(
  id: string,
  patch: UpdateTodoInput
): Promise<Todo | null> {
  const todos = await readTodos();
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
  await writeTodosAtomic(next);
  return updated;
}

/** 카테고리 이름이 바뀐 경우, 해당 이름을 참조하는 모든 Todo의 표시값을 새 이름으로 교체 */
export async function renameCategoryInTodos(
  previousName: string,
  nextName: string
): Promise<void> {
  const todos = await readTodos();
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
    await writeTodosAtomic(next);
  }
}

/** 삭제 후 저장, 성공 여부 반환 */
export async function deleteTodo(id: string): Promise<boolean> {
  const todos = await readTodos();
  const next = todos.filter((todo) => todo.id !== id);

  if (next.length === todos.length) {
    return false;
  }

  await writeTodosAtomic(next);
  return true;
}
