# SITE-SOT — mftel-website 내용 정본

이 사이트가 말하는 «사실»의 출처 지도와, 카피 판정의 결정 원장이다. 카피를 쓰거나 고칠 때 순서는:
**① 이 문서에서 사실과 출처를 확인 → ② `docs/copy-rules.md`(문체 규칙·판정 절차)를 적용 → ③ `node tools/copy-gate.mjs` 통과.**
표면(코드)의 문안 자체는 코드가 정본이고, 이 문서는 «어디서 왔는가»와 «왜 그렇게 정했는가»를 소유한다.

## 1. 사실 원장 — 정보와 출처

| 영역 | 정본 위치 | 비고 |
|---|---|---|
| 연구실 정체 | 명칭 «인하대학교 다상유동열공학연구실(MFTEL)» · 주소 «인천 미추홀구 인하로 100, 인하대학교 2N687» · 전화 +82-32-860-7335 · 메일 ilwoongpark@inha.ac.kr | `components/sections/Footer.tsx` CONTACT |
| 교수 표어 | «to engineer a safer, more efficient, and sustainable energy future» → 히어로 «지속가능한 에너지의 미래를 설계하다» | `~/claude/MFTEL/site-originals/About.rtf` (교수 저작) — OG 제목·히어로가 승계 |
| 연구 3분야 | 열에너지 저장 · AI 반도체 냉각(=2상 액침 냉각) · SMR 안전 | `components/sections/Research.tsx` CONTENT — 수치(90%·PUE·비교표)는 교수 요약 슬라이드(`site-originals/*.png`) 유래 |
| 논문 27편 | `app/data/index.ts` publications — 번호 = 배열 number 필드. 본문에서 논문을 지칭할 때 반드시 이 번호로 | DOI 링크 포함 |
| 특허 18건 | `app/data/index.ts` patents — **titleKR = 공식 출원 국문 자구(어휘 승계 1순위)** | 예: «배터리 액침 냉각»·«피동응축 열교환기» |
| 과제 15건 | `app/data/index.ts` projects — 영문 제목의 원본은 `site-originals/Projects.rtf`(교수 저작) | 원본과 다르게 개작하지 않는다 |
| 구성원 | `app/data/index.ts` teamMembers(11명)·alumni — 교수 경력의 원본은 `site-originals/Professor.rtf` | 서울대 직급 = Research **Assistant** Professor (2026-08-26 원본 대조로 정정) |
| 소식 | `components/sections/News.tsx` — 사진 원본 `site-originals/news/`(파일명이 1차 기록) | 공고(ANNOUNCEMENT)는 공고 원문 성격 — 문체 규칙보다 원문 보존 우선 |
| 강의 플랫폼 | /lecture = 로그인 입구. 학번+비밀번호(첫 등록 시 비밀번호 설정+반 코드), 교수 콘솔 /lecture/admin | 흐름 자구의 원본: `~/claude/MFTEL/lecture/app/onboarding/OnboardingForm.tsx` |
| 협력 기관 | `app/data/index.ts` collaborators | NTNU·HZDR·UPC 등 |

## 2. 표면 지도

| 표면 | 파일 | 말하는 것 |
|---|---|---|
| 홈(스토리 7씬) | `components/home/scenes.tsx` + 사전 `lib/LanguageContext.tsx` | 표어·3분야·대표 논문·구성원·협력·수치·모집 |
| /research | `components/sections/Research.tsx` | 3분야 상세(수치·활동·도판) |
| /publications /projects /team /news /gallery | `components/sections/*.tsx` | 데이터 정본의 표시 |
| /lecture | `components/sections/Lecture.tsx` | 플랫폼 로그인 |
| /join | `components/join/join-story.tsx` | 모집 — 연구실 철학(몰입·질문·실패)은 교수 확정 프레임: 어휘는 다듬어도 뜻은 바꾸지 않는다 |
| 메타 | `app/[locale]/layout.tsx`·`opengraph-image.tsx` | 검색·공유 표면 |

## 3. 결정 원장 (2026-08-25~26 전수 판정 — 재료: 전 표면 74건 후보)

### 채택 (규칙·승계 근거로 교체)
- 사전: contact.description «몰입을 아는 …» → «석·박사과정 학생, 박사후연구원, 연구원을 모집합니다…»(News 자구 승계) · nav.joinUs «연구실 모집»→«모집 안내» · hero.join «연구실 지원»→«지원하기» · hero «에너지 미래»→«에너지의 미래» · numbers 라벨 «기록»→«연구 성과», sub «…숫자는 …결과입니다»→«논문·과제·특허 모두 학생들과 함께 만들었습니다.» · about.tes «전력망 구축»→«전력망 안정화» · EN: Grow With MFTEL / Published in international journals / top-tier 제거
- 홈: 씬 Join 의 «물어야 할 것을 …찾습니다» 문장 삭제(판례 P5 동형 — /join 이 담당) · «Inha Univ. 2N687» 로케일 분기 · Navbar aria 로케일 분기 · Footer iframe title 쉼표
- /lecture: «입장» 계열 전량 «로그인»으로(P6 후속) · 고지 «입장 시 동의로 간주»→«로그인 시 위 수집·이용에 동의한 것으로 간주합니다.» · 반 코드 placeholder «교수님 공지»→«예: HT26-2»(원본 승계) · «비밀번호와 반 코드를 정하세요»→«비밀번호를 정하고, 반 코드를 입력하세요»(반 코드는 정하는 것이 아니라 입력하는 것) · forgot 문안 절 구성
- /join: EN «invent questions»→«ask new questions» · EN «being broken»→«keep coming back after failure» · EN «know immersion»→«know deep focus»(액침 냉각과 어휘 충돌) · «물음을 다시 세워»→«다시 정의해»(구판 자구 복원) · «어디든 연구실로 칩니다»→«어디서 일하든 상관없습니다» · «결과와 기록으로 말하는 곳»→«…평가합니다» · «교류가 …훈련이 됩니다»→«교류하면서 …기회가 많습니다»
- /news·/team: «트론헤임 열수력 워크숍»→«NTNU 국제 열수력 워크숍»(본문 자구) · EN SCIE 문장 재작성(«a paper Accept» 비문) · 마감 3중 표시 축소 · «CALL — 모집공고» 동어 정리 · 서울대 경력 Research Assistant Professor/연구조교수(원본 대조 정정 — **교수 확인 요망**)
- /publications·메타: «표면 젖음 특성»→«젖음성»(분야 통용) · «인용 {n}»→«피인용 {n}» · layout description 재작성(Advancing…through 제거) · Team 필러 라벨 EN «AI CHIP COOLING»→«AI SEMICONDUCTOR COOLING»(전 표면 단일화) · join 메타 사실 서술화 · projects 영문 제목 원본(Projects.rtf·News) 자구 복원
- /research: 부제 «…을 통한…»→«전력망 안정화를 위한 열에너지 저장» · EN «Dramatically»→«Significantly»

### 기각 (과잉 교체 방지 — NRC 2.3.2-05)
- «함께 성장하세요»(국문 채용 통용) · «함께하는 사람들»(통용) · join 철학 어휘 «몰입»·«깨지고도»·«약속은 하나입니다»·«시간을 세지 않습니다»·«출발점»·«연구실의 중심»(교수 프레임 서술 — 일상어) · join 헤드라인 대조 1회(W4 허용 한도) · «지원은 이메일 한 통으로 시작합니다»(통용) · OG «Engineering a Sustainable Energy Future»(About.rtf 교수 표어 승계) · 공고 «공고 시작일» 항목(공고 원문 보존) · FAQ 의 본문 중복(FAQ 관례) · publications 편수 병기(필터 UI 관례)
- 빌더스게이트 표기 — 원본 파일명은 «blue pill»: **사실 확인은 사용자 몫**, 보류
- sponsor «SMR Regulation Research Foundation» — 공식 영문명 미확인: 보류

### 사용자 판정 (2026-08-27 — P0, 코퍼스·원본보다 우선)
- 서울대 경력 = **«연구교수 / Research Professor»로 확정** («연구교수라고 써도 됨» — 원본 RTF «Research Assistant Professor»보다 사용자 판정 우선. 사실 원장 §1 의 정정 기록은 이 판정으로 대체)
- 특강 소속 = **«블루필»로 확정** («블루필 대표님 해도 상관없다» — News 제목·본문·EN 반영)

### 대시보드 절제 (2026-08-27 — «누더기 싹다 개선» 지시)
- 실측: `/team-dashboard` → 307 → mftel-db.vercel.app (별개 Vercel 프로젝트·자체 배포). 로컬 트리는 `/en/team-dashboard` 로만 누수(200).
- 절제: UI 트리 `app/[locale]/team-dashboard/`(33파일·1.6만 줄) + `public/sw.js`·`manifest.json`·`icon-512` + 전 페이지 head 의 manifest 링크 + tiptap·katex 의존성 12종. `/en/team-dashboard` 도 리다이렉트로 봉합. **복원 = git revert (이 커밋 하나)**.
- 보존: `/api/dashboard*`·`/api/push*`·`/api/cron-backup` 와 vercel.json 크론 — 공유 Upstash Redis(`mftel:dashboard:*`)의 일일 백업이 라이브 데이터(mftel-db)의 백업일 가능성이 있어 유지. 확실해지면 별도 결정.
- 보안: cron-backup 에 CRON_SECRET 가드(env 설정 시 작동 — **Vercel 에 CRON_SECRET 추가 권장**) · dashboard-admin 인증 fail-close(DASHBOARD_ADMIN_PASSWORD 미설정 시 503 — 종전엔 '1009' 폴백이 실효 비밀번호) · `/api/analytics` 는 'mftel2024admin' 폴백 유지(admin 콘솔 잠금 방지 — **ANALYTICS_PASSWORD env 설정 권장**).

### 게이트 보강 (탐지 회피 적발분)
JSX `{" "}` 분절로 CONTRAST 미탐 · trim()으로 선두 « — » 미탐 · 40자 미만 EN 라벨 미탐 → `tools/copy-gate.mjs` 수정. BANNED-KR 에 «[를을] 통한», BANNED-EN 에 top-tier·shape the future 추가.
