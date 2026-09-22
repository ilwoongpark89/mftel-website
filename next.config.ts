import type { NextConfig } from "next";

// 수업 게시판 프로젝트의 주소. 로컬에서 게시판까지 함께 띄워 시험할 때만 BOARD_ORIGIN 으로 바꾼다(빌드 때 읽힌다).
const BOARD_ORIGIN = (process.env.BOARD_ORIGIN ?? "https://prompt-eng-advanced-board.vercel.app").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
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
        // 수업 게시판(2026-09-21): mftel.vercel.app/board/* = 게시판 프로젝트(basePath /board)로 프록시 — 강의 앱과 같은 방식.
        //   /lecture 와 달리 맨 /board 도 넘긴다(그 주소의 주인이 게시판의 첫 화면이다).
        //   ⚠ 타깃은 prompt-eng-advanced-board.vercel.app 이어야 한다. mftel-board.vercel.app 은 게시판 쪽에서
        //     이 주소로 되돌려 보내는 옛 주소라(기존 링크·QR 보존) 타깃으로 쓰면 무한 왕복한다.
        //   ⚠ 배포 순서: 게시판(basePath) 먼저 배포 → 이 프록시 배포.
        { source: "/board", destination: `${BOARD_ORIGIN}/board` },
        { source: "/board/:path*", destination: `${BOARD_ORIGIN}/board/:path*` },
      ],
    };
  },
};

export default nextConfig;
