import Link from "next/link";
import type { PostWithAuthor } from "@/lib/database.types";
import { canEditPost } from "@/lib/posts/validation";
import { DeletePostButton } from "@/components/delete-post-button";

type PostListProps = {
  posts: PostWithAuthor[];
  currentUserId?: string;
};

const formatAuthor = (post: PostWithAuthor): string =>
  post.profiles?.display_name ??
  post.profiles?.email ??
  post.author_id.slice(0, 8);

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString("ko-KR");

export const PostList = ({ posts, currentUserId }: PostListProps) => {
  if (posts.length === 0) {
    return <p className="muted">아직 게시글이 없습니다.</p>;
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {posts.map((post) => {
        const editable = canEditPost(post.author_id, currentUserId);

        return (
          <li key={post.id} className="card">
            <h2>{post.title}</h2>
            <p className="muted">
              {formatAuthor(post)} · {formatDate(post.created_at)}
            </p>
            <p className="content">{post.content}</p>
            {editable && (
              <div className="actions">
                <Link href={`/posts/${post.id}/edit`} className="btn">
                  수정
                </Link>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
