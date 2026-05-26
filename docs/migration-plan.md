# migration-plan.md

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 목적 | Cloud Supabase에 적용할 스키마·RLS·트리거 변경 계획 |
| 기준 문서 | AGENTS.md, docs/prd.md, docs/test-plan.md, docs/rdb-design.md |
| 대상 프로젝트 | `zbwonlldqnayfwhksnwi` |
| 적용 파일 | `supabase/migrations/20260526000000_initial_schema.sql` |
| 작성일 | 2026-05-26 |

## 2. 현재 DB 상태 (Supabase MCP)

| 항목 | 결과 |
|---|---|
| API URL | `https://zbwonlldqnayfwhksnwi.supabase.co` |
| `public` 테이블 | 없음 (`profiles`, `posts` 미존재) |
| Cloud migration 이력 | 0건 |
| 로컬 migration | `.gitkeep`만 존재 |
| Storage bucket | 0개 (설계와 일치) |

**결론:** greenfield — 기존 애플리케이션 스키마와 충돌 없음. 신규 CREATE만 수행.

## 3. 설계 대비 차이·결정 사항

| 항목 | rdb-design.md | 본 계획 결정 |
|---|---|---|
| 프로필 자동 생성 | trigger 또는 앱 로직 | **Auth 트리거** (`on_auth_user_created`) — FK·RLS 일관성, 앱 로직 단순화 |
| profiles SELECT | 공개 또는 로그인 | **공개** (`USING (true)`) — POST-001·표시명 노출에 유리 |
| profiles DELETE | 제외 권장 | **정책 없음** (DELETE 불가) |
| posts.id | bigint identity | `bigint generated always as identity` |
| auth.users 삭제 시 profiles | cascade/restrict 확인 | **ON DELETE CASCADE** — 고아 프로필 방지 |
| posts.author_id 삭제 시 | restrict 권장 | **ON DELETE RESTRICT** |
| `rls_auto_enable()` | 미기재 | **미변경** — 기존 함수 유지, migration에서 건드리지 않음 |

## 4. 생성 대상

### 4.1 테이블 `public.profiles`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| email | text | nullable |
| display_name | text | nullable |
| created_at | timestamptz | NOT NULL, default `now()` |
| updated_at | timestamptz | NOT NULL, default `now()` |

### 4.2 테이블 `public.posts`

| Column | Type | Constraints |
|---|---|---|
| id | bigint | PK, identity |
| author_id | uuid | NOT NULL, FK → `profiles(id)` ON DELETE RESTRICT |
| title | text | NOT NULL |
| content | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default `now()` |
| updated_at | timestamptz | NOT NULL, default `now()` |

### 4.3 인덱스

| Index | Columns | 목적 |
|---|---|---|
| `posts_created_at_idx` | `created_at DESC` | 최신 목록 |
| `posts_author_id_idx` | `author_id` | 작성자·RLS |

### 4.4 함수·트리거

| 이름 | 역할 |
|---|---|
| `set_updated_at()` | `updated_at` 자동 갱신 |
| `handle_new_user()` | 회원가입 시 `profiles` 행 생성 (SECURITY DEFINER) |
| `on_auth_user_created` | `auth.users` AFTER INSERT |
| `profiles_set_updated_at` | profiles UPDATE 전 |
| `posts_set_updated_at` | posts UPDATE 전 |

### 4.5 RLS 정책

**profiles** (RLS enabled)

| Policy | Command | 조건 |
|---|---|---|
| profiles_select_all | SELECT | `true` |
| profiles_insert_own | INSERT | `auth.uid() = id` |
| profiles_update_own | UPDATE | `auth.uid() = id` |

**posts** (RLS enabled)

| Policy | Command | 조건 |
|---|---|---|
| posts_select_all | SELECT | `true` |
| posts_insert_own | INSERT | `auth.uid() = author_id` |
| posts_update_own | UPDATE | `auth.uid() = author_id` |
| posts_delete_own | DELETE | `auth.uid() = author_id` |

## 5. test-plan.md 매핑

| Test ID | migration 지원 |
|---|---|
| AUTH-001~003 | Auth (앱) + `handle_new_user` |
| POST-001~004 | posts 테이블·RLS |
| RLS-001~005 | posts INSERT/UPDATE/DELETE 정책 |
| DATA-001~004 | NOT NULL, FK |
| DEPLOY-001~002 | 앱·env (migration 이후) |

## 6. 위험 요소 (실행 전)

| ID | 위험 | 수준 | 완화 |
|---|---|---|---|
| R-01 | 잘못된 프로젝트에 적용 | 중 | `project_ref=zbwonlldqnayfwhksnwi` 재확인 |
| R-02 | `handle_new_user` SECURITY DEFINER | 낮 | `search_path` 고정, `profiles`에만 INSERT |
| R-03 | 기존 `rls_auto_enable` WARN | 낮 | 이번 migration에서 미변경 |
| R-04 | Destructive SQL | 없음 | DROP/DELETE/TRUNCATE 미포함 |
| R-05 | 이메일 공개 (profiles SELECT) | 낮 | 실습용; 운영 시 SELECT 제한 검토 |

## 7. 적용 방법 (승인 후)

1. `apply_migration` MCP 또는 Supabase Dashboard SQL로 `20260526000000_initial_schema.sql` 적용
2. MCP `list_tables`로 `profiles`, `posts`·RLS 확인
3. `.env.local`에 anon key·URL 설정
4. Next.js 앱 스캐폴딩 및 최소 UI
5. `docs/validation-report.md` 작성

## 8. 승인 체크리스트

- [ ] 위 테이블·정책·트리거 구성에 동의
- [ ] Cloud Supabase `zbwonlldqnayfwhksnwi`에 적용 동의
- [ ] `apply_migration` 실행 승인

**승인 전 SQL 실행 금지 (AGENTS.md).**
