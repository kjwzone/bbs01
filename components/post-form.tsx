"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostFieldErrors } from "@/lib/posts/validation";
import { validatePostInput } from "@/lib/posts/validation";

type PostFormProps = {
  mode: "create" | "edit";
  postId?: number;
  initialTitle?: string;
  initialContent?: string;
};

export const PostForm = ({
  mode,
  postId,
  initialTitle = "",
  initialContent = "",
}: PostFormProps) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [fieldErrors, setFieldErrors] = useState<PostFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const validation = validatePostInput(title, content);
    if (validation) {
      setFieldErrors(validation);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
    };

    const result =
      mode === "create"
        ? await supabase.from("posts").insert({
            ...payload,
            author_id: user.id,
          })
        : await supabase.from("posts").update(payload).eq("id", postId!);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <label>
        제목
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
        {fieldErrors.title && (
          <span className="error">{fieldErrors.title}</span>
        )}
      </label>
      <label>
        내용
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        {fieldErrors.content && (
          <span className="error">{fieldErrors.content}</span>
        )}
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="submit" className="primary" disabled={loading}>
          {loading ? "저장 중…" : mode === "create" ? "작성" : "수정"}
        </button>
        <button type="button" onClick={() => router.push("/")}>
          취소
        </button>
      </div>
    </form>
  );
};
