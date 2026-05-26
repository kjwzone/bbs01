import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { createClient } from "@/lib/supabase/server";
import { canEditPost } from "@/lib/posts/validation";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, content, author_id")
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  if (!canEditPost(post.author_id, user.id)) {
    redirect("/");
  }

  return (
    <section>
      <h2>글 수정</h2>
      <PostForm
        mode="edit"
        postId={post.id}
        initialTitle={post.title}
        initialContent={post.content}
      />
    </section>
  );
}
