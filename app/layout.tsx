import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const imageUrl = host ? `${protocol}://${host}/og.png` : undefined;

  return {
    title: "오션중학교 교육자료 나눔터",
    description:
      "오션중학교 선생님들이 직접 만든 업무간소화 웹앱과 교수학습자료를 찾고 활용하는 공개 자료 나눔터입니다.",
    icons: {
      icon: "/ocean-middle-school-logo.jpg",
      shortcut: "/ocean-middle-school-logo.jpg",
    },
    openGraph: {
      title: "오션중학교 교육자료 나눔터",
      description: "선생님이 좋은 아이디어가 수업 효율화와 업무간화에 큰 힘이 됩니다",
      type: "website",
      locale: "ko_KR",
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 630, alt: "오션중학교 교육자료 나눔터" }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "오션중학교 교육자료 나눔터",
      description: "선생님이 좋은 아이디어가 수업 효율화와 업무간화에 큰 힘이 됩니다",
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
