import { adsenseClient } from "@/lib/adsense";

// ads.txt — 이 도메인의 광고를 팔 수 있는 판매자 선언. 게시자 번호가 설정된 경우에만 제공한다.
//   f08c47fec0942fa0 = Google 의 인증기관 ID(모든 애드센스 게시자 공통 값).
export function GET() {
  if (!adsenseClient) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${adsenseClient.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
