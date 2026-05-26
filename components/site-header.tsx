import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export const SiteHeader = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="site-header">
      <h1>
        <Link href="/">미니 게시판</Link>
      </h1>
      <nav className="header-nav">
        {user ? (
          <>
            <span className="muted">{user.email}</span>
            <Link href="/posts/new" className="btn primary">
              글쓰기
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login">로그인</Link>
            <Link href="/signup" className="btn primary">
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};
