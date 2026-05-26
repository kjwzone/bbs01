# rdb-design.md

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 문서명 | docs/rdb-design.md |
| 목적 | Supabase 기반 미니 게시판 RDB 설계 기준 정의 |
| 기준 문서 | docs/prd.md, docs/test-plan.md |
| 대상 DB | PostgreSQL |
| 대상 플랫폼 | Supabase |
| 실습 기준 | Supabase Free Plan |
| SQL 수준 | 최소화, 실행 전 Cursor가 migration-plan.md 작성 |

## 2. 서비스 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | Supabase 미니 게시판 |
| 핵심 목적 | Auth, CRUD, RLS, Vercel 배포 흐름 실습 |
| MVP 범위 | 회원가입, 로그인, 로그아웃, 게시글 목록, 작성, 수정, 삭제 |
| 제외 범위 | 댓글, 좋아요, 북마크, 신고, 관리자, Storage, Realtime |

## 3. 사용자 유형

| 사용자 유형 | 설명 | 주요 권한 |
|---|---|---|
| Anonymous | 비로그인 사용자 | 게시글 목록 조회 |
| Authenticated | 로그인 사용자 | 게시글 작성 |
| Author | 게시글 작성자 | 본인 게시글 수정/삭제 |

## 4. 엔티티 목록

| Entity | 설명 | MVP 여부 | 비고 |
|---|---|---|---|
| profiles | Supabase Auth 사용자와 연결되는 공개 프로필 | 필수 | auth.users.id 참조 |
| posts | 게시글 | 필수 | 작성자 기준 RLS 적용 |

## 5. 엔티티 관계

| 관계 | 유형 | FK 위치 | 삭제 정책 | 설명 |
|---|---|---|---|---|
| profiles - posts | 1:N | posts.author_id | restrict 권장 | 한 사용자는 여러 게시글을 작성할 수 있음 |
| auth.users - profiles | 1:1 | profiles.id | cascade 또는 restrict 확인 필요 | Supabase Auth 사용자와 프로필 연결 |

## 6. 업무 규칙

| Rule ID | 업무 규칙 | DB 설계 영향 | RLS 영향 | 테스트 ID |
|---|---|---|---|---|
| BR-001 | 비회원도 게시글 목록은 볼 수 있다 | posts SELECT 공개 | SELECT 공개 정책 | POST-001 |
| BR-002 | 로그인 사용자만 게시글을 작성할 수 있다 | posts.author_id 필요 | INSERT auth.uid() = author_id | POST-002, RLS-001 |
| BR-003 | 작성자는 본인 게시글만 수정할 수 있다 | posts.author_id 필요 | UPDATE auth.uid() = author_id | POST-003, RLS-002 |
| BR-004 | 작성자는 본인 게시글만 삭제할 수 있다 | posts.author_id 필요 | DELETE auth.uid() = author_id | POST-004, RLS-003 |
| BR-005 | 제목과 내용은 필수다 | NOT NULL 또는 앱 validation | 직접 영향 없음 | DATA-001, DATA-002 |

## 7. 테이블 설계

### 7.1 profiles

| Column | Type | Required | Default | Constraint | Description |
|---|---|---|---|---|---|
| id | uuid | Yes | none | PK, FK auth.users(id) | Supabase Auth 사용자 ID |
| email | text | No | none | 확인 필요 | 사용자 이메일 표시용, 민감도 고려 |
| display_name | text | No | none | none | 화면 표시 이름 |
| created_at | timestamptz | Yes | now() | none | 생성일 |
| updated_at | timestamptz | Yes | now() | none | 수정일 |

### 7.2 posts

| Column | Type | Required | Default | Constraint | Description |
|---|---|---|---|---|---|
| id | bigint | Yes | generated identity | PK | 게시글 ID |
| author_id | uuid | Yes | auth.uid() 처리 권장 | FK profiles(id) | 작성자 ID |
| title | text | Yes | none | NOT NULL | 게시글 제목 |
| content | text | Yes | none | NOT NULL | 게시글 내용 |
| created_at | timestamptz | Yes | now() | none | 생성일 |
| updated_at | timestamptz | Yes | now() | none | 수정일 |

## 8. 제약조건 설계

| Table | Constraint Type | Columns | Reason |
|---|---|---|---|
| profiles | PK | id | 사용자 고유 식별 |
| profiles | FK | id → auth.users.id | Supabase Auth와 연결 |
| posts | PK | id | 게시글 고유 식별 |
| posts | FK | author_id → profiles.id | 작성자 추적 및 RLS 기준 |
| posts | NOT NULL | title | 제목 없는 글 방지 |
| posts | NOT NULL | content | 내용 없는 글 방지 |
| posts | NOT NULL | author_id | 작성자 없는 글 방지 |

## 9. 인덱스 설계

| Table | Index Columns | Purpose | Priority |
|---|---|---|---|
| posts | created_at desc | 최신 게시글 목록 조회 | High |
| posts | author_id | 본인 글 조회 및 RLS 조건 최적화 | Medium |
| profiles | id | Auth 사용자 연결 | High |

## 10. Supabase Auth 연동 설계

| 항목 | 설계 |
|---|---|
| Auth 기준 테이블 | auth.users |
| 프로필 테이블 | public.profiles |
| 연결 방식 | profiles.id = auth.users.id |
| 프로필 생성 방식 | 회원가입 후 trigger 또는 앱 로직 중 선택 |
| 초보자 권장 | Cursor가 Supabase MCP로 현재 DB 확인 후 단순한 방식 제안 |
| 주의사항 | service_role key 또는 Secret Key를 클라이언트 코드에 절대 노출하지 않음 |

## 11. RLS 정책 설계

### 11.1 profiles RLS

| Action | 허용 대상 | 조건 | 비고 |
|---|---|---|---|
| SELECT | 모든 사용자 또는 로그인 사용자 | 확인 필요 | 초보자 실습에서는 단순 공개 가능 |
| INSERT | 본인 | auth.uid() = id | 프로필 자동 생성 방식에 따라 조정 |
| UPDATE | 본인 | auth.uid() = id | display_name 수정 시 필요 |
| DELETE | 제외 권장 | 없음 | 초보자 실습에서는 삭제 기능 제외 |

### 11.2 posts RLS

| Action | 허용 대상 | 조건 | 테스트 |
|---|---|---|---|
| SELECT | 모든 사용자 | true | POST-001 |
| INSERT | 로그인 사용자 | auth.uid() = author_id | POST-002, RLS-001 |
| UPDATE | 작성자 본인 | auth.uid() = author_id | POST-003, RLS-002 |
| DELETE | 작성자 본인 | auth.uid() = author_id | POST-004, RLS-003 |

## 12. RLS 정책 의사코드

> 아래는 설계 이해용입니다. 실행 SQL 확정본은 Cursor가 Supabase MCP로 현재 DB 상태를 확인한 뒤 migration-plan.md 작성 후 생성해야 합니다.

| Table | Policy Name 예시 | Action | 핵심 조건 |
|---|---|---|---|
| posts | anyone can read posts | SELECT | true |
| posts | authenticated users can create own posts | INSERT | auth.uid() = author_id |
| posts | authors can update own posts | UPDATE | auth.uid() = author_id |
| posts | authors can delete own posts | DELETE | auth.uid() = author_id |
| profiles | users can read profiles | SELECT | true 또는 auth.role() = 'authenticated' |
| profiles | users can update own profile | UPDATE | auth.uid() = id |

## 13. Storage 설계

| 항목 | 적용 여부 | 이유 |
|---|---|---|
| Storage bucket | 제외 | 이미지 업로드 제외 |
| avatars | 제외 | 프로필 이미지 없음 |
| post-images | 제외 | 게시글 이미지 없음 |

## 14. Realtime 설계

| 항목 | 적용 여부 | 이유 |
|---|---|---|
| posts Realtime | 제외 | 이번 실습 범위 밖 |
| 댓글 Realtime | 제외 | 댓글 기능 없음 |

## 15. Migration 작성 지침

| Step | Action | Note |
|---|---|---|
| 1 | Cursor가 문서 읽기 | AGENTS.md, prd.md, test-plan.md, rdb-design.md |
| 2 | Supabase MCP로 현재 DB 확인 | 기존 테이블, 정책, 인덱스 확인 |
| 3 | docs/migration-plan.md 작성 | 사용자 승인 전 필수 |
| 4 | SQL 작성 | supabase/migrations/ 아래 작성 |
| 5 | 실행 전 리뷰 | DROP, DELETE, TRUNCATE, destructive ALTER 금지 |
| 6 | 사용자 승인 | 승인 전 SQL 실행 금지 |
| 7 | Cloud Supabase 적용 | 이번 실습은 Local Supabase 제외 |
| 8 | 검증 | test-plan.md 기준으로 validation-report.md 작성 |

## 16. 실행 전 검증 체크리스트

| Check Item | Status |
|---|---|
| 현재 DB 상태를 Supabase MCP로 확인했는가? | 확인 필요 |
| profiles, posts 기존 존재 여부를 확인했는가? | 확인 필요 |
| RLS 활성화 계획이 있는가? | 확인 필요 |
| posts author_id 정책이 auth.uid() 기준인가? | 확인 필요 |
| service_role key가 클라이언트에 노출되지 않는가? | 확인 필요 |
| DROP/DELETE/TRUNCATE가 없는가? | 확인 필요 |
| 사용자 승인 전 SQL을 실행하지 않았는가? | 확인 필요 |

## 17. 실행 후 검증 체크리스트

| Verification Item | Expected Result | Actual Result |
|---|---|---|
| profiles 테이블 존재 | 설계와 일치 | 확인 필요 |
| posts 테이블 존재 | 설계와 일치 | 확인 필요 |
| posts RLS 활성화 | Enabled | 확인 필요 |
| 비회원 게시글 조회 | Success | 확인 필요 |
| 비회원 게시글 작성 | Fail | 확인 필요 |
| 작성자 본인 글 수정 | Success | 확인 필요 |
| 타인 글 수정 | Fail | 확인 필요 |
| 작성자 본인 글 삭제 | Success | 확인 필요 |
| 타인 글 삭제 | Fail | 확인 필요 |