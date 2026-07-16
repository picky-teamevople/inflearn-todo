export interface Category {
  id: string; // crypto.randomUUID()로 생성
  name: string; // 1~30자, 대소문자 무관 중복 불가
  createdAt: string; // ISO 8601
}

export interface CreateCategoryInput {
  name: string;
}
