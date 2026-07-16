export const UNCATEGORIZED_LABEL = '미분류';

/**
 * trim + toLowerCase, 대소문자 통합 인식용 비교 키
 */
export function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * 한 Todo 내 입력값 중 대소문자만 다른 중복 제거(첫 입력 표기 유지)
 */
export function dedupeCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const category of categories) {
    const trimmed = category.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const key = normalizeCategory(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}
