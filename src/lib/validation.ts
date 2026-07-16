export const VALIDATION_MESSAGES = {
  TITLE_REQUIRED: '제목을 입력해주세요',
  TITLE_TOO_LONG: '제목은 100자 이하로 입력해주세요',
  DUE_DATE_INVALID: '올바른 날짜 형식이 아닙니다',
  DUE_DATE_TIME_INVALID: '올바른 시간을 입력해주세요 (예: 09:30)',
  DUE_DATE_PAST: '마감일은 오늘 이후로 설정해주세요',
  CATEGORY_MAX_EXCEEDED: '카테고리는 최대 5개까지 지정할 수 있습니다',
  CATEGORY_NAME_REQUIRED: '카테고리 이름을 입력해주세요',
  CATEGORY_NAME_TOO_LONG: '카테고리 이름은 30자 이하로 입력해주세요',
  CATEGORY_NAME_DUPLICATE: '이미 존재하는 카테고리입니다',
  APP_TITLE_REQUIRED: '이름을 입력해주세요',
  APP_TITLE_TOO_LONG: '이름은 30자 이하로 입력해주세요',
} as const;

export const TITLE_MAX_LENGTH = 100;
export const CATEGORY_MAX_COUNT = 5;
export const CATEGORY_NAME_MAX_LENGTH = 30;
export const APP_TITLE_MAX_LENGTH = 30;

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 제목 1자 이상 100자 이하 검증.
 * 실패 시 "제목을 입력해주세요" 등 안내 문구 반환
 */
export function validateTitle(title: string): ValidationResult {
  const trimmed = title.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: VALIDATION_MESSAGES.TITLE_REQUIRED };
  }

  if (trimmed.length > TITLE_MAX_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.TITLE_TOO_LONG };
  }

  return { valid: true };
}

/**
 * null 허용, 값이 있으면 현재 시각 이후인지 검증
 */
export function validateDueDate(dueDate: string | null): ValidationResult {
  if (dueDate === null) {
    return { valid: true };
  }

  const parsed = new Date(dueDate);

  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, error: VALIDATION_MESSAGES.DUE_DATE_INVALID };
  }

  if (parsed.getTime() <= Date.now()) {
    return { valid: false, error: VALIDATION_MESSAGES.DUE_DATE_PAST };
  }

  return { valid: true };
}

/**
 * 1~5개 범위 검증, 6개 이상이면 "카테고리는 최대 5개까지 지정할 수 있습니다"
 */
export function validateCategories(categories: string[]): ValidationResult {
  if (categories.length > CATEGORY_MAX_COUNT) {
    return { valid: false, error: VALIDATION_MESSAGES.CATEGORY_MAX_EXCEEDED };
  }

  return { valid: true };
}

/**
 * 카테고리 이름 1~30자, 기존 이름과 대소문자 무관 중복 불가 검증
 */
export function validateCategoryName(
  name: string,
  existingNames: string[]
): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: VALIDATION_MESSAGES.CATEGORY_NAME_REQUIRED };
  }

  if (trimmed.length > CATEGORY_NAME_MAX_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.CATEGORY_NAME_TOO_LONG };
  }

  const key = trimmed.toLowerCase();
  const isDuplicate = existingNames.some(
    (existing) => existing.trim().toLowerCase() === key
  );

  if (isDuplicate) {
    return { valid: false, error: VALIDATION_MESSAGES.CATEGORY_NAME_DUPLICATE };
  }

  return { valid: true };
}

/**
 * 앱 이름 1~30자 검증
 */
export function validateAppTitle(title: string): ValidationResult {
  const trimmed = title.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: VALIDATION_MESSAGES.APP_TITLE_REQUIRED };
  }

  if (trimmed.length > APP_TITLE_MAX_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.APP_TITLE_TOO_LONG };
  }

  return { valid: true };
}
