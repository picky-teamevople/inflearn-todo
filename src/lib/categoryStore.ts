import { randomUUID } from 'crypto';
import { readJson, writeJson } from '@/lib/blobJsonStore';
import { renameCategoryInTodos } from '@/lib/todoStore';
import type { Category, CreateCategoryInput } from '@/types/category';

interface CategoriesFile {
  categories: Category[];
}

function pathnameFor(userId: string): string {
  return `categories/${userId}.json`;
}

/** 사용자의 카테고리 목록 읽기 (없으면 []) */
export async function readCategories(userId: string): Promise<Category[]> {
  const parsed = await readJson<CategoriesFile>(pathnameFor(userId), {
    categories: [],
  });
  return parsed.categories ?? [];
}

/** 카테고리 목록 전체 저장 */
export async function writeCategoriesAtomic(
  userId: string,
  categories: Category[]
): Promise<void> {
  const payload: CategoriesFile = { categories };
  await writeJson(pathnameFor(userId), payload);
}

/** 신규 카테고리 생성 후 저장 */
export async function createCategory(
  userId: string,
  input: CreateCategoryInput
): Promise<Category> {
  const categories = await readCategories(userId);

  const newCategory: Category = {
    id: randomUUID(),
    name: input.name.trim(),
    createdAt: new Date().toISOString(),
  };

  const next = [...categories, newCategory];
  await writeCategoriesAtomic(userId, next);
  return newCategory;
}

/** 이름 수정 후 저장, 없으면 null 반환. 이름이 바뀌면 기존 Todo의 표시값도 함께 갱신 */
export async function updateCategory(
  userId: string,
  id: string,
  name: string
): Promise<Category | null> {
  const categories = await readCategories(userId);
  const index = categories.findIndex((category) => category.id === id);

  if (index === -1) {
    return null;
  }

  const previousName = categories[index].name;
  const nextName = name.trim();
  const updated: Category = { ...categories[index], name: nextName };

  const next = [...categories];
  next[index] = updated;
  await writeCategoriesAtomic(userId, next);

  if (previousName !== nextName) {
    await renameCategoryInTodos(userId, previousName, nextName);
  }

  return updated;
}

/** orderedIds 순서대로 재배열 후 저장 (알 수 없는 id는 무시, 누락된 항목은 기존 순서로 뒤에 유지) */
export async function reorderCategories(
  userId: string,
  orderedIds: string[]
): Promise<Category[]> {
  const categories = await readCategories(userId);
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

  await writeCategoriesAtomic(userId, reordered);
  return reordered;
}

/** 삭제 후 저장, 성공 여부 반환 */
export async function deleteCategory(
  userId: string,
  id: string
): Promise<boolean> {
  const categories = await readCategories(userId);
  const next = categories.filter((category) => category.id !== id);

  if (next.length === categories.length) {
    return false;
  }

  await writeCategoriesAtomic(userId, next);
  return true;
}
