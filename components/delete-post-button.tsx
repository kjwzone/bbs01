"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DeletePostButtonProps = {
  postId: number;
};

export const DeletePostButton = ({ postId }: DeletePostButtonProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("이 게시글을 삭제할까요?")) {
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    setLoading(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  };

  return (
    <span>
      <button
        type="button"
        className="danger"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "삭제 중…" : "삭제"}
      </button>
      {error && <span className="error"> {error}</span>}
    </span>
  );
};
