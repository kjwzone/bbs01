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

### 방법 1: Dashboard (권장)

1. [GitHub 저장소 import](https://vercel.com/new/clone?repository-url=https://github.com/kjwzone/bbs01) 열기
2. **Environment Variables** 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key만, service_role 금지)
3. **Deploy** 클릭

### 방법 2: CLI

```bash
vercel login
vercel --prod
```

> Windows에서 PC 이름·사용자명에 한글이 있으면 CLI가 `not a legal HTTP header value` 오류를 낼 수 있습니다. 이 경우 방법 1을 사용하세요.

## Supabase Auth (배포 후)

Vercel URL을 Supabase Dashboard → **Authentication → URL Configuration**에 등록:

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: `https://<your-app>.vercel.app/auth/callback`

## 문서

- `docs/prd.md` — 요구사항
- `docs/test-plan.md` — 테스트 기준
- `docs/rdb-design.md` — DB 설계
- `docs/validation-report.md` — 검증 결과
