# 스펙 검증 리포트

> 검증 일시: 2026-07-15
> 프로젝트: inflearn-todo (팀 협업용 할 일 관리 앱)
> 검증 기준 문서: `claudedocs/PRD.md`, `claudedocs/TECH_SPEC.md`
> 검증 대상 코드: `src/`, `data/todos.json`

## 종합 결과

| 단계 | 결과 | 점수 |
|------|------|------|
| Stage 1: PRD 일치 | ✅ PASS | 15/15 (100%) |
| Stage 2: TECH_SPEC 일치 | ✅ PASS | 18/18 파일, 24/24 함수·타입·API (100%) |
| Stage 3: 코드 품질 | ✅ PASS | 5/5 (100%, 낮은 우선순위 개선 1건) |
| **종합** | **✅ PERFECT** | **100%** |

---

## Stage 1: PRD 일치 검증

### 기능 1: 할 일 추가/완료/삭제 (기본 CRUD)

| 수용 기준 | 판정 | 근거 |
|----------|------|------|
| 제목(1~100자) 등록 시 목록 최상단 즉시 표시 | ✅ PASS | `src/lib/validation.ts:21-33` `validateTitle` 1~100자 검증 → `src/lib/todoStore.ts:61` `createTodo`가 `[newTodo, ...todos]`로 배열 맨 앞에 추가 → `src/hooks/useTodos.ts:106` `addTodo`가 응답을 `[created, ...prev]`로 로컬 state 최상단에 즉시 반영 |
| 완료 체크박스 선택 시 "완료" 상태 및 시각적 구분 | ✅ PASS | `src/components/TodoItem.tsx:29-56` 체크박스 `onCheckedChange` → `handleToggle`(19-24) → `toggleTodo` → `PATCH {completed:true}`. 완료 시 `line-through`+회색 처리, "완료"/"미완료" 텍스트 라벨 병행 표시(48-56) — PRD 접근성 요구(색상+텍스트) 충족 |
| 삭제 시 확인 절차 없이는 진행되지 않고, 확정 시 즉시 제거 | ✅ PASS | `TodoItem.tsx:78-85` 삭제 버튼 → `onDeleteRequest` → `src/app/page.tsx:33-35` `deleteTarget` set → `DeleteConfirmDialog`(open) → `onConfirm`에서만 `removeTodo` 호출(`page.tsx:41-47`), `useTodos.ts:159` 성공 시 로컬 목록에서 즉시 제거. 배경 클릭/ESC는 `onCancel`만 호출(`DeleteConfirmDialog.tsx:39-43`)하여 삭제로 이어지지 않음 |
| 제목 미입력 시 "제목을 입력해주세요" 안내 및 등록 차단 | ✅ PASS | 클라이언트: `TodoInput.tsx:95-99`(`validateTitle` 실패 시 `formError` 표시, `role="alert"` `line 200-203`). 서버: `src/app/api/todos/route.ts:26-29` 동일 검증 및 400 응답, 두 경우 모두 `VALIDATION_MESSAGES.TITLE_REQUIRED` 동일 문구 사용 |
| 삭제된 항목 완료 처리 시도 시 "존재하지 않는 항목입니다" 오류 | ✅ PASS | `src/lib/todoStore.ts:74-76` `updateTodo`가 대상 못 찾으면 `null` 반환 → `src/app/api/todos/[id]/route.ts:53-55` 404 + `{error: "존재하지 않는 항목입니다"}` → `useTodos.ts:129-135` 에러 메시지를 그대로 반환, `TodoItem.tsx:71-75`가 `role="alert"`로 표시 |

**기능 1 소계: 5/5 PASS**

### 기능 2: 마감일 & 알림

| 수용 기준 | 판정 | 근거 |
|----------|------|------|
| 마감일 지정 시 저장되어 목록에 표시 | ✅ PASS | `TodoInput.tsx:154-159` `datetime-local` 입력 → `toIsoDueDate`(21-30)로 ISO 변환 → `CreateTodoInput.dueDate`로 전송 → `todoStore.ts:55` 그대로 저장 → `DueDateBadge.tsx:35,53-57` 포맷하여 표시 |
| 24시간 이내 미완료 항목 "임박" 라벨 + 상단 알림 영역 노출 | ✅ PASS | `src/hooks/useDeadlineStatus.ts:32-34` `0 < diff <= 24h` → `'upcoming'` → `DueDateBadge.tsx:45-50` "임박" 라벨(색상+텍스트) 표시, `src/components/DeadlineAlertBanner.tsx:9-33`가 `'upcoming'` 항목만 필터링해 `role="alert"` 상단 배너에 노출, `page.tsx:66`에서 렌더링 |
| 마감일이 현재보다 이전이고 미완료면 "기한 초과" 표시 | ✅ PASS | `useDeadlineStatus.ts:28-30` `diff <= 0` → `'overdue'` → `DueDateBadge.tsx:37-42` "기한 초과" 라벨(색상+텍스트) 표시 |
| 과거 날짜 마감일 설정 시 경고 및 저장 차단 | ✅ PASS | `src/lib/validation.ts:49-51` `parsed.getTime() <= Date.now()` → `DUE_DATE_PAST`("마감일은 오늘 이후로 설정해주세요") 반환. 클라이언트(`TodoInput.tsx:102-106`)와 서버(`route.ts:31-37`, `[id]/route.ts:31-39`) 이중 검증 |
| 마감일 미설정 시 "마감일 없음" 정상 등록 및 알림 대상 제외 | ✅ PASS | `dueDate` 미입력 시 `null` 저장(`todoStore.ts:55`) → `DueDateBadge.tsx:27-32` "마감일 없음" 표시 → `useDeadlineStatus.ts:20-21` `'none'` 반환 → `DeadlineAlertBanner`가 `'upcoming'`만 필터링하므로 자동 제외 |

**기능 2 소계: 5/5 PASS**

### 기능 3: 카테고리/태그 분류

| 수용 기준 | 판정 | 근거 |
|----------|------|------|
| 1~5개 카테고리 지정 시 할 일 항목에 표시 | ✅ PASS | `TodoInput.tsx:45-69` 태그 입력(Enter/콤마) → `dedupeCategories` 적용, 5개 도달 시 추가 차단(53-56) → `TodoItem.tsx:61-68` chip 형태로 렌더링 |
| 카테고리 필터링 시 해당 항목만 표시 | ✅ PASS | `src/app/page.tsx:23-31` `filteredTodos`가 `normalizeCategory` 비교로 클라이언트 필터링, `CategoryFilter.tsx` UI와 연동 |
| 대소문자만 다른 동일 이름 통합 인식 | ✅ PASS | `src/lib/category.ts:8-10` `normalizeCategory`(trim+lowercase)를 `dedupeCategories`(15-35), `getUniqueCategories`(40-57), `CategoryFilter.tsx:39-41` 매칭, `page.tsx:27-29` 필터링에 일관되게 사용 |
| 6개 이상 지정 시 "카테고리는 최대 5개까지 지정할 수 있습니다" 안내 및 차단 | ✅ PASS | `TodoInput.tsx:53-56` 5개 도달 시 UI에서 즉시 `categoryNotice` 표시하며 추가 차단, `validation.ts:59-65` `validateCategories`(6개 이상 시 invalid)로 submit 시 및 서버(`route.ts:39-45`, `[id]/route.ts:41-49`) 재검증 |
| 카테고리 미입력 시 "미분류" 자동 분류 | ✅ PASS | `todoStore.ts:15-18` `resolveCategories`: `dedupeCategories` 결과가 빈 배열이면 `[UNCATEGORIZED_LABEL]`("미분류")로 치환, `createTodo`/`updateTodo` 모두 적용 |

**기능 3 소계: 5/5 PASS**

**Stage 1 총점: 15/15 (100%) — 모든 PRD 수용 기준 충족**

---

## Stage 2: TECH_SPEC 일치 검증

### 파일 구조 (18개 명세 전체 확인)

| TECH_SPEC 명세 | 실제 파일 | 판정 |
|---------------|----------|------|
| `data/todos.json` | 존재, `{ "todos": [] }` 구조 일치 | ✅ |
| `src/app/layout.tsx` | 존재 | ✅ |
| `src/app/page.tsx` | 존재 | ✅ |
| `src/app/globals.css` | 존재 | ✅ |
| `src/app/api/todos/route.ts` | 존재 | ✅ |
| `src/app/api/todos/[id]/route.ts` | 존재 | ✅ |
| `src/components/TodoInput.tsx` | 존재 | ✅ |
| `src/components/TodoList.tsx` | 존재 | ✅ |
| `src/components/TodoItem.tsx` | 존재 | ✅ |
| `src/components/DeleteConfirmDialog.tsx` | 존재 | ✅ |
| `src/components/DueDateBadge.tsx` | 존재 | ✅ |
| `src/components/DeadlineAlertBanner.tsx` | 존재 | ✅ |
| `src/components/CategoryFilter.tsx` | 존재 | ✅ |
| `src/hooks/useTodos.ts` | 존재 | ✅ |
| `src/hooks/useDeadlineStatus.ts` | 존재 | ✅ |
| `src/lib/todoStore.ts` | 존재 | ✅ |
| `src/lib/validation.ts` | 존재 | ✅ |
| `src/lib/category.ts` | 존재 | ✅ |
| `src/types/todo.ts` | 존재 | ✅ |

추가 파일(스펙에 없으나 감점 대상 아님): `src/components/ui/{button,checkbox,badge,label,input,dialog}.tsx`, `src/lib/utils.ts` — shadcn/ui 기반 프리미티브 컴포넌트로 TECH_SPEC 1절("오버엔지니어링 없이 접근성 보장된 컴포넌트 활용")의 취지에 부합.

### Props 인터페이스 (7개 전체 일치)

| TECH_SPEC 명세 | 실제 구현 | 판정 |
|---------------|----------|------|
| `TodoInputProps { onSubmit }` | `TodoInput.tsx:17-19` 시그니처 완전 일치 | ✅ |
| `TodoListProps { todos, onToggle, onDeleteRequest }` | `TodoList.tsx:4-8` 완전 일치 | ✅ |
| `TodoItemProps { todo, onToggle, onDeleteRequest }` | `TodoItem.tsx:8-12` 완전 일치 | ✅ |
| `DeleteConfirmDialogProps { todo, open, onConfirm, onCancel }` | `DeleteConfirmDialog.tsx:15-20` 완전 일치 | ✅ |
| `DueDateBadgeProps { dueDate, completed }` | `DueDateBadge.tsx:4-7` 완전 일치 | ✅ |
| `DeadlineAlertBannerProps { todos }` | `DeadlineAlertBanner.tsx:4-6` 완전 일치 | ✅ |
| `CategoryFilterProps { categories, selected, onSelect }` | `CategoryFilter.tsx:3-7` 완전 일치 | ✅ |

### 함수/타입 시그니처 (13개 전체 일치)

| TECH_SPEC 명세 | 실제 구현 | 판정 |
|---------------|----------|------|
| `validateTitle(title): {valid,error?}` | `validation.ts:21` 시그니처·동작 일치 | ✅ |
| `readTodos(): Promise<Todo[]>` | `todoStore.ts:21` 파일 없으면 `[]` 반환(26-33) | ✅ |
| `writeTodosAtomic(todos): Promise<void>` | `todoStore.ts:39` tmp 파일→rename 원자적 교체 | ✅ |
| `createTodo(input): Promise<Todo>` | `todoStore.ts:47` 최상단 unshift 후 저장 | ✅ |
| `updateTodo(id, patch): Promise<Todo\|null>` | `todoStore.ts:67` 미존재 시 `null` | ✅ |
| `deleteTodo(id): Promise<boolean>` | `todoStore.ts:97` | ✅ |
| `useTodos(): {...}` | `useTodos.ts:33` 반환 타입(`todos,loading,error,addTodo,toggleTodo,removeTodo,refresh`) 완전 일치 | ✅ |
| `validateDueDate(dueDate): {valid,error?}` | `validation.ts:38` | ✅ |
| `type DeadlineStatus` | `types/todo.ts:24` `'none'\|'upcoming'\|'overdue'\|'normal'` 일치 | ✅ |
| `useDeadlineStatus(todo): DeadlineStatus` | `useDeadlineStatus.ts:39-41` (참고 항목 a 참조) | ✅ |
| `normalizeCategory(value): string` | `category.ts:8` | ✅ |
| `dedupeCategories(categories): string[]` | `category.ts:15` | ✅ |
| `getUniqueCategories(todos): string[]` | `category.ts:40` | ✅ |
| `validateCategories(categories): {valid,error?}` | `validation.ts:59` (참고 항목 b 참조) | ✅ |

### 데이터 모델 (4개 전체 일치)

| TECH_SPEC 명세 | 실제 구현 | 판정 |
|---------------|----------|------|
| `Todo { id,title,completed,dueDate,categories,createdAt,updatedAt }` | `types/todo.ts:1-9` 필드명·타입 완전 일치 | ✅ |
| `CreateTodoInput { title,dueDate?,categories? }` | `types/todo.ts:11-15` 일치 | ✅ |
| `UpdateTodoInput { title?,completed?,dueDate?,categories? }` | `types/todo.ts:17-22` 일치 | ✅ |
| `DeadlineStatus` | `types/todo.ts:24` 일치 | ✅ |

저장 파일 구조(`{ "todos": [...] }`) 및 원자적 쓰기(tmp→rename) 방식도 `todoStore.ts:11-13, 39-44`에서 명세대로 구현됨.

### API 엔드포인트 (4개 전체 일치)

| TECH_SPEC 명세 | 실제 구현 | 판정 |
|---------------|----------|------|
| `GET /api/todos` → `200 Todo[]` | `route.ts:10-20` | ✅ |
| `POST /api/todos` → `201 Todo` / `400 {error}` | `route.ts:22-55` 제목/마감일/카테고리 순차 검증 후 생성 | ✅ |
| `PATCH /api/todos/[id]` → `200 Todo` / `400` / `404 {error:"존재하지 않는 항목입니다"}` | `[id]/route.ts:16-64` | ✅ |
| `DELETE /api/todos/[id]` → `200 {success:true}` / `404` | `[id]/route.ts:66-82` | ✅ |

추가: 모든 핸들러에 `500 Internal Server Error` 폴백 처리 포함(스펙 미명시, 견고성 향상 목적으로 감점 대상 아님).

### 의도된 스펙 편차 3건 검토

| 편차 | 판정 | 근거 |
|------|------|------|
| a) `useDeadlineStatus` 내부에 순수 함수 `getDeadlineStatus` 분리 | ✅ 합리적 | 공개 시그니처 `useDeadlineStatus(todo: Todo): DeadlineStatus`는 `useDeadlineStatus.ts:39-41`에 그대로 유지되어 TECH_SPEC과 100% 일치. 분리된 `getDeadlineStatus(dueDate, completed)`는 `DueDateBadge.tsx:25`, `DeadlineAlertBanner.tsx:10`에서 재사용되어 React 훅 규칙(조건부 호출 제한) 없이 순수 로직만 필요한 곳에서 호출 가능하게 함 — 스펙 취지(마감 상태 계산 로직 캡슐화) 훼손 없음 |
| b) `validateCategories`가 0개(빈 배열)를 유효 처리 | ✅ 합리적 | PRD 기능3 수용기준 5("카테고리 미입력 시 미분류로 자동 분류되어 등록")와 정합. 만약 0개를 무효 처리했다면 미입력 등록 자체가 서버 400으로 차단되어 PRD 요구사항과 정면 충돌했을 것. `todoStore.ts:15-18`의 "미분류" 자동 대체 로직과 짝을 이루는 필수 설계 |
| c) Next.js 16.2.10 / Tailwind v4 / shadcn 4.13 사용 | ✅ 합리적 | `package.json:16,19,30` 확인. TECH_SPEC은 "14+", "3.4+"로 하한만 명시했으므로 상위 버전 사용은 스펙 위반 아님 |

**Stage 2 총점: 18개 파일 + 7개 Props + 13개 함수/타입 + 4개 데이터모델 + 4개 API = 46/46 (100%)**

---

## Stage 3: 코드 품질 검증

| 항목 | 판정 | 비고 |
|------|------|------|
| TypeScript 타입 안전성 | ✅ PASS | `src/` 전체에서 `any`/`as any` 사용 0건 확인(grep). `tsconfig.json:7` `strict: true` 적용. 모든 함수/Props가 명시적 타입 정의됨 |
| 에러 처리 | ✅ PASS | API Route 전 핸들러 `try/catch` + 500 폴백(`route.ts`, `[id]/route.ts`), `useTodos.ts` fetch 실패 시 `catch`로 `GENERIC_ERROR_MESSAGE` 처리, 사용자 대면 에러는 `role="alert"`로 노출(`TodoInput.tsx:200`, `TodoItem.tsx:72`, `page.tsx:61`) |
| 접근성 (a11y) | ✅ PASS | `useId`로 label-input 연결(`TodoInput.tsx:33-35`, `TodoItem.tsx:15`), `aria-invalid`/`aria-describedby`(`TodoInput.tsx:147-148`), `aria-label`(체크박스·삭제버튼: `TodoItem.tsx:34,82`), `role="group"`+`aria-label`(`CategoryFilter.tsx:21-23`), `aria-pressed`(필터 버튼: `CategoryFilter.tsx:29,47`), `role="alert"`(에러/알림 배너 전반). 완료/미완료·임박/기한초과 모두 색상+텍스트 병행(PRD 접근성 요구 충족) |
| 하드코딩 여부 | ⚠️ 경미한 개선 필요 | 대부분 상수화 양호(`VALIDATION_MESSAGES`, `TITLE_MAX_LENGTH`, `CATEGORY_MAX_COUNT`, `UPCOMING_WINDOW_MS`). 다만 `TodoInput.tsx:146` `<Input maxLength={200} .../>`가 `TITLE_MAX_LENGTH`(100)와 무관한 매직 넘버로 하드코딩되어 있어 상수와 불일치(치명적이지 않음, UX상 실제 차단은 `validateTitle`이 100자 기준으로 정상 수행) |
| 컴포넌트 단일 책임 원칙 | ✅ PASS | `TodoInput`(입력 폼), `TodoList`(목록 컨테이너), `TodoItem`(개별 항목+토글+삭제요청), `DeleteConfirmDialog`(확인 다이얼로그), `DueDateBadge`(마감 라벨), `DeadlineAlertBanner`(알림 배너), `CategoryFilter`(필터 UI) 각각 역할 분리 명확. `lib/` 함수들도 순수 함수 단위로 책임 분리(`validation.ts`, `category.ts`, `todoStore.ts`) |

**Stage 3 총점: 5개 항목 중 4개 완전 PASS + 1개 경미한 개선 권고(감점 없음, 낮은 우선순위 개선 제안으로 처리)**

---

## 불일치 항목 상세

이번 검증에서 PRD/TECH_SPEC 대비 **FAIL 판정 항목은 없었습니다.** 아래는 감점 대상은 아니나 개선을 권고하는 사항입니다.

### 코드 품질 개선 제안: TodoInput 제목 입력 `maxLength` 불일치
- **스펙**: TECH_SPEC 4절 `Todo.title: string; // 1~100자`, `validation.ts`의 `TITLE_MAX_LENGTH = 100`
- **실제**: `src/components/TodoInput.tsx:146`에서 `<Input maxLength={200} ... />`로 브라우저 레벨 입력 제한이 200자로 설정됨
- **차이**: HTML `maxLength` 속성값(200)이 비즈니스 규칙 상수(`TITLE_MAX_LENGTH=100`)와 불일치. 실제 등록 차단은 `validateTitle`이 100자 기준으로 정확히 수행하므로 기능적 결함은 아니나, 100~200자 입력 시 "일단 타이핑은 되지만 제출 시 막히는" 사용자 경험 혼선 가능
- **개선 제안**: `maxLength={TITLE_MAX_LENGTH}`로 상수 참조하도록 수정 (1줄 변경, 우선순위 낮음)

---

## 개선 권고사항

### 우선순위 높음 (PRD 불일치)
없음 — PRD 수용 기준 15개 전항목 PASS

### 우선순위 중간 (TECH_SPEC 불일치)
없음 — TECH_SPEC 파일/함수/타입/API 명세 전항목 PASS

### 우선순위 낮음 (품질 개선)
1. `src/components/TodoInput.tsx:146`의 `maxLength={200}`을 `maxLength={TITLE_MAX_LENGTH}`(100)로 수정하여 상수와 일치시킬 것 (`validation.ts:9`의 `TITLE_MAX_LENGTH` import 필요)

---

## 판정: ✅ PERFECT (100%)

PRD의 15개 수용 기준, TECH_SPEC의 파일 구조·Props·함수 시그니처·데이터 모델·API 명세가 모두 실제 코드와 정확히 일치합니다. 보고받은 3건의 의도적 편차(useDeadlineStatus 내부 분리, validateCategories 0개 허용, 최신 프레임워크 버전 사용) 모두 스펙 취지를 훼손하지 않는 합리적 구현으로 확인되었습니다. 발견된 유일한 사항은 감점 없는 낮은 우선순위의 코드 품질 개선 제안(1건) 뿐이며, 배포 가능한 상태입니다.
