# 작업 기록 (append-only)

## 2026-07-18 — 웹 배포 준비: 인증 + Blob 저장소 도입

**목표**: DB 서버를 직접 운영하지 않고 누구나 Google 로그인으로 접속해 개인별 할일을 관리할 수 있게 배포 준비.

**완료한 것**:
- next-auth@beta(Auth.js v5) + Google OAuth 로그인 설치·설정
  - `src/lib/auth.ts`, `src/app/login/page.tsx`, `src/components/UserMenu.tsx`
  - 로그인 게이트: `src/proxy.ts` (Next.js 16 컨벤션 — `middleware.ts` 아님)
- `src/lib/todoStore.ts` / `categoryStore.ts` / `settingsStore.ts`를 로컬 `fs` 기반에서 Vercel Blob 기반으로 전면 교체
  - 공통 헬퍼 `src/lib/blobJsonStore.ts` 신설
  - 모든 스토어 함수가 `userId`를 받아 `todos/{userId}.json` 형태로 사용자별 분리 저장
- 5개 API 라우트(`todos`, `todos/[id]`, `categories`, `categories/[id]`, `settings`)에 `requireUserId()` 세션 검증 추가 (미로그인 시 401)
- 로컬에서 `npm run dev`로 실제 Google 로그인 성공까지 확인함

**막힌 것 / 다음에 이어갈 것**:
- `BLOB_READ_WRITE_TOKEN` 미발급 — Vercel CLI 로그인이 2FA 문제로 안 돼서, 웹 대시보드(GitHub 로그인)로 Blob 스토어를 생성해야 함. 이 세션에서는 시간상 보류.
- 토큰 없이 로그인만 확인했고, 할일 CRUD(추가/수정/삭제)는 500 에러 상태로 미검증. 토큰 발급 후 반드시 재확인 필요.
- 자세한 다음 단계는 `tasks/todo.md`의 "재개 시 다음 행동" 참고.

**트러블슈팅 기록 (재발 방지)**:
- Auth.js v5는 `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` 환경변수 이름만 인식함 (v4의 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`는 무시됨) — 이름을 잘못 써서 "invalid_client" 에러가 났었고, 이름을 바꾸자 즉시 해결됨.
- Next.js 16에서 `middleware.ts`는 deprecated. `proxy.ts`로 이름과 export명을 모두 바꿔야 함.
