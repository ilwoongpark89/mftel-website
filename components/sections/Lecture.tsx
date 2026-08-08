"use client";

import { useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader } from "@/components/ui/typo";

/**
 * CALORIMETER §08 LECTURE — the site's lecture page IS the platform entrance
 * (2026-08-08 mandate: 홈페이지 통일성 1번, 로그인 그 자리에). v5 composition:
 * two-column band — left = the page's voice (kicker/title/sub, site header
 * grammar with DISTINCT kicker·title words like every other section), right =
 * one canonical sign-in column (stacked fields, full-width CTA, one consent
 * line). No instructor link (console = /lecture/admin 직행). TOFU = platform
 * auth contract (status → login|register, same-origin via beforeFiles proxy).
 */

const AUTH_URL = "/lecture/api/auth";
const HOME_URL = "/lecture/home";
const ADMIN_URL = "/lecture/admin";
const SID_RE = /^[A-Za-z0-9-]{4,32}$/;

// Session detect — lect_sid is the platform's non-httpOnly display cookie.
//   External store: server snapshot = "" (SSR renders the guest form frame-0,
//   a signed-in browser swaps to the doorway on hydration).
const subscribeNoop = () => () => {};
function readSidCookie(): string {
    const hit = document.cookie.split("; ").find((c) => c.startsWith("lect_sid="));
    return hit ? decodeURIComponent(hit.slice("lect_sid=".length)) : "";
}

// 모바일 h-12(48px — HIG 44pt 상회) / 데스크톱 h-11 (디자인 심판 2026-08-08 지시)
const inputCls =
    "h-12 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-ink placeholder:text-ink-4 transition-colors duration-150 hover:border-hairline-2 focus:border-hairline-2 focus:outline-none md:h-11";
const labelCls = "mb-1.5 block text-xs font-semibold text-ink-2";
const ctaCls =
    "inline-flex h-12 w-full items-center justify-center rounded-full bg-ember-700 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ember-800 disabled:opacity-55 md:h-11";
const linkCls =
    "inline-flex min-h-11 items-center text-xs text-ink-3 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink";

function EntryForm({ isKR }: { isKR: boolean }) {
    const sessionSid = useSyncExternalStore(subscribeNoop, readSidCookie, () => "");
    const [confirming, setConfirming] = useState(false);
    const [sid, setSid] = useState("");
    const [pw, setPw] = useState("");
    const [cls, setCls] = useState("");           // P3-2: 최초 등록 반코드 (선점 차단 + 등록=수강 1단계)
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [forgot, setForgot] = useState(false);
    const [resetSent, setResetSent] = useState(false); // P3-1: 초기화 요청 접수

    // never-throw: 네트워크 단절도 {ok:false} 로 수렴 — submit 의 setBusy(false) 경로가 항상 실행된다.
    async function post(action: string, extra: Record<string, unknown> = {}) {
        try {
            const res = await fetch(AUTH_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, studentId: sid, ...extra }),
            });
            return await res.json().catch(() => ({ ok: false }));
        } catch {
            return { ok: false, error: "server" };
        }
    }
    function authErr(e: string | undefined, fallback: string): string {
        if (e === "rate_limited") return isKR ? "요청이 많습니다. 잠시 후 다시." : "Too many requests — try again shortly.";
        if (e === "server" || e === "server_unconfigured")
            return isKR ? "일시적 오류입니다. 잠시 후 다시." : "Temporary error — try again shortly.";
        return fallback;
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (busy) return;
        setErr("");
        if (sid.toLowerCase() === "admin" || sid === "교수") { location.href = ADMIN_URL; return; }
        if (!SID_RE.test(sid)) { setErr(isKR ? "학번을 확인해 주세요 (4–32자)." : "Check the student ID (4–32 chars)."); return; }
        if (!confirming) {
            setBusy(true);
            const s = await post("status");
            if (!s.ok) { setBusy(false); setErr(authErr(s.error, isKR ? "학번 형식을 확인하세요." : "Check the student ID.")); return; }
            if (!s.claimed) { setBusy(false); setConfirming(true); return; }
            const j = await post("login", { password: pw });
            setBusy(false);
            if (j.ok) location.href = HOME_URL;
            else setErr(j.error === "bad_login"
                ? (isKR ? "비밀번호가 올바르지 않습니다." : "Incorrect password.")
                : authErr(j.error, isKR ? "로그인 실패." : "Sign-in failed."));
            return;
        }
        if (pw.length < 8) { setErr(isKR ? "비밀번호는 8자 이상." : "Password must be 8+ characters."); return; }
        if (!cls.trim()) { setErr(isKR ? "반 코드를 입력하세요 (교수님 공지)." : "Enter the class code (from your instructor)."); return; }
        setBusy(true);
        const j = await post("register", { password: pw, classCode: cls.trim() });
        setBusy(false);
        if (j.ok) location.href = HOME_URL;
        else setErr(j.error === "already"
            ? (isKR ? "이미 등록된 학번입니다. 다시 로그인해 주세요." : "Already registered — please sign in.")
            : j.error === "bad_class"
                ? (isKR ? "반 코드가 올바르지 않습니다." : "Incorrect class code.")
                : authErr(j.error, isKR ? "등록 실패." : "Registration failed."));
    }

    // P3-1: 비밀번호 초기화 요청 — 앱 안 큐 적재 (교수 콘솔 홈 배지). ok 일 때만 접수 표시 (거짓 접수 방지).
    async function requestReset() {
        if (busy || resetSent) return;
        if (!SID_RE.test(sid)) { setErr(isKR ? "학번을 먼저 입력하세요." : "Enter your student ID first."); return; }
        setBusy(true);
        const j = await post("reset_request");
        setBusy(false);
        if (j && j.ok) { setErr(""); setResetSent(true); }
        else setErr(authErr(j && j.error, isKR ? "요청 전송 실패 — 잠시 후 다시." : "Request failed — try again shortly."));
    }

    // DELETE clears both platform cookies; re-render re-reads the cookie store → guest form returns.
    async function signOut() {
        setBusy(true);
        await fetch(AUTH_URL, { method: "DELETE" }).catch(() => null);
        setSid(""); setPw(""); setErr(""); setConfirming(false);
        setBusy(false);
    }

    if (sessionSid) {
        const isProf = sessionSid === "__prof__";
        return (
            <div className="w-full max-w-sm">
                <p className="break-keep text-[15px] font-semibold text-ink">
                    {isProf
                        ? (isKR ? "교수자로 로그인되어 있습니다." : "Signed in as instructor.")
                        : (isKR ? `${sessionSid} 님, 로그인되어 있습니다.` : `Signed in as ${sessionSid}.`)}
                </p>
                <a href={isProf ? ADMIN_URL : HOME_URL} className={`${ctaCls} mt-6`}>
                    {isProf ? (isKR ? "관리 콘솔로 →" : "Open console →") : (isKR ? "내 수업으로 →" : "My courses →")}
                </a>
                {!isProf && (
                    <button type="button" onClick={signOut} disabled={busy} className={`${linkCls} mt-3`}>
                        {isKR ? "다른 학번으로 입장" : "Use a different ID"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="w-full max-w-sm">
            {confirming && (
                <p className="mb-5 break-keep text-[13px] leading-[1.7] text-ink-2">
                    <b className="font-semibold text-ember-700">{sid}</b>
                    {isKR ? " — 첫 등록입니다. 비밀번호와 반 코드를 정하세요." : " — first registration. Set a password and enter your class code."}
                </p>
            )}

            <div>
                <label className={labelCls} htmlFor="mf-entry-sid">{isKR ? "학번" : "Student ID"}</label>
                <input
                    id="mf-entry-sid"
                    className={inputCls}
                    value={sid}
                    onChange={(e) => { setSid(e.target.value.trim()); if (confirming) setConfirming(false); }}
                    inputMode="numeric"
                    placeholder={isKR ? "예: 12231234" : "e.g. 12231234"}
                    autoComplete="username"
                />
            </div>
            <div className="mt-4">
                <label className={labelCls} htmlFor="mf-entry-pw">
                    {confirming ? (isKR ? "비밀번호 설정 (8자 이상)" : "Set password (8+ chars)") : (isKR ? "비밀번호" : "Password")}
                </label>
                <input
                    id="mf-entry-pw"
                    className={inputCls}
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder={confirming ? (isKR ? "나만 아는 비밀번호" : "A password only you know") : "········"}
                    autoComplete={confirming ? "new-password" : "current-password"}
                />
            </div>
            {confirming && (
                <div className="mt-4">
                    <label className={labelCls} htmlFor="mf-entry-cls">{isKR ? "반 코드" : "Class code"}</label>
                    <input
                        id="mf-entry-cls"
                        className={inputCls}
                        value={cls}
                        onChange={(e) => setCls(e.target.value)}
                        placeholder={isKR ? "교수님 공지" : "From your instructor"}
                        autoComplete="off"
                    />
                </div>
            )}

            {err && (
                <p role="alert" className="mt-3 break-keep text-[13px] leading-[1.6] text-danger">{err}</p>
            )}

            <button type="submit" className={`${ctaCls} mt-6`} disabled={busy}>
                {busy
                    ? (isKR ? "확인 중…" : "Checking…")
                    : confirming
                        ? (isKR ? "등록하고 시작 →" : "Register and start →")
                        : (isKR ? "입장 →" : "Enter →")}
            </button>

            <div className="mt-3">
                {resetSent ? (
                    <p className="break-keep text-xs leading-[1.7] text-ink-2">
                        {isKR ? "초기화 요청 접수 — 교수님 확인 후 재등록하면 됩니다." : "Reset requested — register again after your instructor confirms."}
                    </p>
                ) : forgot ? (
                    <p className="break-keep text-xs leading-[1.7] text-ink-3">
                        {isKR ? "학번 입력 후 " : "Enter your ID, then "}
                        <button type="button" onClick={requestReset} disabled={busy} className="font-semibold text-ink-2 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink">
                            {isKR ? "초기화 요청" : "request a reset"}
                        </button>
                        {isKR ? " — 기록은 유지됩니다." : " — your records are kept."}
                    </p>
                ) : (
                    <button type="button" onClick={() => setForgot(true)} className={linkCls}>
                        {isKR ? "비밀번호를 잊었나요?" : "Forgot your password?"}
                    </button>
                )}
            </div>

            <p className="mt-8 break-keep border-t border-hairline pt-4 text-[11px] leading-[1.7] text-ink-4 [overflow-wrap:break-word] [text-wrap:pretty]">
                {isKR
                    ? "수집: 학번·답안·접속 기록 · 담당 교수만 열람 · 학기 종료 후 파기. 입장 시 동의로 간주합니다."
                    : "Collected: ID, answers, access logs · instructor-only · destroyed after the term. Entering implies consent."}
            </p>
        </form>
    );
}

export default function Lecture() {
    const { language } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="lecture" surface="white">
            {/* 좌 = 페이지의 목소리(사이트 헤더 문법 — kicker·title 은 타 섹션처럼 서로 다른 단어), 우 = 정석 로그인 컬럼 */}
            <div className="grid items-start gap-10 md:grid-cols-[1fr_24rem] md:gap-20">
                <SectionHeader
                    index="08"
                    kicker={isKR ? "강의" : "Lecture"}
                    title={isKR ? "강의실 입장" : "Classroom Entry"}
                    sub={
                        <span className="break-keep [overflow-wrap:break-word] [text-wrap:pretty]">
                            {isKR
                                ? "학번 하나로 수강 중인 수업이 모두 열립니다. 처음이면 그 자리에서 비밀번호를 만듭니다."
                                : "One student ID opens all of your courses. First time? Set a password on the spot."}
                        </span>
                    }
                    isKorean={isKR}
                    className="mb-0 md:mb-0"
                />
                <EntryForm isKR={isKR} />
            </div>
        </Band>
    );
}
