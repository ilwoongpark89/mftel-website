import type { NextConfig } from "next";
import { adsenseClient } from "./lib/adsense";

// 수업 게시판 프로젝트의 주소. 로컬에서 게시판까지 함께 띄워 시험할 때만 BOARD_ORIGIN 으로 바꾼다(빌드 때 읽힌다).
const BOARD_ORIGIN = (process.env.BOARD_ORIGIN ?? "https://prompt-eng-advanced-board.vercel.app").replace(/\/+$/, "");

// 이 사이트의 정식 주소. ACAO 를 자기 출처로 덮을 때 쓴다(아래 SECURITY_HEADERS).
const CANONICAL_ORIGIN = "https://mftel.vercel.app";

// ⟦2026-09-25 · 전 시스템 물결 1⟧ 보안 머리글. 실측(`curl -D -` · 2026-09-25 프로덕션): `/` `/en` `/lecture`
//   `/en/privacy` `/robots.txt` 전건에 CSP·X-Frame-Options·X-Content-Type-Options·Referrer-Policy·
//   Permissions-Policy 가 **하나도 없었다**(HSTS 만 플랫폼 기본). 정책은 이 파일 한 곳에 둔다.
//
// 허용 목록은 **실측한 출처만** 담는다. 재는 방법 = 헤드리스 chromium 으로 프로덕션 화면을 열고 요청마다
//   **개시 프레임**을 기록해 「우리 문서가 낸 요청」만 센다(6 주소 × 넓게 1280×900 · 좁게 390×844 = 12 회 합집합,
//   각 회차 load 후 8 s + 맨 아래 스크롤 후 8 s). 크로스오리진 iframe 안의 요청은 그 문서의 정책이 통제하므로
//   우리 목록에 넣지 않는다 — 그래서 지도가 안에서 부르는 `maps.googleapis.com`·`maps.gstatic.com`·
//   `fonts.googleapis.com`·`fonts.gstatic.com` 과 광고 크리에이티브가 이 목록에 없다. 우리에게 필요한 것은
//   그 iframe 자체를 허락하는 `frame-src` 한 줄이다.
//
//   측정된 출처(12/12 회차):
//     · `https://cdn.jsdelivr.net` — 프리텐다드 글꼴(app/[locale]/layout.tsx:108-109 의 preload+stylesheet).
//       css 1 개 + woff 5~13 개(동적 서브셋)를 같은 CDN 에서 싣는다 → style-src 와 font-src 둘 다.
//     · `https://www.google.com` — 푸터 지도 iframe(components/sections/Footer.tsx:13,84) · 광고가 만드는
//       recaptcha aframe. 둘 다 우리 문서의 **직속 자식 프레임**으로 실측 → frame-src.
//     · 광고(아래 AD_ORIGINS) — 광고를 켠 배포에만 연다.
//   측정 결과 **브라우저가 부르지 않는** 바깥 주소(목록에 넣지 않는 근거):
//     · `api.openalex.org`(lib/citations.ts:10) · `ip-api.com`(app/api/track/route.ts:78 · api/ip-location) =
//       서버에서만 부른다(서버 컴포넌트 await · 라우트 핸들러).
//     · `doi.org`(논문 31) · `maps.google.com` · `map.naver.com` · `inha.ac.kr` · `thermaltwophaseflowlab.org` ·
//       `buildersgate.com` = `<a href>` 앵커뿐(CSP 는 앵커 이동을 통제하지 않는다).
//     · `schema.org`(JSON-LD @context) · `w3.org/2000/svg`(SVG 이름공간) = 가져오는 주소가 아니다.
//     · 그림 10 곳 전부 자기 출처(`/images/…`)이고 `images.remotePatterns` 가 없다 → `/_next/image` 도 자기 출처.
const FONT_CDN = "https://cdn.jsdelivr.net";
const MAP_FRAME = "https://www.google.com";

// 광고 출처. **광고가 이미 프로덕션에서 돌고 있다**(실측: `/ads.txt` 200 `pub-5472440866841746` ·
//   `/robots.txt` 에 Mediapartners-Google · `/` HTML 에 adsbygoogle.js) — 그래서 이 목록은 가정이 아니라
//   살아 있는 경로이고, 빠뜨리면 광고가 조용히 빈다. 값은 위 12 회 합집합에서 그대로 옮긴 것이다:
//     script  pagead2.googlesyndication.com(adsbygoogle.js · managed/js/adsense/…/show_ads_impl.js) ·
//             ep2.adtrafficquality.google(sodar/sodar2.js)
//     image   pagead2.googlesyndication.com(pagead/gen_204 비콘) · ep1.adtrafficquality.google(pagead/sodar 비콘)
//     fetch·xhr  pagead2.googlesyndication.com · ep1.adtrafficquality.google(getconfig/sodar)
//     frame   googleads.g.doubleclick.net(pagead/html/…/zrt_lookup.html + pagead/ads?client=… = 실제 광고 iframe) ·
//             ep2.adtrafficquality.google(sodar2/255/runner.html — 1 회차 평면 프레임 목록에 실측. 나무 탐침에는
//             직속 자식으로 안 나타났으니 광고 iframe 의 손자로 보이지만, 같은 출처가 이미 script-src 에 있어
//             frame-src 에 적어도 넓히는 것이 없다)
//   광고를 끄면(NEXT_PUBLIC_ADSENSE_CLIENT 미설정 → lib/adsense.ts 가 null) 로더 자체가 출력되지 않으므로
//   이 출처들도 CSP 에서 함께 사라진다 — 켠 배포에만 열리는 조건 분기다(게시판 선례와 같은 게이트 하나).
const AD_ORIGINS = {
  script: ["https://pagead2.googlesyndication.com", "https://ep2.adtrafficquality.google"],
  image: ["https://pagead2.googlesyndication.com", "https://ep1.adtrafficquality.google"],
  connect: ["https://pagead2.googlesyndication.com", "https://ep1.adtrafficquality.google"],
  frame: ["https://googleads.g.doubleclick.net", "https://ep2.adtrafficquality.google"],
};

const SECURITY_HEADERS = (dev: boolean) => {
  const ads = adsenseClient ? AD_ORIGINS : { script: [], image: [], connect: [], frame: [] };
  // 'unsafe-inline'(script) — 인라인 `<script>` 둘이 있다: beforeinstallprompt 스니펫과 JSON-LD
  //   (app/[locale]/layout.tsx:106,110-113) · Next App Router 가 스트리밍 데이터를 인라인으로 싣는다.
  //   nonce 로 바꾸면 머리글이 요청마다 달라져 정적 프리렌더(실측 `x-nextjs-prerender: 1` · cache HIT)가
  //   통째로 동적 렌더가 된다 — 이 물결 밖의 결정이다.
  // 'unsafe-eval' 은 넣지 않는다 — 클라이언트 코드 전수 grep 에 `eval(`·`new Function` 0 건이고,
  //   로컬 빌드 브라우저 시험에서 위반 0 이었다.
  const script = ["'self'", "'unsafe-inline'", ...ads.script].join(" ");
  // 'unsafe-inline'(style) — Next 의 인라인 `<style>` 과 화면 코드의 `style={{…}}` 속성(예: 지도 iframe 의
  //   dark-grade 필터 Footer.tsx:86-89). 속성 스타일은 nonce 로 덮을 수 없다.
  const style = ["'self'", "'unsafe-inline'", FONT_CDN].join(" ");
  // dev 에서만 ws: — 개발 서버의 HMR 소켓. 프로덕션에는 없다.
  const connect = ["'self'", ...(dev ? ["ws:", "wss:"] : []), ...ads.connect].join(" ");
  const csp = [
    "default-src 'self'",
    `script-src ${script}`,
    `style-src ${style}`,
    `img-src ${["'self'", "data:", ...ads.image].join(" ")}`,
    `font-src ${["'self'", FONT_CDN].join(" ")}`,
    `connect-src ${connect}`,
    // 자기 출처 iframe 은 지금 0 건이지만 남겨 둔다(같은 출처를 막아서 얻는 것이 없다).
    `frame-src ${["'self'", MAP_FRAME, ...ads.frame].join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    // 폼 셋 다 자기 출처로 낸다(Lecture.tsx:170 `/lecture/api/auth` · :365 `/board/api/enter` — 둘 다
    //   이 도메인의 프록시 경로다 · admin 은 onSubmit 만).
    "form-action 'self'",
    // 홈페이지는 남의 화면에 실릴 이유가 없다. 실측: 형제 두 저장소(강의 앱 · 게시판)의 iframe 은
    //   강의 앱의 라이브가 **자기 덱**을 싣는 것뿐이고(LiveView.tsx:904, /lecture 하위 = 같은 출처),
    //   mftel.vercel.app 의 마케팅 화면을 iframe 으로 싣는 코드는 0 건이다.
    "frame-ancestors 'none'",
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    // frame-ancestors 'none' 의 낡은 브라우저용 짝.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // 이 사이트는 카메라·마이크·위치·결제·USB 를 쓰지 않는다(지도 iframe 은 장소 고정 embed 라 위치를 묻지 않는다 —
    //   로컬 시험에서 permissions policy 위반 0). 광고가 쓰는 기능(attribution-reporting·browsing-topics 등)은
    //   목록에 없으므로 기본값 그대로 산다.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    // 플랫폼이 이미 같은 값을 보낸다(실측). 그래도 적는다 — 정책의 소유자가 플랫폼 설정이 아니라 이 파일이어야 한다.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    // ⟦ACAO⟧ 실측(2026-09-25): `access-control-allow-origin: *` 는 **정적 프리렌더 응답에만** 붙는다 —
    //   `x-nextjs-prerender: 1` + `x-vercel-cache: HIT` 인 5 주소(`/` `/en` `/lecture` `/en/privacy`
    //   `/robots.txt`)에 있고, 함수가 내는 응답(`/api/analytics` `/ads.txt` `/opengraph-image`)에는 없다.
    //   이 저장소 코드에 그 머리글 이름은 0 회이므로 붙이는 층은 플랫폼 CDN 이다.
    //   Next 의 headers() 는 머리글을 **지울 수 없고 덮을 수만** 있어, 와일드카드를 자기 출처로 좁혀 적는다.
    //   잃는 것이 없다는 근거: 형제 두 저장소에서 `mftel.vercel.app` 을 fetch 하는 코드 0 건(전수 grep) ·
    //   이 사이트의 클라이언트 fetch 는 전부 상대경로(자기 출처)다. 크롤러·OG 수집기는 CORS 를 쓰지 않으므로
    //   무영향이다.
    { key: "Access-Control-Allow-Origin", value: CANONICAL_ORIGIN },
    // 위 한 줄이 플랫폼 값을 못 덮을 경우(로컬에서는 플랫폼 층이 없어 확인할 수 없다)를 대비한 둘째 줄.
    //   와일드카드가 허락하려던 「다른 출처가 이 자원을 싣는 일」을 no-cors 경로에서 막는다. 이 사이트의
    //   모든 참조가 같은 출처라 잃는 기능이 없다(강의 앱 P3 선례와 같은 값·같은 까닭).
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
};

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // 보안 머리글은 **이 프로젝트가 스스로 만드는 응답에만** 붙인다. `/lecture/…` 와 `/board…` 는 아래
  //   rewrites 가 형제 프로젝트로 넘기는 주소이고, 그 앱들은 자기 정책을 스스로 낸다(강의 앱은 덱 엔진
  //   8 벌 때문에 `'unsafe-eval'` 이 필요해 값이 다르다 — 우리 CSP 를 그 응답에 씌우면 덱이 통째로 죽는다).
  //   그래서 source 에서 두 갈래를 부정 전방탐색으로 뺀다. 맨 `/lecture` 는 **빼지 않는다** — 그 주소의
  //   주인은 이 사이트 자신의 강의 페이지다(rewrites 주석과 같은 경계).
  async headers() {
    return [
      {
        source: "/:path((?!lecture/|board(?:/|$)).*)",
        headers: SECURITY_HEADERS(process.env.NODE_ENV !== "production"),
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
