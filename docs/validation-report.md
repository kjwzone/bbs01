# validation-report.md

## 1. 개요

| 항목 | 내용 |
|---|---|
| 기준 문서 | docs/test-plan.md, docs/prd.md, docs/rdb-design.md |
| 검증 일시 | 2026-05-26 |
| 환경 | Cloud Supabase (`zbwonlldqnayfwhksnwi`), 로컬 Next.js 15.5.18 |
| Vercel 배포 | **완료** — https://bbs01-chi.vercel.app |
| 검증자 | Cursor Agent + 자동 스크립트 + 빌드/단위 테스트 |

## 2. 자동 검증 요약

| 구분 | 결과 | Evidence |
|---|---|---|
| `npm test` (Vitest) | **Pass** (6/6) | `lib/posts/validation.test.ts` |
| `npm run build` | **Pass** | Next.js production build 성공, 8 routes |
| `node scripts/validate-api.mjs` | **부분 Pass** (4/7) | anon·RLS API; Auth는 rate limit으로 스킵 |
| Supabase MCP `list_tables` | **Pass** | `profiles` RLS on (1 row), `posts` RLS on (2 rows) |

## 3. 테스트 결과 상세

### 3.1 성공해야 하는 테스트

| Test ID | Result | Evidence | Failure Cause | Fix | Retest |
|---|---|---|---|---|---|
| AUTH-001 | **Pending** | `scripts/validate-api.mjs`: `email rate limit exceeded` | Supabase Auth 이메일 가입 rate limit | Dashboard에서 rate limit 해소 후 `/signup` 수동 재검증 | — |
| AUTH-002 | **Pending** | AUTH-001에 종속 | 동일 | `/login` 수동 재검증 | — |
| AUTH-003 | **Pending** | UI 수동 미실행 (로그아웃 버튼) | 자동화 스크립트 미포함 | `npm run dev` → 헤더 로그아웃 | — |
| POST-001 | **Pass** | API: anon `SELECT posts` OK; `/` Server Component 목록 | — | — | Pass |
| POST-002 | **Pending** | API: AUTH-001 실패로 insert 미실행 | rate limit | 로그인 후 `/posts/new` 작성 | — |
| POST-003 | **Pending** | UI/API 미실행 | rate limit | 본인 글 `/posts/[id]/edit` | — |
| POST-004 | **Pending** | UI/API 미실행 | rate limit | 본인 글 삭제 버튼 | — |
| DEPLOY-001 | **Pass** | `GET https://bbs01-chi.vercel.app` 200, 게시판 UI | — | — | Pass |
| DEPLOY-002 | **Pending** | 프로덕션 URL에서 Auth·작성 수동 확인 필요 | — | 로그인 후 글 작성 | — |

### 3.2 실패해야 정상인 테스트 (RLS·제약)

| Test ID | Result | Evidence | Failure Cause | Fix | Retest |
|---|---|---|---|---|---|
| RLS-001 | **Pass** | API: `new row violates row-level security policy for table "posts"` | — | — | Pass |
| RLS-002 | **Pending** | userA/userB 세션 필요 | Auth rate limit | B 계정으로 A 글 수정 시도 | — |
| RLS-003 | **Pending** | 동일 | Auth rate limit | B 계정으로 A 글 삭제 시도 | — |
| RLS-004 | **Pass** | API: anon UPDATE 0 rows, title unchanged | — | — | Pass |
| RLS-005 | **Pass** | API: anon DELETE 0 rows | — | — | Pass |
| DATA-001 | **Pass** (앱) | Vitest: 빈 제목 → `validatePostInput` 오류 | — | UI 폼에서도 차단 | Pass (unit) |
| DATA-001 | **Pending** (DB) | API insert 빈 title 미실행 | Auth rate limit | DB NOT NULL 추가 확인 가능 | — |
| DATA-002 | **Pass** (앱) | Vitest: 빈 내용 → validation 오류 | — | — | Pass (unit) |
| DATA-002 | **Pending** (DB) | API 미실행 | Auth rate limit | — | — |

### 3.3 데이터 무결성 (test-plan §6)

| Test ID | Result | Evidence | 비고 |
|---|---|---|---|
| DATA-003 | **Pass** (설계) | `posts.author_id NOT NULL` + RLS INSERT `auth.uid() = author_id` | migration 적용됨 |
| DATA-004 | **Pass** (설계) | FK `posts.author_id → profiles.id` | migration 적용됨 |
| PROFILE-001 | **Pass** (DB) | MCP: `profiles` 1 row, trigger `handle_new_user` 존재 | 기존 가입 사용자 1명 추정 |

## 4. API 자동 검증 로그 (2026-05-26)

```
PASS POST-001: anon SELECT posts OK
PASS RLS-001: new row violates row-level security policy for table "posts"
PASS RLS-004: updated rows=0, title unchanged
PASS RLS-005: deleted rows=0
FAIL AUTH-001: signup A: email rate limit exceeded
```

재실행: `node scripts/validate-api.mjs`

## 5. 빌드·라우트 Evidence

```
Route (app)
┌ ƒ /
├ ƒ /login
├ ƒ /signup
├ ƒ /posts/new
├ ƒ /posts/[id]/edit
└ ƒ /auth/callback
```

## 6. 보안 체크

| 항목 | Result | Evidence |
|---|---|---|
| `service_role` 클라이언트 미사용 | **Pass** | `lib/supabase/*` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 참조 |
| RLS 우회 없음 | **Pass** | 클라이언트 `createBrowserClient` + 정책 기반 CRUD |
| Destructive SQL 미실행 | **Pass** | migration은 CREATE·정책만 |

## 7. 수동 재검증 체크리스트 (권장)

Auth rate limit 해소 후 `npm run dev` (http://localhost:3000):

| 순서 | Test ID | 절차 |
|---|---|---|
| 1 | AUTH-001 | `/signup` — `userA@example.com` / `userB@example.com` (test-plan §3) |
| 2 | AUTH-002 | `/login` |
| 3 | POST-002 | `/posts/new` 글 작성 |
| 4 | POST-003 | 본인 글 수정 |
| 5 | POST-004 | 본인 글 삭제 |
| 6 | RLS-001 | 로그아웃 후 글쓰기 → 실패 |
| 7 | RLS-002~003 | B로 A 글 수정/삭제 → 실패 |
| 8 | AUTH-003 | 로그아웃 |
| 9 | DEPLOY-001~002 | Vercel 배포 URL 동일 시나리오 |

## 8. 종합 판정

| 영역 | 판정 |
|---|---|
| DB 스키마·RLS (비회원) | **Pass** — 목록 조회·비회원 쓰기/수정/삭제 차단 확인 |
| 앱 validation | **Pass** — Vitest 6건 |
| 프로덕션 빌드 | **Pass** |
| Auth·작성자 CRUD (E2E) | **Pending** — Supabase Auth rate limit + 수동 UI 미완 |
| Vercel 배포 | **Pass** (URL 배포·빌드 성공; Auth E2E는 Pending) |

**다음 조치:** (1) Auth rate limit 대기 또는 Dashboard 확인 (2) §7 수동 체크리스트 실행 (3) Vercel 배포 후 DEPLOY-* 재기록.
