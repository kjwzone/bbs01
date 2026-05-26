import { redirect } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section>
      <h2>글쓰기</h2>
      <PostForm mode="create" />
    </section>
  );
}
