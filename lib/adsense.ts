// Google AdSense 게시자 번호. 환경 변수 NEXT_PUBLIC_ADSENSE_CLIENT(ca-pub-…) 하나로 켠다.
// 비어 있거나 형식이 다르면 광고 관련 출력(메타 태그 · 스크립트 · ads.txt · robots 규칙)은 전부 꺼진다.
const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export const adsenseClient = /^ca-pub-\d{16}$/.test(raw) ? raw : null;
