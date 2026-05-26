import { PostList } from "@/components/post-list";
import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor } from "@/lib/database.types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*, profiles(display_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="error">게시글을 불러오지 못했습니다: {error.message}</p>
    );
  }

  return (
    <section>
      <h2>게시글 목록</h2>
      {!user && (
        <p className="muted">
          비회원도 목록을 볼 수 있습니다. 글쓰기는 로그인 후 가능합니다.
        </p>
      )}
      <PostList
        posts={(posts ?? []) as PostWithAuthor[]}
        currentUserId={user?.id}
      />
    </section>
  );
}
