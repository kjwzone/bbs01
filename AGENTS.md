# AGENTS.md

## Project Context

이 프로젝트는 Supabase와 Cursor를 활용해 초보자가 로그인 기반 미니 게시판을 만들고 Vercel에 배포하는 실습 프로젝트입니다.

사용 기술:

| 영역 | 기술 |
|---|---|
| Frontend | Next.js App Router, TypeScript |
| Backend/BaaS | Supabase |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Security | Row Level Security |
| Deployment | Vercel |
| AI Coding Tool | Cursor |
| DB Inspection | Supabase MCP |

이번 실습에서 제외하는 항목:

| 제외 항목 |
|---|
| 댓글 |
| 좋아요 |
| 북마크 |
| 신고 |
| 관리자 기능 |
| 이미지 업로드 |
| Storage |
| Realtime |
| Playwright MCP |
| Local Supabase |

## Source of Truth Documents

작업 전 반드시 아래 문서를 먼저 읽습니다.

1. docs/prd.md
2. docs/test-plan.md
3. docs/rdb-design.md
4. docs/migration-plan.md, 존재하는 경우
5. docs/validation-report.md, 존재하는 경우

## Required Workflow

데이터베이스 변경 전 반드시 다음 순서를 따릅니다.

| Step | Required Action |
|---|---|
| 1 | docs/prd.md를 읽고 제품 목표와 MVP 범위를 요약합니다 |
| 2 | docs/test-plan.md를 읽고 성공/실패 테스트를 요약합니다 |
| 3 | docs/rdb-design.md를 읽고 필요한 테이블, 제약조건, RLS를 요약합니다 |
| 4 | Supabase MCP로 현재 DB 상태를 확인합니다 |
| 5 | 현재 DB와 rdb-design.md의 차이를 비교합니다 |
| 6 | docs/migration-plan.md를 작성합니다 |
| 7 | 사용자 승인 전 SQL을 실행하지 않습니다 |
| 8 | 승인 후 supabase/migrations/에 migration SQL을 작성합니다 |
| 9 | Cloud Supabase에 적용합니다 |
| 10 | docs/test-plan.md 기준으로 수동 검증합니다 |
| 11 | docs/validation-report.md에 결과와 evidence를 기록합니다 |
| 12 | Vercel 배포 후 핵심 기능을 다시 확인합니다 |

## Database Scope

이번 프로젝트에서 사용하는 테이블은 두 개뿐입니다.

| Table | Purpose |
|---|---|
| profiles | Supabase Auth 사용자와 연결되는 공개 프로필 |
| posts | 게시글 데이터 |

추가 테이블을 만들지 않습니다.

| 만들지 않는 테이블 |
|---|
| comments |
| likes |
| bookmarks |
| reports |
| admin_roles |
| files |
| notifications |

## RLS Rules

RLS는 반드시 활성화합니다.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | 공개 또는 로그인 사용자 | 본인만 | 본인만 | 제외 권장 |
| posts | 누구나 | 로그인 사용자, author_id = auth.uid() | 작성자 본인만 | 작성자 본인만 |

특히 posts 테이블은 아래 조건을 반드시 만족해야 합니다.

| Action | Required Rule |
|---|---|
| INSERT | auth.uid() = author_id |
| UPDATE | auth.uid() = author_id |
| DELETE | auth.uid() = author_id |

## Safety Rules

절대 지켜야 할 규칙입니다.

| Rule | Description |
|---|---|
| SQL 실행 전 승인 | 사용자가 승인하기 전 SQL을 실행하지 않습니다 |
| Destructive operation 금지 | DROP TABLE, DELETE, TRUNCATE, 위험한 ALTER를 실행하지 않습니다 |
| Secret 노출 금지 | service_role key 또는 Secret Key를 클라이언트 코드에 노출하지 않습니다 |
| RLS 우회 금지 | 프론트엔드에서 RLS를 우회하지 않습니다 |
| DB 비어 있음 가정 금지 | Supabase MCP로 현재 상태를 먼저 확인합니다 |
| 테스트 증거 필수 | 통과했다고 말하기 전에 화면, 로그, 쿼리 결과 등 evidence를 남깁니다 |

## Supabase Free Plan Constraints

| Constraint | Rule |
|---|---|
| 데이터 크기 | 샘플 데이터는 작게 유지 |
| Storage | 사용하지 않음 |
| Realtime | 사용하지 않음 |
| 백업 | 운영급 백업, PITR, Read Replica를 전제로 하지 않음 |
| 배포 | Vercel 기본 배포만 사용 |
| 장애 시 | 실습 DB가 꼬이면 위험한 삭제보다 새 Supabase 프로젝트 생성을 우선 검토 |

## Testing Rules

성공해야 하는 테스트와 실패해야 정상인 테스트를 모두 확인합니다.

| Category | Required |
|---|---|
| Auth | 회원가입, 로그인, 로그아웃 |
| Posts CRUD | 목록, 작성, 수정, 삭제 |
| RLS Success | 본인 글 수정/삭제 성공 |
| RLS Failure | 비회원 작성 실패, 타인 글 수정/삭제 실패 |
| Deploy | Vercel URL에서 기본 기능 확인 |

## Validation Report

테스트 후 docs/validation-report.md를 작성합니다.

| Test ID | Result | Evidence | Failure Cause | Fix | Retest Result |
|---|---|---|---|---|---|
| 확인 필요 | Pass/Fail | screenshot/log/query | 확인 필요 | 확인 필요 | 확인 필요 |