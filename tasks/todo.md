# 할일 관리 앱 웹 배포 — 작업 계획

> 목표: DB 서버를 직접 운영하지 않고, 누구나 Google 로그인으로 접속해
> **각자의 할일을 개인적으로** 관리할 수 있는 웹 앱으로 배포한다.

## 결정된 방향

- **저장소**: Vercel Blob (서버리스 함수는 로컬 파일시스템에 쓸 수 없어서, 클라우드가 관리하는 Blob으로 교체)
- **인증**: NextAuth.js(Auth.js) + Google OAuth 로그인 (비밀번호 직접 관리 안 함)
- **데이터 분리**: 사용자별로 `todos/{userId}.json`, `categories/{userId}.json`, `settings/{userId}.json`으로 분리 저장

## 체크리스트

### 1단계 — 준비 (사전 확인)
- [x] Google Cloud Console에서 OAuth 클라이언트 ID/Secret 발급 (완료)
- [ ] Vercel 계정 및 프로젝트 연결 확인 (`vercel` CLI 로그인 여부) — **CLI 2FA 문제로 보류**
- [ ] Vercel Blob 스토어 생성 (Vercel 대시보드에서 생성 → `BLOB_READ_WRITE_TOKEN` 발급) — **보류, 다음 세션에서 진행**
- [x] `.env.local`에 값 채우기 (실제 값은 마스킹해서 다룸)
  - `AUTH_GOOGLE_ID` ✅ (주의: `GOOGLE_CLIENT_ID` 아님! Auth.js v5는 `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` 이름만 인식)
  - `AUTH_GOOGLE_SECRET` ✅
  - `AUTH_SECRET` ✅ (자동 생성해서 채움)
  - `BLOB_READ_WRITE_TOKEN` ❌ 미발급 — Vercel Blob 스토어 생성 필요

### 2단계 — 인증 추가 (완료)
- [x] `next-auth@beta`(Auth.js v5) 설치
- [x] Google Provider 설정 (`src/lib/auth.ts`)
- [x] 로그인/로그아웃 UI 추가 (`src/app/login/page.tsx`, `src/components/UserMenu.tsx`)
- [x] 로그인하지 않은 사용자는 앱 접근 차단 (`src/proxy.ts` — Next.js 16은 `middleware.ts`가 아니라 `proxy.ts` 사용, export명도 `proxy`)
- [x] API 라우트에서 세션 확인 로직 추가 (`src/lib/requireUserId.ts`, 미로그인 시 401 JSON 응답)
- [x] 로컬에서 로그인 흐름 실제 확인 완료 (Google 로그인 → 콜백 → 세션 생성까지 정상 동작)

### 3단계 — 저장소를 Vercel Blob으로 교체 (코드 완료, 실동작 미확인)
- [x] `@vercel/blob` 패키지 설치
- [x] `src/lib/blobJsonStore.ts` 공통 헬퍼 작성 (`readJson`/`writeJson`, access: private, allowOverwrite: true, addRandomSuffix: false)
- [x] `src/lib/todoStore.ts`: `fs` → Blob으로 교체, 모든 함수가 `userId`를 받아 `todos/{userId}.json` 경로 사용
- [x] `src/lib/categoryStore.ts`: 동일하게 `categories/{userId}.json`
- [x] `src/lib/settingsStore.ts`: 동일하게 `settings/{userId}.json`
- [x] 모든 API 라우트(`src/app/api/todos`, `/categories`, `/settings`)에서 `requireUserId()`로 세션 확인 후 `userId` 전달
- [ ] **실제 Blob 토�큰 없이는 CRUD 동작 미검증** — `BLOB_READ_WRITE_TOKEN` 발급 후 재확인 필요 (500 에러 확인됨, 원인은 토큰 없음으로 특정됨)

### 4단계 — 로컬 동작 확인 (부분 완료)
- [x] `npm run dev`로 로컬에서 Google 로그인 성공 확인
- [ ] 할일 추가/수정/삭제 → 새로고침 후에도 유지되는지 확인 — **Blob 토큰 없어서 보류 (현재 500 에러)**
- [ ] 두 개의 다른 Google 계정으로 로그인해서 데이터가 서로 분리되는지 확인 — 보류

### 5단계 — Vercel 배포
- [ ] Vercel 프로젝트에 환경변수 등록 (Google Client ID/Secret, AUTH_SECRET, Blob 토큰)
- [ ] 배포 후 실제 배포 URL에서 로그인 → CRUD 동작 확인
- [ ] Google OAuth 콘솔에 배포 URL을 승인된 리다이렉트 URI로 등록

### 6단계 — 마무리
- [ ] `claudedocs/PRD.md`의 "클라우드 배포 미지원" 항목을 "배포 완료"로 갱신
- [ ] `tasks/progress.md`에 작업 요약 기록

## 확인 완료 사항 (2026-07-18 기준)

1. **Google Cloud Console OAuth 발급**: 안내 완료, 사용자가 직접 진행 예정.
   - 절차: Cloud Console 프로젝트 생성 → OAuth 동의 화면(External) 설정 → 사용자 인증 정보에서 OAuth 클라이언트 ID(웹 애플리케이션) 생성
   - 리디렉션 URI 등록 필요: `http://localhost:3000/api/auth/callback/google` (로컬) + 실제 배포 도메인 확정 후 `https://<도메인>/api/auth/callback/google` 추가
   - 발급되는 값: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` → `.env.local`에만 저장, 화면에 노출 금지
2. **Vercel 로그인 이슈**: CLI(`vercel login`) 로그인이 안 되는 상황. 네트워크 문제로 추정, 아직 미해결.
   - 대안 안내함: (a) Vercel 웹 대시보드(vercel.com)에서 GitHub 계정으로 로그인 후 "Add New Project"로 GitHub 저장소 import — CLI 불필요, (b) `vercel login --github` 또는 `--google`로 OAuth 방식 재시도
   - **다음 세션에서 확인할 것**: 이 저장소가 GitHub 원격에 연결되어 있는지 확인 필요 (웹 대시보드 경로를 쓰려면 GitHub push가 되어 있어야 함)
3. **기존 로컬 데이터(`data/todos.json`)**: 삭제해도 된다고 확인받음. 마이그레이션 불필요 — 실제 삭제는 네트워크 안정 후, 3단계(저장소 교체) 작업 시점에 함께 처리.

## 재개 시 다음 행동 (2026-07-18 갱신, 2차)

**막힌 지점**: `BLOB_READ_WRITE_TOKEN`이 없어서 3~4단계가 멈춰있음. Vercel CLI 로그인이 2FA 문제로 안 되는 상황이라, 웹 대시보드(vercel.com, GitHub 로그인)에서 진행해야 함 — 이 세션에서는 사용자가 "지금은 어려움"이라고 해서 보류.

**다음 세션 시작 시 할 일 (순서대로)**:
1. vercel.com 접속 → "Continue with GitHub" 로그인 가능한지 확인
2. 가능하면: Storage 탭 → Create → Blob 선택 → 스토어 생성 → `BLOB_READ_WRITE_TOKEN` 확인
3. 발급받은 토큰을 `.env.local`에 추가: `! echo 'BLOB_READ_WRITE_TOKEN=...' >> .env.local` (사용자가 직접, `!` 접두사로)
4. `npm run dev` 재시작 (Next.js는 .env.local 변경 시 자동 재시작 안 함 — 반드시 수동 재시작 필요)
5. 로그인 → 할일 추가/수정/삭제 → 새로고침 유지 확인
6. 다른 Google 계정으로 로그인해서 데이터 분리 확인
7. 이후 5단계(Vercel 배포)로 진행 — GitHub 원격 저장소 이미 연결됨(`https://github.com/picky-teamevople/inflearn-todo.git`), Add New Project로 import 가능

**이번 세션에서 해결한 이슈들 (재발 방지용 기록)**:
- Next.js 16은 `src/middleware.ts`가 deprecated — `src/proxy.ts`로 파일명 변경, export도 `middleware`가 아니라 `proxy`라는 이름으로 해야 함. 두 파일이 동시에 있으면 빌드 에러(E900) 남.
- **Auth.js v5(next-auth@beta)는 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`를 인식하지 않음.** 반드시 `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`라는 이름을 써야 함 (v4 컨벤션과 다름). 이걸 몰라서 "OAuth client was not found / invalid_client" 에러가 났었음 — 원인은 값이 아니라 환경변수 이름이었음.
- `.env.local`에 이미 `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`는 채워져 있고 정상 동작 확인됨(로그인 성공). `BLOB_READ_WRITE_TOKEN`만 비어있음.
- Vercel Blob `put()`은 기본적으로 랜덤 접미사를 붙이므로, 같은 사용자 파일을 계속 덮어써야 하는 이 앱 구조에서는 `addRandomSuffix: false, allowOverwrite: true` 옵션이 필수 (이미 `src/lib/blobJsonStore.ts`에 반영됨).
