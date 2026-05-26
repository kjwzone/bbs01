"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/env";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const siteUrl = getSiteUrl();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: siteUrl
              ? { emailRedirectTo: `${siteUrl}/auth/callback` }
              : undefined,
          });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage(
        "가입 요청이 완료되었습니다. 이메일 확인이 켜져 있으면 메일함을 확인한 뒤 로그인하세요.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <h2>{mode === "login" ? "로그인" : "회원가입"}</h2>
      <label>
        이메일
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
        />
      </label>
      {error && <p className="error">{error}</p>}
      {message && <p className="muted">{message}</p>}
      <button type="submit" className="primary" disabled={loading}>
        {loading ? "처리 중…" : mode === "login" ? "로그인" : "가입"}
      </button>
      <p className="muted">
        {mode === "login" ? (
          <>
            계정이 없나요? <Link href="/signup">회원가입</Link>
          </>
        ) : (
          <>
            이미 계정이 있나요? <Link href="/login">로그인</Link>
          </>
        )}
      </p>
    </form>
  );
};
