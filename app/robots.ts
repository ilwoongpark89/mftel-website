import type { MetadataRoute } from "next";

// 도메인루트 robots (크롤러 실참조 위치). 통합 URL(2026-07-13): 사설 강의 도구가 mftel.vercel.app/lecture/* 로
//   프록시되면서 마케팅 사이트와 같은 도메인 공유 → 마케팅(연구·팀·논문)은 인덱싱 유지하되, 학번 게이트·답안이
//   있는 강의 도구(/lecture/* 하위)는 인덱싱 차단. (덱 답안은 세션게이트+X-Robots-Tag noindex 로 이미 콘텐츠 비노출 —
//   본 robots 는 URL·목록 인덱싱 차단의 도메인루트 정본. 강의앱 자체 /lecture/robots.txt 는 크롤러 미참조라 무효.)
//   bare /lecture 는 허용(2026-08-08): 사이트 자신의 강의 페이지(소개+로그인) — 마케팅 표면이라 인덱싱 대상.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/lecture/" },
  };
}
