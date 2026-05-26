# Supabase 미니 게시판 (bbs01)

Next.js App Router + Supabase Auth + RLS 게시판 실습 프로젝트.

## 로컬 실행

```bash
cp .env.example .env.local
# .env.local에 Supabase URL·anon key 입력
npm install
npm run dev
```

## Vercel 배포

**Production:** https://bbs01-chi.vercel.app

### 방법 1: Dashboard (권장)

1. [GitHub 저장소 import](https://vercel.com/new/clone?repository-url=https://github.com/kjwzone/bbs01) 열기
2. **Environment Variables** 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key만, service_role 금지)
3. **Deploy** 클릭

### 방법 2: CLI

```bash
vercel login
npm run vercel:deploy
```

> Windows에서 PC 이름·사용자명에 한글이 있으면 `vercel` 단독 실행 시 오류가 날 수 있습니다. `npm run vercel:deploy`는 `scripts/vercel-patch.cjs`로 우회합니다.

## Supabase Auth (배포 후)

Vercel URL을 Supabase Dashboard → **Authentication → URL Configuration**에 등록:

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: `https://<your-app>.vercel.app/auth/callback`

## 문서

- `docs/prd.md` — 요구사항
- `docs/test-plan.md` — 테스트 기준
- `docs/rdb-design.md` — DB 설계
- `docs/validation-report.md` — 검증 결과
