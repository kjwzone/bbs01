# test-plan.md

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 문서 목적 | PRD 기반 성공/실패 테스트 기준 정의 |
| 기준 문서 | docs/prd.md |
| 테스트 대상 | Auth, Posts CRUD, RLS, 데이터 무결성, Vercel 배포 |
| 테스트 환경 | Cloud Supabase, 로컬 Next.js, Vercel |
| 제외 도구 | Playwright MCP 제외, Local Supabase 제외 |

## 2. 테스트 범위

| Area | 포함 여부 | 설명 |
|---|---|---|
| Auth | 포함 | 회원가입, 로그인, 로그아웃 |
| Posts | 포함 | 게시글 목록, 작성, 수정, 삭제 |
| RLS | 포함 | 비회원 작성 실패, 남의 글 수정/삭제 실패 |
| Profiles | 포함 | Auth 사용자와 연결되는 프로필 확인 |
| Storage | 제외 | 이미지 업로드 없음 |
| Realtime | 제외 | 실시간 기능 없음 |
| Playwright MCP | 제외 | 수동 테스트 또는 테스트 UI로 검증 |

## 3. 테스트 계정

| 계정 | 역할 | 목적 |
|---|---|---|
| userA@example.com | 회원 A | 게시글 작성자 |
| userB@example.com | 회원 B | 남의 글 수정/삭제 실패 테스트 |

## 4. 성공해야 하는 테스트

| Test ID | Area | Scenario | User State | Expected Result | Method | Priority |
|---|---|---|---|---|---|---|
| AUTH-001 | Auth | 회원가입한다 | Anonymous | Success | Manual/Test UI | High |
| AUTH-002 | Auth | 로그인한다 | Anonymous | Success | Manual/Test UI | High |
| AUTH-003 | Auth | 로그아웃한다 | Authenticated | Success | Manual/Test UI | High |
| POST-001 | Posts | 게시글 목록을 조회한다 | Anonymous | Success | Manual/Test UI | High |
| POST-002 | Posts | 게시글을 작성한다 | Authenticated | Success | Manual/Test UI | High |
| POST-003 | Posts | 본인 게시글을 수정한다 | Author | Success | Manual/Test UI | High |
| POST-004 | Posts | 본인 게시글을 삭제한다 | Author | Success | Manual/Test UI | High |
| DEPLOY-001 | Deploy | Vercel URL에서 게시글 목록을 조회한다 | Anonymous | Success | Manual | Medium |
| DEPLOY-002 | Deploy | Vercel URL에서 로그인 후 글을 작성한다 | Authenticated | Success | Manual | Medium |

## 5. 실패해야 정상인 테스트

| Test ID | Area | Scenario | User State | Expected Result | Method | Priority |
|---|---|---|---|---|---|---|
| RLS-001 | RLS | 비회원이 게시글을 작성한다 | Anonymous | Fail | Manual/Test UI | High |
| RLS-002 | RLS | 회원 B가 회원 A의 게시글을 수정한다 | User B | Fail | Manual/Test UI | High |
| RLS-003 | RLS | 회원 B가 회원 A의 게시글을 삭제한다 | User B | Fail | Manual/Test UI | High |
| RLS-004 | RLS | 비회원이 게시글을 수정한다 | Anonymous | Fail | Manual/Test UI | High |
| RLS-005 | RLS | 비회원이 게시글을 삭제한다 | Anonymous | Fail | Manual/Test UI | High |
| DATA-001 | Constraint | 제목 없이 게시글을 작성한다 | Authenticated | Fail | Manual/Test UI | Medium |
| DATA-002 | Constraint | 내용 없이 게시글을 작성한다 | Authenticated | Fail | Manual/Test UI | Medium |

## 6. 데이터 무결성 테스트

| Test ID | Scenario | Expected Result | DB Rule |
|---|---|---|---|
| DATA-001 | title이 비어 있는 게시글 생성 | Fail | NOT NULL 또는 앱 validation |
| DATA-002 | content가 비어 있는 게시글 생성 | Fail | NOT NULL 또는 앱 validation |
| DATA-003 | author_id 없이 게시글 생성 | Fail | NOT NULL, FK, RLS |
| DATA-004 | 존재하지 않는 profile id로 게시글 생성 | Fail | FK |

## 7. RLS 핵심 검증 기준

| Table | Action | 허용 조건 | 차단 조건 |
|---|---|---|---|
| posts | SELECT | 누구나 가능 | 없음 |
| posts | INSERT | 로그인 사용자만 가능, author_id = auth.uid() | 비회원 또는 다른 author_id |
| posts | UPDATE | 작성자 본인만 가능 | 비회원 또는 타인 |
| posts | DELETE | 작성자 본인만 가능 | 비회원 또는 타인 |
| profiles | SELECT | 누구나 가능 또는 로그인 사용자만 가능 | 정책 결정 필요 |
| profiles | INSERT/UPDATE | 본인 프로필만 가능 | 타인 프로필 |

## 8. 테스트 결과 기록 양식

| Test ID | Result | Evidence | Failure Cause | Fix | Retest Result |
|---|---|---|---|---|---|
| 확인 필요 | Pass/Fail | 화면 캡처, 콘솔 로그, Supabase 로그 | 확인 필요 | 확인 필요 | 확인 필요 |