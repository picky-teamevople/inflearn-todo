import { randomUUID } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { renameCategoryInTodos } from '@/lib/todoStore';
import type { Category, CreateCategoryInput } from '@/types/category';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'categories.json');
const TEMP_FILE = path.join(DATA_DIR, 'categories.json.tmp');

interface CategoriesFile {
  categories: Category[];
}

/** JSON 파일 읽기 (파일 없으면 []) */
export async function readCategories(): Promise<Category[]> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as CategoriesFile;
    return parsed.categories ?? [];
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
export async function writeCategoriesAtomic(
  categories: Category[]
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: CategoriesFile = { categories };
  await writeFile(TEMP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  await rename(TEMP_FILE, DATA_FILE);
}

/** 신규 카테고리 생성 후 저장 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  const categories = await readCategories();

  const newCategory: Category = {
    id: randomUUID(),
    name: input.name.trim(),
    createdAt: new Date().toISOString(),
  };

  const next = [...categories, newCategory];
  await writeCategoriesAtomic(next);
  return newCategory;
}

/** 이름 수정 후 저장, 없으면 null 반환. 이름이 바뀌면 기존 Todo의 표시값도 함께 갱신 */
export async function updateCategory(
  id: string,
  name: string
): Promise<Category | null> {
  const categories = await readCategories();
  const index = categories.findIndex((category) => category.id === id);

  if (index === -1) {
    return null;
  }

  const previousName = categories[index].name;
  const nextName = name.trim();
  const updated: Category = { ...categories[index], name: nextName };

  const next = [...categories];
  next[index] = updated;
  await writeCategoriesAtomic(next);

  if (previousName !== nextName) {
    await renameCategoryInTodos(previousName, nextName);
  }

  return updated;
}

/** orderedIds 순서대로 재배열 후 저장 (알 수 없는 id는 무시, 누락된 항목은 기존 순서로 뒤에 유지) */
export async function reorderCategories(
  orderedIds: string[]
): Promise<Category[]> {
  const categories = await readCategories();
  const remaining = new Map(categories.map((category) => [category.id, category]));

  const reordered: Category[] = [];
  for (const id of orderedIds) {
    const category = remaining.get(id);
    if (category) {
      reordered.push(category);
      remaining.delete(id);
    }
  }
  for (const category of categories) {
    if (remaining.has(category.id)) {
      reordered.push(category);
    }
  }

  await writeCategoriesAtomic(reordered);
  return reordered;
}

/** 삭제 후 저장, 성공 여부 반환 */
export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await readCategories();
  const next = categories.filter((category) => category.id !== id);

  if (next.length === categories.length) {
    return false;
  }

  await writeCategoriesAtomic(next);
  return true;
}
