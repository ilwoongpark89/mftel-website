#!/usr/bin/env node
/**
 * copy-gate — 카피 규칙 원장(docs/copy-rules.md)의 기계 검사 절을 사용자 노출 문자열에 적용한다.
 * 사용: node tools/copy-gate.mjs        (위반 있으면 exit 1)
 *
 * 검사 대상: 카피 표면 파일들의 문자열 리터럴("…" '…' `…`) + JSX 텍스트 노드.
 * 주석·className·경로 등 비노출 텍스트는 문자열 리터럴이 아니므로 검사에 들어가지 않도록
 * 리터럴 추출 후 휴리스틱(한글 포함 또는 공백 있는 영문 산문)으로 거른다.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

const SURFACE_DIRS = ["components", "lib", "app/[locale]", "app/data"];
const EXCLUDE = [/team-dashboard/, /\/admin\//, /Analytics\.tsx$/];

function listFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) out.push(...listFiles(p));
        else if (/\.(tsx?|mjs)$/.test(name)) out.push(p);
    }
    return out;
}

// ── 원장에서 기계 검사 절 파싱 ──────────────────────────────────────────────
const rules = readFileSync(join(ROOT, "docs/copy-rules.md"), "utf8");
function section(name) {
    const m = rules.match(new RegExp(`### ${name}\\n([\\s\\S]*?)(?=\\n### |$)`));
    if (!m) return [];
    return m[1].split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("("));
}
const BANNED_KR = section("BANNED-KR").map((p) => new RegExp(p));
const BANNED_EN = section("BANNED-EN").map((p) => new RegExp(p, "i"));
const CONTRAST_KR = section("CONTRAST-KR \\(파일당 ≤1\\)").map((p) => new RegExp(p, "g"));
const ALLOW = section("ALLOW \\(원문 제목·인용 — 이 부분 문자열을 포함하면 검사 면제\\. NRC 5\\.1\\.1-21 인용 강등과 동형\\)");

// ── 문자열 리터럴 + JSX 텍스트 추출 ────────────────────────────────────────
function extractStrings(src) {
    const out = [];
    // 주석 제거(리터럴 보호는 근사 — 카피 파일에는 리터럴 안 주석 기호가 드물다)
    const noComments = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/\{"\s*"\}/g, " "); // JSX {" "} 스페이서로 분절된 텍스트 노드를 잇는다 (분절 우회 적발분)
    const litRe = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
    let m;
    while ((m = litRe.exec(noComments))) {
        const s = (m[1] ?? m[2] ?? m[3] ?? "").trim();
        if (!s) continue;
        const hasHangul = /[가-힣]/.test(s);
        const isEnProse = /^[A-Z0-9“"']/.test(s) && /[a-z]/.test(s) && s.includes(" ") && s.length > 12 && !/className|font-|text-|bg-|border|flex|grid|rounded|http|\.(png|jpg|jpeg|svg|css)/.test(s);
        if (hasHangul || isEnProse) out.push(s);
    }
    // JSX 텍스트 노드( >텍스트< )
    const jsxRe = />([^<>{}]*[가-힣][^<>{}]*)</g;
    while ((m = jsxRe.exec(noComments))) out.push(m[1].trim());
    return out;
}

// ── 검사 ──────────────────────────────────────────────────────────────────
let fails = 0;
const files = SURFACE_DIRS.flatMap((d) => listFiles(join(ROOT, d))).filter(
    (p) => !EXCLUDE.some((re) => re.test(p))
);

for (const file of files) {
    const rel = relative(ROOT, file);
    const strings = extractStrings(readFileSync(file, "utf8"));
    let contrastCount = 0;
    for (const s of strings) {
        if (ALLOW.some((a) => s.includes(a))) continue;
        for (const re of BANNED_KR)
            if (re.test(s)) { console.log(`✗ [BANNED-KR ${re.source}] ${rel}\n    「${s.slice(0, 90)}」`); fails++; }
        for (const re of BANNED_EN)
            if (re.test(s)) { console.log(`✗ [BANNED-EN ${re.source}] ${rel}\n    "${s.slice(0, 90)}"`); fails++; }
        for (const re of CONTRAST_KR) { const n = (s.match(re) ?? []).length; contrastCount += n; }
        // EN 산문 em-dash — 선두 구분자(문두 «— »)와 FIG.·PUB. 캡션·짧은 라벨은 제외
        if (!/[가-힣]/.test(s) && s.length > 25 && s.indexOf("—") > 3 && !/^(FIG\.|PUB\.)/.test(s)) {
            console.log(`✗ [EMDASH-EN] ${rel}\n    "${s.slice(0, 90)}"`); fails++;
        }
    }
    if (contrastCount > 1) { console.log(`✗ [CONTRAST>1 (${contrastCount}회)] ${rel}`); fails++; }
}

console.log(fails === 0 ? `✓ copy-gate PASS (표면 ${files.length}파일 · 위반 0)` : `✗ copy-gate FAIL — 위반 ${fails}건`);
process.exit(fails === 0 ? 0 : 1);
