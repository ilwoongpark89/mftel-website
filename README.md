# mftel-website

인하대학교 다상유동열공학연구실(MFTEL) 홈페이지. 프로덕션: https://mftel.vercel.app

- Next.js (App Router) + TypeScript + Tailwind. 로케일 2트리(`/` = KR, `/en` = EN — URL이 정본, `proxy.ts`가 라우팅).
- 홈은 단일 스토리(`components/home/scenes.tsx`), 아카이브는 라우트(`/research` `/publications` `/projects` `/team` `/news` `/gallery` `/lecture` `/join`).
- 데이터 정본은 `app/data/index.ts`(논문·특허·과제·구성원·갤러리). 번역 사전은 `lib/LanguageContext.tsx`.
- `/lecture/*` 는 `next.config.ts` beforeFiles 프록시로 강의 플랫폼(mftel-lecture.vercel.app)에 연결된다. 배포 순서 계약 포함 — 주석 참조.

## 개발·배포

```bash
npm run dev        # 개발 서버
npm run build      # 빌드 검증
scripts/deploy.sh  # 배포 (dirty 가드 + vercel --prod + 프로덕션 도달 확인)
```
