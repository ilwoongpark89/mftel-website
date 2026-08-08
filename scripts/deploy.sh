#!/usr/bin/env bash
# mftel-website 배포 — 강의 플랫폼(mftel-lecture-unified/scripts/deploy.sh)과 동형의 단일 배포 프로그램 (2026-08-08).
#   가드: tracked dirty 차단(타 세션 미커밋 작업이 그대로 출하되는 사고 방지) → vercel --prod → 프로덕션 도달 확인.
#   배포 순서 계약: 강의 앱(basePath /lecture) 먼저 배포 → 본 사이트(프록시) — next.config.ts rewrites 주석 참조.
set -uo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain -uno 2>/dev/null)" ]; then
  echo "✗ working tree dirty (tracked) — 미커밋 변경이 그대로 배포된다. 커밋 후 재실행."
  exit 1
fi

echo "▶ vercel deploy --prod"
OUT=$(vercel deploy --prod 2>&1) || { echo "$OUT" | tail -6; echo "✗ vercel 실패 — 배포 중단."; exit 1; }
echo "$OUT" | grep -iE "Production:|Aliased|Error" | tail -3

echo "▶ 프로덕션 도달 확인"
CODE=000
for _ in 1 2 3 4 5 6 7 8 9 10; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" https://mftel.vercel.app/lecture)
  [ "$CODE" = "200" ] && break
  sleep 3
done
HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://mftel.vercel.app/)
echo "reach: /=$HOME_CODE · /lecture=$CODE"
{ [ "$CODE" = "200" ] && [ "$HOME_CODE" = "200" ]; } || { echo "✗ 프로덕션 도달 실패"; exit 1; }
echo "✓ 사이트 배포 + 도달 확인 완료"
