# To Do — 팀 협업용 할 일 관리 앱

서버/DB 없이 로컬 File-based JSON으로 동작하는 팀 할 일 관리 앱입니다. Next.js App Router 기반으로 만들어졌으며, SDD(Spec-Driven Development) 워크플로우로 기획(PRD) → 설계(TECH_SPEC) → 구현 → 검증 과정을 거쳐 만들어졌습니다.

## 주요 기능

- **할 일 관리**: 목록에서 바로 추가/수정/완료/삭제 (수정은 새 창 없이 인라인으로, Enter로 즉시 저장)
- **완료 처리**: 큰 원형 토글 버튼 + 체크 모션 애니메이션 + "완료되었습니다" 토스트 알림
- **마감일**: 체크 시 현재 날짜/시각 기본값 자동 입력, 날짜(캘린더) + 오전/오후 + hh:mm 시간 입력, 24시간 이내 임박 알림 배너
- **카테고리**: 별도 관리되는 카테고리 목록에서만 선택(자유 태그 입력 아님), 좌측 사이드바에서 추가·이름수정·삭제·드래그 앤 드롭 순서변경
- **필터링**: 사이드바에서 카테고리 클릭으로 즉시 필터링
- **앱 이름 커스터마이징**: 헤더의 "To Do" 이름을 팀에서 자유롭게 변경 가능 (서버에 저장되어 팀 전체에 공유)
- **반응형**: PC에서는 좌측 고정 사이드바, 모바일(375px~)에서는 상단 가로 스크롤 바 — 모바일에서는 카테고리 수정/삭제/순서변경은 제공하지 않고 필터링만 지원

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui (@base-ui/react 기반) |
| State | React hooks + 커스텀 훅 (별도 상태관리 라이브러리 없음) |
| Storage | File-based JSON (`data/*.json`), 원자적 쓰기(atomic write) 적용 |

## 폴더 구조

```
inflearn-todo/
├── claudedocs/                    # SDD 산출물 (PRD, TECH_SPEC, 검증 리포트)
│   ├── PRD.md
│   ├── TECH_SPEC.md
│   └── REVIEW_REPORT.md
├── data/                          # 런타임 데이터 (git에는 커밋되지 않음)
│   ├── todos.json
│   ├── categories.json
│   └── settings.json
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── todos/             # GET/POST, [id] PATCH/DELETE
│   │   │   ├── categories/        # GET/POST/PATCH, [id] PATCH/DELETE
│   │   │   └── settings/          # GET/PATCH (앱 이름)
│   │   ├── layout.tsx
│   │   ├── page.tsx               # 메인 페이지 (헤더 + 사이드바 + 본문)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 기본 컴포넌트
│   │   ├── AppTitle.tsx           # 헤더의 인라인 편집 가능한 앱 이름
│   │   ├── CompleteToggle.tsx     # 완료 처리용 원형 토글 버튼
│   │   ├── Sidebar.tsx            # 카테고리 필터 + 관리 + 드래그 정렬
│   │   ├── TodoInput.tsx          # 할 일 등록 폼
│   │   ├── TodoItem.tsx           # 할 일 항목 (인라인 수정 포함)
│   │   ├── TodoList.tsx
│   │   ├── DeadlineAlertBanner.tsx
│   │   ├── DueDateBadge.tsx
│   │   ├── DeleteConfirmDialog.tsx
│   │   └── Toast.tsx
│   ├── hooks/                     # useTodos, useCategories, useAppSettings, useDeadlineStatus
│   ├── lib/                       # store(fs 읽기/쓰기), validation, 날짜/카테고리 유틸
│   └── types/                     # Todo, Category, AppSettings 타입 정의
├── .gitignore
├── package.json
└── README.md
```

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 데이터 저장 방식

이 앱은 서버/DB 없이 `data/` 폴더의 JSON 파일에 직접 읽고 씁니다. 팀원과 데이터를 공유하려면 프로젝트 폴더(또는 최소한 `data/` 폴더)를 공유 저장소에 두고 각자 `npm run dev`로 로컬 서버를 띄우면 됩니다.

- 동시 편집 충돌 방지를 위한 락(lock)이나 실시간 동기화는 지원하지 않습니다 (임시 파일 → rename 방식의 원자적 쓰기만 적용).
- `data/*.json`은 실제 팀/개인 데이터가 담기므로 `.gitignore`에 의해 저장소에 커밋되지 않습니다.

## 배포 (Vercel)

이 프로젝트는 표준 Next.js App Router 앱이라 Vercel에서 별도 설정 없이 바로 빌드/배포됩니다 (`vercel.json` 불필요, 환경변수도 현재는 필요 없음). GitHub 저장소를 Vercel에 Import하면 자동으로 인식됩니다.

> ⚠️ **알려진 제약사항 (배포 전 반드시 확인)**
>
> 현재 저장 방식(File-based JSON, `data/*.json`에 직접 `fs`로 읽고 쓰기)은 **Vercel의 서버리스 함수 환경과 호환되지 않습니다.** Vercel 함수는 요청마다 격리·재시작되는 임시 파일시스템이라(쓰기 가능 영역은 `/tmp`뿐), 배포 후에는:
>
> - 할 일/카테고리/앱 이름 **조회(GET)는 되지만, 추가·수정·삭제 등 쓰기 작업은 대부분 실패**합니다(파일시스템이 읽기 전용).
> - 설령 일시적으로 쓰기가 성공하더라도 다른 요청·다른 인스턴스에는 반영되지 않아 데이터가 안정적으로 유지되지 않습니다.
>
> 즉 지금 상태로 배포하면 **UI 확인용 데모**로는 쓸 수 있어도, 실제로 할 일을 추가/저장하는 용도로는 정상 동작하지 않습니다. 프로덕션에서 실제로 사용하려면 저장 계층을 Vercel과 호환되는 영속 저장소(예: Vercel Marketplace의 Postgres/Neon, 또는 KV)로 마이그레이션하는 작업이 별도로 필요합니다. (현재는 의도적으로 다음 작업으로 미뤄둔 상태입니다.)

## 프로젝트 문서

기획부터 검증까지의 전체 과정은 `claudedocs/` 폴더에 정리되어 있습니다.

- [`claudedocs/PRD.md`](./claudedocs/PRD.md) — 제품 요구사항 문서
- [`claudedocs/TECH_SPEC.md`](./claudedocs/TECH_SPEC.md) — 기술 명세서
- [`claudedocs/REVIEW_REPORT.md`](./claudedocs/REVIEW_REPORT.md) — 스펙 검증 리포트
