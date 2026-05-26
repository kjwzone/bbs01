# validation-report.md

## 1. 개요

| 항목 | 내용 |
|---|---|
| 기준 문서 | docs/test-plan.md, docs/prd.md, docs/rdb-design.md |
| 최종 갱신 | 2026-05-26 |
| 환경 | Cloud Supabase (`zbwonlldqnayfwhksnwi`), Next.js 15.5.18, Vercel Production |
| Production URL | https://bbs01-chi.vercel.app |
| GitHub | https://github.com/kjwzone/bbs01 |
| 검증 방법 | Vitest, `npm run build`, `scripts/validate-api.mjs`, Supabase MCP, HTTP 확인 |

## 2. 자동 검증 요약

| 구분 | 결과 | Evidence |
|---|---|---|
| `npm test` (Vitest) | **Pass** (8/8) | `lib/posts/validation.test.ts`, `lib/supabase/safe-fetch.test.ts`, `lib/supabase/env.test.ts` |
| `npm run build` | **Pass** | 8 routes, middleware 90.6 kB |
| `node scripts/validate-api.mjs` | **부분 Pass** (4/7) | 비회원·RLS 차단 확인; 자동 signup은 `@example.com` 거부 |
| Supabase MCP `list_tables` | **Pass** | `profiles` RLS on (1 row), `posts` RLS on (4 rows) |
| Vercel `/login` HTTP | **Pass** | `GET https://bbs01-chi.vercel.app/login` → 200 |

## 3. 인프라·배포 검증

| 항목 | Result | Evidence |
|---|---|---|
| Cloud migration | **Pass** | `initial_schema` — `profiles`, `posts`, RLS, 트리거 |
| Vercel Production 배포 | **Pass** | Alias `bbs01-chi.vercel.app`, 배포 ID `dpl_7Y3wWZq7uXJuhZ6JmMoM5CR5StEj` |
| Vercel env (Production) | **Pass** | `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SITE_URL` |
| Vercel env (Development) | **Pass** | 동일 3변수 추가 (2026-05-26) |
| GitHub push | **Pass** | `main` — https://github.com/kjwzone/bbs01 |
| `service_role` 미노출 | **Pass** | 클라이언트·문서 모두 anon key만 사용 |

## 4. test-plan.md 결과 상세

### 4.1 성공해야 하는 테스트

| Test ID | Result | Evidence | Failure Cause | Fix | Retest |
|---|---|---|---|---|---|
| AUTH-001 | **Pending** | API: `example.com` 이메일 invalid | Supabase가 테스트 도메인 거부 | 실제 이메일로 `/signup` 수동 검증 | — |
| AUTH-002 | **Pending** | 수동 UI | 자동화·전체 E2E 미완 | Production `/login` 수동 | — |
| AUTH-003 | **Pending** | 수동 UI | — | 로그인 후 헤더 로그아웃 | — |
| POST-001 | **Pass** | API anon SELECT; `/` 목록 UI (로컬·Vercel) | — | — | Pass |
| POST-002 | **Pending** | 로그인 세션 필요 | — | `/posts/new` 수동 | — |
| POST-003 | **Pending** | — | — | 본인 글 수정 | — |
| POST-004 | **Pending** | — | — | 본인 글 삭제 | — |
| DEPLOY-001 | **Pass** | `GET https://bbs01-chi.vercel.app` 200 | — | — | Pass |
| DEPLOY-002 | **Pending** | — | — | Vercel 로그인 후 글 작성 | — |

**참고:** Supabase Auth 로그에 `petezone@naver.com` 회원가입·`/token` 로그인 **200** 기록 있음 (로컬 `http://localhost:3000`, 2026-05-26). 실제 계정 기반 E2E는 수동 확인 권장.

### 4.2 실패해야 정상인 테스트 (RLS·제약)

| Test ID | Result | Evidence | Failure Cause | Fix | Retest |
|---|---|---|---|---|---|
| RLS-001 | **Pass** | API: RLS policy violation on INSERT | — | — | Pass |
| RLS-002 | **Pending** | 2계정 세션 필요 | — | userB로 userA 글 수정 | — |
| RLS-003 | **Pending** | 동일 | — | userB로 userA 글 삭제 | — |
| RLS-004 | **Pass** | anon UPDATE 0 rows | — | — | Pass |
| RLS-005 | **Pass** | anon DELETE 0 rows | — | — | Pass |
| DATA-001 | **Pass** (앱) | Vitest `validatePostInput` | — | UI 폼 validation | Pass |
| DATA-002 | **Pass** (앱) | Vitest | — | — | Pass |

### 4.3 데이터 무결성·프로필

| Test ID | Result | Evidence |
|---|---|---|
| DATA-003 | **Pass** | `author_id NOT NULL` + RLS INSERT |
| DATA-004 | **Pass** | FK `posts.author_id → profiles.id` |
| PROFILE-001 | **Pass** | `profiles` 1 row, `handle_new_user` 트리거 |

## 5. 구현·버그 수정 이력 (검증 관련)

| 일자 | 이슈 | 조치 | 검증 |
|---|---|---|---|
| 2026-05-26 | fetch 헤더 non ISO-8859-1 | `lib/supabase/safe-fetch.ts` | Vitest Pass |
| 2026-05-26 | 로그인 `처리 중` 무한 대기 | Auth lock 비활성화, middleware 조건부 `getUser`, `window.location.assign` | 코드·배포 |
| 2026-05-26 | `Missing NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/project.ts` URL fallback, Vercel env 전 환경 | 빌드·배포 |

## 6. API 자동 검증 로그 (최종 실행)

```
PASS POST-001: anon SELECT posts OK
PASS RLS-001: new row violates row-level security policy for table "posts"
PASS RLS-004: updated rows=0, title unchanged
PASS RLS-005: deleted rows=0
FAIL AUTH-001: Email address "usera+...@example.com" is invalid
```

재실행: `node scripts/validate-api.mjs`

## 7. 빌드·라우트 Evidence

```
Route (app)
┌ ƒ /
├ ƒ /login
├ ƒ /signup
├ ƒ /posts/new
├ ƒ /posts/[id]/edit
└ ƒ /auth/callback
```

## 8. 보안 체크

| 항목 | Result |
|---|---|
| RLS `profiles` / `posts` 활성화 | **Pass** |
| `service_role` 클라이언트 미사용 | **Pass** |
| RLS 우회 없음 (anon + 정책) | **Pass** |
| Destructive SQL 없음 | **Pass** |

## 9. 수동 재검증 체크리스트 (미완 항목)

Production https://bbs01-chi.vercel.app 또는 `npm run dev`:

| 순서 | Test ID | 절차 |
|---|---|---|
| 1 | AUTH-001 | 실제 이메일로 `/signup` |
| 2 | AUTH-002 | `/login` → 홈에서 이메일·글쓰기 표시 |
| 3 | AUTH-003 | 로그아웃 |
| 4 | POST-002~004 | 작성·수정·삭제 |
| 5 | RLS-001~005 | 비회원·타인 계정 차단 |
| 6 | DEPLOY-002 | Vercel에서 로그인 후 글 작성 |

**Supabase Dashboard:** Authentication → URL Configuration에 `https://bbs01-chi.vercel.app` 및 `/auth/callback` 등록 확인.

## 10. 종합 판정

| 영역 | 판정 |
|---|---|
| DB·RLS (비회원) | **Pass** |
| 단위·빌드 테스트 | **Pass** (8/8) |
| Vercel 배포·목록 조회 | **Pass** |
| Auth·CRUD E2E | **Pending** — 수동 검증 필요 |
| 자동 API Auth | **Skip** — `@example.com` 사용 불가 |

**결론:** 실습 MVP 기준 **인프라·RLS·배포·빌드는 충족**. test-plan 전체 **Pass**를 위해 §9 수동 체크리스트를 실제 이메일 계정으로 완료하면 됩니다.
