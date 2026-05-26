"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <button type="button" onClick={handleLogout}>
      로그아웃
    </button>
  );
};
