# TECH_SPEC: inflearn-todo

> PRD 참조: claudedocs/PRD.md

## 1. 기술 스택

| 구분 | 기술 | 버전 | 선정 근거 |
|------|------|------|----------|
| Framework | Next.js (App Router) | 14+ | UI 렌더링과 API Routes(Route Handlers)를 하나의 로컬 실행 환경에서 제공한다. Route Handler는 Node.js 런타임에서 실행되므로 `fs` 모듈로 서버(로컬 프로세스) 측에서 JSON 파일을 직접 읽고 쓸 수 있다. 별도 백엔드 서버를 구축하지 않고도 "서버 사이드 파일 접근"이라는 PRD 제약을 충족하는 가장 단순한 선택이다. |
| Language | TypeScript | 5+ | Todo 데이터 모델과 API 요청/응답 타입을 명시적으로 관리해 검증 로직 오류를 컴파일 타임에 방지한다. |
| Styling | Tailwind CSS | 3.4+ | 유틸리티 기반 스타일링으로 완료/미완료, 임박/기한초과 등 상태별 색상+텍스트 라벨을 빠르게 조합할 수 있다. |
| UI 컴포넌트 | shadcn/ui | latest | 체크박스, 다이얼로그(삭제 확인 모달), 배지 등 접근성이 보장된 컴포넌트를 그대로 활용해 오버엔지니어링 없이 구현 속도를 높인다. |
| State | React hooks (useState/useEffect) + 커스텀 훅 | - | 목록 규모가 100건 이하로 작고 전역 상태 공유 대상이 사실상 없어(단일 화면), 별도 상태관리 라이브러리 도입은 과설계다. |
| Storage | File-based JSON (`data/todos.json`) + Node.js `fs/promises` | - | PRD 제약사항에 따라 서버/DB 없이 로컬 JSON 파일을 직접 읽고 쓴다. Next.js Route Handler가 서버 사이드에서 `fs`로 파일을 다루므로 팀원들이 공유 폴더에 프로젝트(및 `data/todos.json`)를 두고 각자 로컬 서버를 띄워 동일 파일을 참조/공유할 수 있다. localStorage는 브라우저 단위로 격리되어 팀 공유가 불가능하므로 채택하지 않는다. |
| 배포/실행 환경 | 로컬 Node.js 서버 (`next dev` 또는 `next start`) | - | 오프라인 환경에서도 로컬 파일 기반으로 정상 동작해야 한다는 제약을 충족하며, 클라우드 배포 없이 팀 내 로컬 실행만으로 목적을 달성한다. |

---

## 2. 프로젝트 구조

```
inflearn-todo/
├── data/
│   ├── todos.json              # 실제 Todo 데이터 저장 파일 (File-based JSON)
│   └── categories.json         # 관리형 카테고리 목록 저장 파일 (File-based JSON)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 메인 페이지 (최상단 Header "To Do" + 사이드바/본문 2단 레이아웃: 목록/입력/알림/카테고리 관리)
│   │   ├── globals.css         # 글로벌 스타일 (Tailwind)
│   │   └── api/
│   │       ├── todos/
│   │       │   ├── route.ts        # GET(목록 조회), POST(등록) - 기능 1,2,3
│   │       │   └── [id]/
│   │       │       └── route.ts    # PATCH(완료 토글/수정), DELETE(삭제) - 기능 1,2,3
│   │       └── categories/
│   │           ├── route.ts        # GET(목록 조회), POST(등록), PATCH(순서 일괄 재배열) - 기능 3
│   │           └── [id]/
│   │               └── route.ts    # PATCH(이름 수정), DELETE(삭제) - 기능 3
│   ├── components/
│   │   ├── TodoInput.tsx           # 기능 1,2,3 - 등록 폼 (레이블 없는 큰 제목 입력 + 마감일 체크박스 + 카테고리 단일 선택 드롭다운)
│   │   ├── TodoList.tsx            # 기능 1 - 목록 렌더링 컨테이너
│   │   ├── TodoItem.tsx            # 기능 1,2,3 - 개별 항목 표시 (수정/삭제 버튼 포함)
│   │   ├── TodoEditDialog.tsx      # 기능 1,2,3 - 할 일 수정 폼 대화상자 (카테고리는 CategorySelect로 다중 선택 유지)
│   │   ├── DeleteConfirmDialog.tsx # 기능 1 - 삭제 확인 대화상자
│   │   ├── DueDateBadge.tsx        # 기능 2 - 임박/기한초과/마감일 없음 라벨
│   │   ├── DeadlineAlertBanner.tsx # 기능 2 - 상단 임박 알림 영역
│   │   ├── Sidebar.tsx             # 기능 3 - 좌측 사이드 내비게이션 (카테고리 필터 + 인라인 추가/수정/삭제 + 드래그 앤 드롭 순서변경)
│   │   └── CategorySelect.tsx      # 기능 3 - 관리형 카테고리 다중 선택 UI (TodoEditDialog 전용, 최대 5개)
│   ├── hooks/
│   │   ├── useTodos.ts             # API 연동 데이터 훅 (fetch/추가/수정/토글/삭제)
│   │   ├── useCategories.ts        # 카테고리 API 연동 데이터 훅 (fetch/추가/수정/삭제)
│   │   └── useDeadlineStatus.ts    # 마감일 상태(임박/기한초과) 계산 훅
│   ├── lib/
│   │   ├── todoStore.ts            # 서버 사이드 JSON 파일 read/write (원자적 쓰기 포함)
│   │   ├── categoryStore.ts        # 서버 사이드 카테고리 JSON 파일 read/write (원자적 쓰기 포함)
│   │   ├── validation.ts           # 제목/마감일/카테고리/카테고리이름 유효성 검증
│   │   └── category.ts             # 카테고리 정규화 및 중복 제거 유틸
│   └── types/
│       ├── todo.ts                 # Todo, CreateTodoInput, UpdateTodoInput 등 타입 정의
│       └── category.ts             # Category, CreateCategoryInput 타입 정의
```

---

## 3. 구현 명세

### 기능 1: 할 일 추가/수정/완료/삭제 (기본 CRUD) → 구현 명세

> PRD 매핑: 기능 1 - 팀원으로서 할 일을 등록/수정/완료/삭제하여 목록을 최신 상태로 유지

**파일**: `src/components/TodoInput.tsx`, `src/components/TodoList.tsx`, `src/components/TodoItem.tsx`, `src/components/TodoEditDialog.tsx`, `src/components/DeleteConfirmDialog.tsx`, `src/app/api/todos/route.ts`, `src/app/api/todos/[id]/route.ts`, `src/lib/todoStore.ts`, `src/lib/validation.ts`

**Props 인터페이스**:
```typescript
// src/components/TodoInput.tsx
interface TodoInputProps {
  onSubmit: (input: CreateTodoInput) => Promise<{ ok: boolean; error?: string }>;
  categories: Category[];
}

// src/components/TodoList.tsx
interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onEditRequest: (todo: Todo) => void;
  onDeleteRequest: (todo: Todo) => void;
}

// src/components/TodoItem.tsx
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onEditRequest: (todo: Todo) => void;
  onDeleteRequest: (todo: Todo) => void;
}

// src/components/TodoEditDialog.tsx
interface TodoEditDialogProps {
  todo: Todo | null;
  open: boolean;
  categories: Category[];
  onSubmit: (id: string, patch: UpdateTodoInput) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}

// src/components/DeleteConfirmDialog.tsx
interface DeleteConfirmDialogProps {
  todo: Todo | null;
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

**핵심 함수**:
```typescript
// src/lib/validation.ts
// 제목 1자 이상 100자 이하 검증. 실패 시 "제목을 입력해주세요" 등 안내 문구 반환
function validateTitle(title: string): { valid: boolean; error?: string };

// src/lib/todoStore.ts (Route Handler에서 호출, fs 기반)
async function readTodos(): Promise<Todo[]>;                       // JSON 파일 읽기 (파일 없으면 [])
async function writeTodosAtomic(todos: Todo[]): Promise<void>;      // 임시 파일에 쓴 뒤 rename으로 원자적 교체
async function createTodo(input: CreateTodoInput): Promise<Todo>;   // 목록 최상단에 추가될 신규 Todo 생성 후 저장
async function updateTodo(id: string, patch: UpdateTodoInput): Promise<Todo | null>; // 완료 토글/제목·마감일·카테고리 수정 등 부분 수정, 없으면 null 반환
async function deleteTodo(id: string): Promise<boolean>;            // 삭제 후 저장, 성공 여부 반환

// src/hooks/useTodos.ts
function useTodos(): {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (input: CreateTodoInput) => Promise<{ ok: boolean; error?: string }>;
  editTodo: (id: string, patch: UpdateTodoInput) => Promise<{ ok: boolean; error?: string }>;
  toggleTodo: (id: string) => Promise<{ ok: boolean; error?: string }>;
  removeTodo: (id: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
};
```

**수용 기준 매핑**:
| PRD 수용 기준 | 구현 방법 |
|--------------|----------|
| 제목(1~100자) 등록 시 목록 최상단에 즉시 표시 | `TodoInput`이 `validateTitle` 통과 후 `POST /api/todos` 호출 → `createTodo`가 배열 앞에 unshift하여 저장 → `useTodos`가 응답 받아 로컬 state 앞에 즉시 반영 |
| 완료 체크박스 선택 시 "완료" 상태로 시각적 구분 | `TodoItem`의 체크박스 `onChange` → `toggleTodo(id)` → `PATCH /api/todos/[id]` `{completed: true}` → `TodoItem`에서 `completed` 값에 따라 취소선/회색 처리 + "완료" 텍스트 라벨 표시 |
| 수정 버튼 선택 시 기존 값이 채워진 수정 폼 표시, 저장 시 목록에 즉시 반영 | `TodoItem`의 "수정" 버튼 → `onEditRequest(todo)` → 부모(`page.tsx`)가 `editTarget` 상태를 설정하고 `TodoEditDialog`를 `key={todo.id}`로 오픈(대상이 바뀔 때마다 리마운트되어 `useState` 초기값이 해당 todo 값으로 새로 계산됨) → 저장 시 `editTodo(id, patch)` → `PATCH /api/todos/[id]` → 성공 시 `useTodos`가 로컬 목록의 해당 항목을 응답값으로 교체 |
| 수정 시에도 등록과 동일한 검증 규칙 적용, 위반 시 저장 차단 | `TodoEditDialog`가 `TodoInput`과 동일한 `validateTitle`/`validateDueDate`/`validateCategories`를 클라이언트에서 먼저 검증하고, `PATCH /api/todos/[id]` Route Handler도 동일 검증 함수로 서버 재검증 후 400 응답 |
| 삭제 시 확인 절차 없이는 진행되지 않음, 확정 시 즉시 제거 | 삭제 버튼 클릭 시 `onDeleteRequest(todo)`로 `DeleteConfirmDialog`를 open, `onConfirm`에서만 `removeTodo(id)` → `DELETE /api/todos/[id]` 호출 및 목록에서 제거 |
| 제목 미입력 시 "제목을 입력해주세요" 안내와 등록 차단 | `TodoInput`/`TodoEditDialog` submit 시 `validateTitle` 클라이언트 1차 검증(빈 문자열 즉시 차단) + `POST`/`PATCH` 요청 시 서버(Route Handler)도 동일 검증으로 400 응답, 두 경우 모두 동일 문구를 폼 하단에 표시 |
| 삭제된 항목 완료 처리 또는 수정 시도 시 "존재하지 않는 항목입니다" 오류 | `updateTodo`가 대상 id를 배열에서 찾지 못하면 `null` 반환 → `PATCH` 핸들러가 404 + `{error: "존재하지 않는 항목입니다"}` 응답 → `useTodos.toggleTodo`/`editTodo`가 해당 에러 메시지를 반환/표시 |

---

### 기능 2: 마감일 & 알림 → 구현 명세

> PRD 매핑: 기능 2 - 팀원으로서 마감일을 설정하고 임박 알림을 받아 기한 내 작업 완료

**파일**: `src/components/TodoInput.tsx`, `src/components/DueDateBadge.tsx`, `src/components/DeadlineAlertBanner.tsx`, `src/hooks/useDeadlineStatus.ts`, `src/lib/validation.ts`, `src/app/api/todos/route.ts`, `src/app/api/todos/[id]/route.ts`

**Props 인터페이스**:
```typescript
// src/components/DueDateBadge.tsx
interface DueDateBadgeProps {
  dueDate: string | null;   // ISO 8601 문자열 또는 null("마감일 없음")
  completed: boolean;
}

// src/components/DeadlineAlertBanner.tsx
interface DeadlineAlertBannerProps {
  todos: Todo[];
}
```

**핵심 함수**:
```typescript
// src/lib/validation.ts
// null 허용, 값이 있으면 현재 시각 이후인지 검증
function validateDueDate(dueDate: string | null): { valid: boolean; error?: string };

// src/hooks/useDeadlineStatus.ts
type DeadlineStatus = 'none' | 'upcoming' | 'overdue' | 'normal';
// completed=true면 항상 'normal'(강조 없음)
// dueDate=null이면 'none'
// !completed && dueDate <= now → 'overdue'
// !completed && 0 < (dueDate - now) <= 24h → 'upcoming'
// 그 외 → 'normal'
function useDeadlineStatus(todo: Todo): DeadlineStatus;
```

**수용 기준 매핑**:
| PRD 수용 기준 | 구현 방법 |
|--------------|----------|
| 마감일(연-월-일, 필요 시 시:분) 지정 시 저장되어 목록에 표시 | `TodoInput`의 `datetime-local`(또는 `date`) 입력값을 ISO 문자열로 변환해 `CreateTodoInput.dueDate`에 담아 `POST`/`PATCH`로 전송, `todoStore`가 그대로 `Todo.dueDate`에 저장, `TodoItem`이 `DueDateBadge`로 렌더링 |
| 24시간 이내 미완료 항목 "임박" 라벨 + 상단 알림 영역 노출 | `useDeadlineStatus`가 `'upcoming'` 판정 시 `DueDateBadge`에 "임박" 텍스트+강조 색상 표시, `DeadlineAlertBanner`는 전체 `todos` 중 상태 `'upcoming'`인 항목만 필터링해 화면 상단에 나열 |
| 마감일이 현재보다 이전이고 미완료면 "기한 초과" 표시 | `useDeadlineStatus`가 `'overdue'` 판정 시 `DueDateBadge`에 "기한 초과" 텍스트 라벨(색상+텍스트 병행, 접근성 요구사항 충족) 표시 |
| 과거 날짜로 마감일 설정 시 "마감일은 오늘 이후로 설정해주세요" 경고 및 저장 차단 | `TodoInput` submit 시 `validateDueDate` 클라이언트 검증 실패 시 폼에 경고 문구 표시하고 요청 미전송, `POST`/`PATCH` Route Handler도 동일 검증으로 400 응답(서버 재검증) |
| 마감일 미설정 시 "마감일 없음"으로 정상 등록 및 알림 대상 제외 | `dueDate` 미입력 시 `null`로 저장, `DueDateBadge`가 `dueDate===null`이면 "마감일 없음" 표시, `useDeadlineStatus`가 `'none'` 반환해 `DeadlineAlertBanner` 필터링 대상에서 자동 제외 |
| 마감일 설정 시 현재 날짜/시각이 기본값으로 채워지는 편의 제공 | `TodoInput`은 "제목/마감일/카테고리" 텍스트 레이블 없이 큰 제목 `Input` 하나만 두드러지게 배치하고, 마감일은 `Checkbox`(체크 전엔 입력란 자체를 렌더링하지 않음)로 감싼다. 체크 시 `nowAsDatetimeLocalValue()`(로컬 시각 `YYYY-MM-DDTHH:mm` 포맷)로 `dueDateInput`을 즉시 채우고, 체크 해제 시 입력란을 제거하며 값도 초기화한다 |

---

### 기능 3: 카테고리 분류 (관리형 카테고리 선택) → 구현 명세

> PRD 매핑: 기능 3 - 팀원으로서 별도로 관리되는 카테고리 목록 중에서 골라 할 일을 구분해 확인

**파일**: `src/components/CategorySelect.tsx`, `src/components/Sidebar.tsx`, `src/components/TodoInput.tsx`, `src/components/TodoEditDialog.tsx`, `src/hooks/useCategories.ts`, `src/lib/categoryStore.ts`, `src/lib/todoStore.ts`, `src/lib/category.ts`, `src/lib/validation.ts`, `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`, `src/app/page.tsx`

**Props 인터페이스**:
```typescript
// src/components/CategorySelect.tsx (TodoEditDialog 전용 다중 선택 UI — 수정 시에만 사용)
interface CategorySelectProps {
  categories: Category[];            // 관리 중인 전체 카테고리 목록
  selected: string[];                // 현재 선택된 카테고리 이름 배열 (0~5개)
  onChange: (names: string[]) => void;
}

// src/components/Sidebar.tsx (좌측 고정 내비게이션 겸 카테고리 관리 패널 — 팝업/별도 화면 없음)
interface SidebarProps {
  categories: Category[];             // 관리 중인 전체 카테고리 목록 (배열 순서 = 표시 순서)
  selectedCategory: string | null;    // 현재 필터, null이면 "전체"
  onSelectCategory: (category: string | null) => void;
  onAddCategory: (name: string) => Promise<{ ok: boolean; error?: string }>;
  onRenameCategory: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onReorderCategories: (orderedIds: string[]) => Promise<{ ok: boolean; error?: string }>;
}
```

**참고 (TodoInput의 카테고리 선택은 `CategorySelect`를 쓰지 않음)**: 할 일 "등록" 폼(`TodoInput`)은 카테고리를 네이티브 `<select>` 단일 선택 드롭다운으로 받는다(값은 `selectedCategory: string`, 빈 문자열이면 미선택). `CreateTodoInput.categories`로 넘길 때 `selectedCategory ? [selectedCategory] : []`로 변환해 기존 배열 타입/백엔드 검증과 완전히 호환된다. 반면 할 일 "수정" 폼(`TodoEditDialog`)은 기존과 동일하게 `CategorySelect`로 최대 5개까지 다중 선택을 유지한다 — PRD가 등록 시엔 간단한 단일 선택을, 수정 시엔 기존 다중 선택 능력을 그대로 요구하기 때문에 두 폼의 카테고리 입력 방식이 의도적으로 다르다.

**핵심 함수**:
```typescript
// src/lib/categoryStore.ts (Route Handler에서 호출, fs 기반)
async function readCategories(): Promise<Category[]>;                       // JSON 파일 읽기 (파일 없으면 [])
async function writeCategoriesAtomic(categories: Category[]): Promise<void>; // 임시 파일에 쓴 뒤 rename으로 원자적 교체
async function createCategory(input: CreateCategoryInput): Promise<Category>; // 신규 카테고리 생성 후 저장
async function updateCategory(id: string, name: string): Promise<Category | null>; // 이름 수정, 없으면 null. 이름이 바뀌면 todoStore.renameCategoryInTodos 호출
async function deleteCategory(id: string): Promise<boolean>;                // 삭제 후 저장, 성공 여부 반환(todos.json은 변경하지 않음)
async function reorderCategories(orderedIds: string[]): Promise<Category[]>; // orderedIds 순서로 재배열 후 저장, 목록에 없는 id는 무시, 누락된 카테고리는 기존 순서로 뒤에 유지

// src/lib/todoStore.ts
async function renameCategoryInTodos(previousName: string, nextName: string): Promise<void>; // previousName을 포함한 모든 Todo.categories를 nextName으로 치환 후 저장(캐스케이드)

// src/lib/category.ts
function normalizeCategory(value: string): string;                 // trim + toLowerCase, 대소문자 통합 인식용 비교 키
function dedupeCategories(categories: string[]): string[];          // 한 Todo 내 입력값 중 대소문자만 다른 중복 제거(첫 입력 표기 유지)

// src/lib/validation.ts
// 1~5개 범위 검증, 6개 이상이면 "카테고리는 최대 5개까지 지정할 수 있습니다"
function validateCategories(categories: string[]): { valid: boolean; error?: string };
// 카테고리 이름 1~30자, 기존 이름과 대소문자 무관 중복 불가 검증(등록/수정 공용 — 수정 시에는 자기 자신을 제외한 이름 목록을 전달)
function validateCategoryName(name: string, existingNames: string[]): { valid: boolean; error?: string };

// src/hooks/useCategories.ts
function useCategories(): {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (name: string) => Promise<{ ok: boolean; error?: string }>;
  editCategory: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  removeCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
  reorderCategories: (orderedIds: string[]) => Promise<{ ok: boolean; error?: string }>; // 낙관적 갱신: 요청 전 로컬 state를 먼저 재정렬하고, 실패 시 원래 순서로 롤백
};
```

**UI 구조 (팝업/별도 설정 화면 없이 사이드바에 인라인으로 통합)**:
- `Sidebar`는 PC 환경(`md:` 이상)에서 좌측 고정 세로 내비게이션으로, 모바일 폭에서는 상단 가로 스크롤 바로 렌더링된다(반응형 CSS만으로 전환, 별도 드로어/햄버거 없음).
- 구성: "전체" 버튼 + 관리 중인 카테고리 목록(각 행 클릭 시 해당 이름으로 필터링) + 하단의 카테고리 추가용 입력창 1개(Enter 또는 `+` 아이콘 버튼으로 등록).
- 각 카테고리 행에는 평소 이름 텍스트만 보이다가, `group-hover`/`group-focus-within`(키보드 포커스 시에도 노출)일 때만 연필(수정)·휴지통(삭제) 아이콘 버튼이 나타난다(`lucide-react`의 `Pencil`/`Trash2`, 텍스트 버튼 대신 아이콘 전용).
- 수정 아이콘 클릭 시 해당 행이 텍스트 입력창으로 바뀌고(이름 프리필), Enter로 저장·Escape 또는 포커스 아웃으로 취소한다. 별도의 설정 화면/팝업으로 이동하지 않는다.
- **순서 변경(Drag & Drop)**: 각 카테고리 행 왼쪽에 hover 시에만 나타나는 그립 아이콘(`GripVertical`)이 있으며, 이 그립을 마우스로 누른 상태에서만 해당 행에 HTML5 네이티브 `draggable`이 활성화된다(그 외 영역을 눌러 시작한 드래그는 무시). 다른 행 위로 드래그하면 그 위치 바로 앞에 삽입되도록 재배열하고, 드롭 시 `onReorderCategories`로 새 순서를 저장한다. 터치 기반 드래그는 지원하지 않는다(PC 우선 기능).

**수용 기준 매핑**:
| PRD 수용 기준 | 구현 방법 |
|--------------|----------|
| 카테고리는 자유 입력이 아니라 별도 관리되는 목록 중 선택 | `TodoInput`/`TodoEditDialog`는 자유 텍스트 입력 없이 `CategorySelect`(체크박스 목록)만 사용하며, 선택 가능한 항목은 전적으로 `useCategories`가 조회한 관리형 목록에서만 나온다. 관리(추가/수정/삭제)는 `Sidebar`에 인라인으로 통합되어 있으며 팝업이나 별도 화면을 띄우지 않는다 |
| 등록 시 즉시 선택 목록에 반영 | `Sidebar` 하단 입력창 → `onAddCategory(name)` → `POST /api/categories` → 성공 시 `useCategories`가 로컬 `categories` state에 즉시 추가 → 같은 state를 참조하는 `CategorySelect`/`Sidebar` 목록에 즉시 반영 |
| 중복 이름(대소문자 무관) 등록/수정 시 "이미 존재하는 카테고리입니다" 차단 | `validateCategoryName`이 기존 카테고리 이름 배열(수정 시에는 자기 자신 제외)과 소문자 비교해 중복이면 실패 반환, `POST`/`PATCH /api/categories` Route Handler가 저장 전에 이 검증을 수행해 400 응답 |
| 이름 미입력 시 "카테고리 이름을 입력해주세요" 차단 | `validateCategoryName`이 trim 후 길이 0이면 실패 반환, `Sidebar`의 추가/수정 입력창 submit과 `POST`/`PATCH` Route Handler 양쪽에서 동일 문구로 안내 |
| 등록 시엔 최대 1개(드롭다운), 수정 시엔 1~5개(체크박스) 선택 가능 | `TodoInput`은 네이티브 `<select>`(값 0~1개)로 카테고리를 받고, `TodoEditDialog`는 기존과 동일하게 `CategorySelect`(체크박스, 0~5개)를 사용한다. 두 경로 모두 최종적으로 `string[]`을 만들어 `validateCategories`(0~5개 범위 검증)를 통과시키므로 서버/타입 계층은 완전히 동일하다 |
| 6개 이상 선택 시 "카테고리는 최대 5개까지 지정할 수 있습니다" 안내 및 추가 선택 차단(수정 폼) | `CategorySelect`가 이미 5개 선택된 상태에서는 미선택 체크박스를 `disabled` 처리하고 안내 문구를 표시, submit 시 `validateCategories`로 서버 요청 전 최종 재검증, `POST`/`PATCH /api/todos` Route Handler도 동일 검증으로 400 응답 |
| 카테고리 미선택 시 "미분류"로 자동 분류되어 표시 | `createTodo`/`updateTodo`(`todoStore.ts`)가 `categories`가 빈 배열이면 `['미분류']`로 치환해 저장, `TodoItem`과 `Sidebar`는 이를 일반 카테고리와 동일하게 표시/필터링 |
| 특정 카테고리 선택 필터링 시 해당 항목만 표시 | `src/app/page.tsx`가 `Sidebar`의 `onSelectCategory`로 `selectedCategory` 상태를 관리하고, `normalizeCategory(selectedCategory)`와 각 Todo의 정규화된 카테고리 목록을 비교해 목록을 클라이언트에서 필터링(100건 이하 규모이므로 서버 필터링 불필요) |
| 카테고리 이름 수정 시 기존 할 일 표시값도 함께 갱신 | `Sidebar`의 연필 아이콘 → 인라인 입력 → `onRenameCategory(id, name)` → `PATCH /api/categories/[id]` → `categoryStore.updateCategory`가 이름 변경 후 `todoStore.renameCategoryInTodos`로 해당 이름을 참조하는 모든 Todo의 `categories` 배열을 새 이름으로 치환·저장. 클라이언트는 `page.tsx`에서 성공 시 `useTodos().refresh()`를 호출해 갱신된 표시값을 다시 불러온다 |
| 카테고리 삭제 시 선택 목록에서 제거되나 기존 할 일 표시값은 유지 | `Sidebar`의 휴지통 아이콘 → `onRemoveCategory(id)` → `DELETE /api/categories/[id]` → `categoryStore.deleteCategory`가 `categories.json`에서만 제거(`todos.json`은 건드리지 않음, 수정과 달리 캐스케이드 없음). 이후 `CategorySelect`/`Sidebar`의 목록에서는 사라지지만 이미 저장된 `Todo.categories` 문자열은 그대로 남아 화면에 계속 표시됨(소급 삭제/치환 없음) |
| 카테고리 순서를 드래그 앤 드롭으로 변경, 이후에도 유지 | `Sidebar`의 그립 아이콘으로 드래그 시작 → 드롭 대상 위치로 `onReorderCategories(orderedIds)` 호출 → `useCategories.reorderCategories`가 로컬 state를 낙관적으로 재정렬한 뒤 `PATCH /api/categories`(`{ orderedIds }`) 호출 → `categoryStore.reorderCategories`가 `categories.json`의 배열 순서 자체를 재배열해 저장(별도 `order` 필드 없이 배열 인덱스가 곧 표시 순서). 새로고침 후에도 저장된 순서 그대로 유지 |

---

## 4. 데이터 모델

```typescript
// src/types/todo.ts

export interface Todo {
  id: string;                 // crypto.randomUUID()로 생성
  title: string;              // 1~100자
  completed: boolean;
  dueDate: string | null;     // ISO 8601 문자열 또는 null("마감일 없음")
  categories: string[];       // 1~5개, 미입력 시 ["미분류"]로 자동 대체
  createdAt: string;          // ISO 8601, 목록 최상단 정렬 기준
  updatedAt: string;          // ISO 8601, 수정 시각
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
```

```typescript
// src/types/category.ts

export interface Category {
  id: string;       // crypto.randomUUID()로 생성
  name: string;      // 1~30자, 대소문자 무관 중복 불가
  createdAt: string; // ISO 8601
}

export interface CreateCategoryInput {
  name: string;
}
```

**`Todo.categories`와 `Category`의 관계 (소프트 참조)**:
- `Todo.categories`는 카테고리의 `id`가 아니라 등록 당시 선택된 카테고리의 `name` 문자열을 그대로 저장한다(정규화/외래키 없음).
- **삭제 시 캐스케이드 없음**: 카테고리가 삭제되어도 `categories.json`에서만 제거될 뿐 `todos.json`은 변경되지 않으므로, 이미 그 이름이 지정된 할 일은 표시값을 그대로 유지한다(PRD 수용 기준: 소급 변경하지 않음).
- **수정(rename) 시에는 캐스케이드 적용**: 카테고리 이름이 바뀌면 `categoryStore.updateCategory`가 `todoStore.renameCategoryInTodos`를 호출해 해당 이름을 참조하던 모든 `Todo.categories` 문자열을 새 이름으로 함께 치환한다. 삭제와 다르게 수정은 "표시값을 최신 상태로 유지"가 사용자 기대에 맞으므로 의도적으로 캐스케이드를 적용했다(그렇지 않으면 사이드바에는 새 이름만 보이고 기존 할 일에는 더 이상 존재하지 않는 옛 이름이 남아 혼란을 준다).

**저장 파일 구조** (`data/todos.json`):
```json
{
  "todos": [
    {
      "id": "b3f1...",
      "title": "기획서 초안 작성",
      "completed": false,
      "dueDate": "2026-07-16T18:00:00.000Z",
      "categories": ["기획", "우선순위높음"],
      "createdAt": "2026-07-15T09:00:00.000Z",
      "updatedAt": "2026-07-15T09:00:00.000Z"
    }
  ]
}
```

**원자적 쓰기 방식** (동시 편집 충돌에 대한 최소 안전장치):
- 모든 쓰기(추가/수정/삭제)는 `readTodos()`로 전체 배열을 읽고, 메모리 상에서 수정한 뒤 `writeTodosAtomic()`으로 **전체 배열을 통째로 덮어쓴다**(부분 patch가 아닌 full overwrite).
- `writeTodosAtomic`은 `data/todos.json.tmp`에 먼저 쓴 뒤 `fs.rename`으로 `data/todos.json`을 교체한다. 이는 쓰기 도중 프로세스가 중단되어도 파일이 반쪽으로 깨지는 것을 방지하는 최소한의 안전장치이며, PRD에서 이미 인지·수용한 동시 편집 충돌(마지막 저장이 이전 내용을 덮어씀) 자체를 해결하는 락(lock) 시스템은 아니다. 별도 락/실시간 동기화는 MVP 범위 밖으로 설계하지 않는다.

**저장 파일 구조** (`data/categories.json`):
```json
{
  "categories": [
    {
      "id": "8c604d4d-...",
      "name": "기획",
      "createdAt": "2026-07-15T08:15:25.753Z"
    }
  ]
}
```
`categoryStore.ts`의 `writeCategoriesAtomic`도 `todoStore.ts`와 동일하게 `categories.json.tmp`에 쓴 뒤 `fs.rename`으로 교체하는 원자적 쓰기 방식을 사용한다.

---

## 5. API 명세

Route Handler는 Next.js 서버(Node.js 런타임)에서 실행되며 `src/lib/todoStore.ts`/`src/lib/categoryStore.ts`를 통해 각각 `data/todos.json`, `data/categories.json`을 직접 읽고 쓴다.

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/todos` | 전체 할 일 목록 조회 (필터링은 클라이언트에서 수행) | - | `200 Todo[]` |
| POST | `/api/todos` | 할 일 신규 등록 | `CreateTodoInput` | `201 Todo` / `400 { error: string }`(제목/마감일/카테고리 검증 실패) |
| PATCH | `/api/todos/[id]` | 완료 토글 또는 항목 부분 수정(제목/마감일/카테고리) | `UpdateTodoInput` | `200 Todo` / `400 { error: string }` / `404 { error: "존재하지 않는 항목입니다" }` |
| DELETE | `/api/todos/[id]` | 할 일 삭제 (클라이언트에서 확인 대화상자 통과 후 호출) | - | `200 { success: true }` / `404 { error: "존재하지 않는 항목입니다" }` |
| GET | `/api/categories` | 전체 관리형 카테고리 목록 조회 | - | `200 Category[]` |
| POST | `/api/categories` | 카테고리 신규 등록 | `CreateCategoryInput` | `201 Category` / `400 { error: string }`(이름 미입력/중복/길이초과) |
| PATCH | `/api/categories` | 카테고리 목록 순서 일괄 재배열(드래그 앤 드롭) | `{ orderedIds: string[] }` | `200 Category[]` / `400 { error: string }`(잘못된 요청 형식) |
| PATCH | `/api/categories/[id]` | 카테고리 이름 수정 (성공 시 `todos.json`의 관련 항목도 함께 갱신) | `{ name: string }` | `200 Category` / `400 { error: string }`(이름 미입력/중복/길이초과) / `404 { error: "존재하지 않는 카테고리입니다" }` |
| DELETE | `/api/categories/[id]` | 카테고리 삭제 (`todos.json`은 변경하지 않음) | - | `200 { success: true }` / `404 { error: "존재하지 않는 카테고리입니다" }` |

---

## 6. 검증 매트릭스

| PRD 기능 | TECH_SPEC 구현 | 파일 | 테스트 기준 |
|----------|---------------|------|-----------|
| 기능 1: 할 일 추가/수정/완료/삭제 (기본 CRUD) | `TodoInput`/`TodoList`/`TodoItem`/`TodoEditDialog`/`DeleteConfirmDialog` + `POST/PATCH/DELETE /api/todos` + `todoStore.createTodo/updateTodo/deleteTodo` + `validation.validateTitle` | `src/components/TodoInput.tsx`, `src/components/TodoList.tsx`, `src/components/TodoItem.tsx`, `src/components/TodoEditDialog.tsx`, `src/components/DeleteConfirmDialog.tsx`, `src/app/api/todos/route.ts`, `src/app/api/todos/[id]/route.ts`, `src/lib/todoStore.ts`, `src/lib/validation.ts` | 제목 등록→최상단 표시, 완료 체크→시각적 구분, 수정 버튼→기존 값이 채워진 폼 표시→저장 시 목록 즉시 반영, 수정 시에도 등록과 동일한 검증 규칙 적용, 삭제→확인 다이얼로그 없이 미진행/확정 시 즉시 제거, 빈 제목 등록 시 안내 문구, 삭제된 id 완료 처리/수정 시도 시 404 오류 문구가 모두 재현되는지 수동/E2E 확인 |
| 기능 2: 마감일 & 알림 | `TodoInput`(체크박스+기본값 자동채움)/`TodoEditDialog`(마감일 입력)/`DueDateBadge`/`DeadlineAlertBanner`/`useDeadlineStatus` + `validation.validateDueDate` | `src/components/TodoInput.tsx`, `src/components/TodoEditDialog.tsx`, `src/components/DueDateBadge.tsx`, `src/components/DeadlineAlertBanner.tsx`, `src/hooks/useDeadlineStatus.ts`, `src/lib/validation.ts` | 마감일 저장·표시, 24시간 이내 미완료 항목 "임박" 라벨+상단 배너 노출, 기한 초과 항목 "기한 초과" 표시, 과거 날짜 저장 차단 경고, 마감일 미설정 시 "마감일 없음"+알림 제외, 등록 폼에서 마감일 체크 시 입력란이 나타나며 현재 날짜/시각이 기본값으로 채워지는지가 모두 재현되는지 확인 |
| 기능 3: 카테고리 분류 (관리형 카테고리 선택) | `CategorySelect`(수정 전용, 다중)/`TodoInput`(네이티브 select, 단일)/`Sidebar`(필터+관리+순서변경) + `GET/POST/PATCH /api/categories` + `PATCH/DELETE /api/categories/[id]` + `categoryStore.readCategories/createCategory/updateCategory/deleteCategory/reorderCategories` + `todoStore.renameCategoryInTodos` + `validation.validateCategoryName/validateCategories` | `src/components/CategorySelect.tsx`, `src/components/TodoInput.tsx`, `src/components/Sidebar.tsx`, `src/hooks/useCategories.ts`, `src/lib/categoryStore.ts`, `src/lib/todoStore.ts`, `src/lib/category.ts`, `src/lib/validation.ts`, `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts` | 자유 텍스트 입력 없이 관리형 목록에서만 선택 가능, 등록 폼은 드롭다운으로 최대 1개·수정 폼은 체크박스로 최대 5개 선택되는지, 사이드바에서 카테고리 클릭 시 해당 항목만 노출(오탐/누락 0건), 사이드바 하단 입력창으로 등록 시 즉시 목록 반영, 카테고리 행에 마우스 오버/포커스 시에만 그립·수정·삭제 아이콘 노출(평소엔 텍스트만), 그립을 드래그해 순서를 바꾸면 즉시 반영되고 새로고침 후에도 유지되는지, 중복/미입력 이름 차단 문구, 6개 이상 선택 차단 문구(수정 폼), 미선택 시 "미분류" 자동 분류, 카테고리 이름 수정 시 기존 할 일 표시값도 함께 갱신, 카테고리 삭제 후 목록에서는 제거되되 기존 할 일 표시값은 유지되는지가 모두 재현되는지 확인 |
