import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/team-dashboard",
        destination: "https://mftel-db.vercel.app",
        permanent: false, // 307 임시 리다이렉트 (나중에 되돌릴 수 있도록)
      },
    ];
  },
  // 통합 강의 앱(2026-07-12): mftel.vercel.app/lecture/* = 강의 프로젝트(basePath /lecture)로 프록시.
  //   beforeFiles = 파일시스템/로케일 라우팅보다 먼저 가로챔 → 브라우저는 단일 origin(mftel.vercel.app)만 봄
  //   = 쿠키 1개로 전 코스 로그인 성립. 마케팅 사이트(/ /research …)는 무영향.
  //   bare /lecture 는 프록시하지 않는다(2026-08-08): 사이트 자신의 강의 페이지(§08 — 소개+인라인 로그인)가
  //   그 주소의 주인 — nav "강의"가 다른 얼굴로 튕기던 통일성 파괴의 수리. 플랫폼은 /lecture/{home,admin,api,…}부터.
  //   ⚠ 배포 순서: 강의 앱(basePath) 먼저 배포 → 이 프록시 배포(타깃이 살아있어야 함).
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/lecture/:path*", destination: "https://mftel-lecture.vercel.app/lecture/:path*" },
      ],
    };
  },
};

export default nextConfig;
