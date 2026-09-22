import type { MetadataRoute } from "next";
import { adsenseClient } from "@/lib/adsense";

// 도메인루트 robots (크롤러 실참조 위치). 통합 URL(2026-07-13): 사설 강의 도구가 mftel.vercel.app/lecture/* 로
//   프록시되면서 마케팅 사이트와 같은 도메인 공유 → 마케팅(연구·팀·논문)은 인덱싱 유지하되, 학번 게이트·답안이
//   있는 강의 도구(/lecture/* 하위)는 인덱싱 차단. (덱 답안은 세션게이트+X-Robots-Tag noindex 로 이미 콘텐츠 비노출 —
//   본 robots 는 URL·목록 인덱싱 차단의 도메인루트 정본. 강의앱 자체 /lecture/robots.txt 는 크롤러 미참조라 무효.)
//   bare /lecture 는 허용(2026-08-08): 사이트 자신의 강의 페이지(소개+로그인) — 마케팅 표면이라 인덱싱 대상.
export default function robots(): MetadataRoute.Robots {
  const everyone = {
    userAgent: "*",
    allow: "/",
    // /admin(접속 통계 콘솔) — 공개 UI 미링크 콘솔은 인덱싱 차단. 구 대시보드(/team-dashboard)는 2026-09-13 폐기
    // /board/(수업 게시판, 2026-09-21 이 도메인 아래로 옴) — 학생 답이 있는 수업 화면은 강의 도구와 같은 이유로 차단. 맨 /board(첫 화면)는 허용.
    disallow: ["/lecture/", "/board/", "/admin", "/en/admin"],
  };
  // 애드센스 크롤러는 검색 인덱싱과 무관하게 광고가 실린 페이지를 읽어야 한다(막히면 광고가 나가지 않는다).
  //   게시자 번호가 설정된 경우에만 강의 하위 경로까지 열어 준다. 검색 크롤러 규칙은 그대로다.
  if (!adsenseClient) return { rules: everyone };
  return { rules: [everyone, { userAgent: "Mediapartners-Google", allow: "/" }] };
}
