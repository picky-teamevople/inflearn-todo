export interface Todo {
  id: string; // crypto.randomUUID()로 생성
  title: string; // 1~100자
  completed: boolean;
  dueDate: string | null; // ISO 8601 문자열 또는 null("마감일 없음")
  categories: string[]; // 1~5개, 미입력 시 ["미분류"]로 자동 대체
  createdAt: string; // ISO 8601, 목록 최상단 정렬 기준
  updatedAt: string; // ISO 8601, 수정 시각
}

export interface CreateTodoInput {
  title: string;
  dueDate?: string | null;
  categories?: string[];
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  dueDate?: string | null;
  categories?: string[];
}

export type DeadlineStatus = 'none' | 'upcoming' | 'overdue' | 'normal';
