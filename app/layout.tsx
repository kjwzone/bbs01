import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "미니 게시판",
  description: "Supabase Auth + RLS 게시판 실습",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="container">
          <SiteHeader />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
