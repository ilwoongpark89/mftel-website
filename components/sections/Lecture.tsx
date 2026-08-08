"use client";

import { useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader } from "@/components/ui/typo";

/**
 * CALORIMETER §08 LECTURE — the site's lecture page IS the platform entrance
 * (2026-08-08 mandate: 홈페이지 통일성 1번, 로그인 그 자리에). Grammar = the
 * archive pages: white band, left axis, unboxed. The sign-in is ONE horizontal
 * control row (Publications filter-row idiom — uses the width instead of a
 * narrow stack), one instruction line, one consent line. No instructor link —
 * console users go to /lecture/admin directly (2026-08-08 v4 교정: 중복 문장·
 * 세로 쌓기·교수자 각주 제거). TOFU = platform auth contract (status →
 * login|register, same-origin via the beforeFiles proxy).
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

const inputCls =
    "h-11 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-ink placeholder:text-ink-4 transition-colors duration-150 hover:border-hairline-2 focus:border-hairline-2 focus:outline-none";
const labelCls = "mb-1.5 block text-xs font-semibold text-ink-2";
const ctaCls =
    "inline-flex h-11 items-center justify-center rounded-full bg-ember-700 px-10 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ember-800 disabled:opacity-55";
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <p className="break-keep text-[15px] font-semibold text-ink">
                    {isProf
                        ? (isKR ? "교수자로 로그인되어 있습니다." : "Signed in as instructor.")
                        : (isKR ? `${sessionSid} 님, 로그인되어 있습니다.` : `Signed in as ${sessionSid}.`)}
                </p>
                <a href={isProf ? ADMIN_URL : HOME_URL} className={ctaCls}>
                    {isProf ? (isKR ? "관리 콘솔로 →" : "Open console →") : (isKR ? "내 수업으로 →" : "My courses →")}
                </a>
                {!isProf && (
                    <button type="button" onClick={signOut} disabled={busy} className={linkCls}>
                        {isKR ? "다른 학번으로 입장" : "Use a different ID"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={submit}>
            {confirming && (
                <p className="mb-4 break-keep text-[13px] leading-[1.7] text-ink-2">
                    <b className="font-semibold text-ember-700">{sid}</b>
                    {isKR
                        ? " — 처음 등록하는 학번입니다. 비밀번호(8자 이상)와 교수님이 공지한 반 코드를 넣으면 수업까지 한 번에 열립니다."
                        : " is new — set a password (8+ chars) and enter the class code from your instructor to open the course in one step."}
                </p>
            )}

            {/* 한 줄 컨트롤 행 — Publications 필터 행과 같은 문법 (좁은 세로 쌓기 대신 가로폭 사용) */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-44">
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
                <div className="w-full sm:w-56">
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
                    <div className="w-full sm:w-44">
                        <label className={labelCls} htmlFor="mf-entry-cls">{isKR ? "반 코드" : "Class code"}</label>
                        <input
                            id="mf-entry-cls"
                            className={inputCls}
                            value={cls}
                            onChange={(e) => setCls(e.target.value)}
                            placeholder={isKR ? "교수님 공지" : "From instructor"}
                            autoComplete="off"
                        />
                    </div>
                )}
                <button type="submit" className={ctaCls} disabled={busy}>
                    {busy
                        ? (isKR ? "확인 중…" : "Checking…")
                        : confirming
                            ? (isKR ? "등록하고 시작 →" : "Register and start →")
                            : (isKR ? "입장 →" : "Enter →")}
                </button>
            </div>

            {err && (
                <p role="alert" className="mt-3 break-keep text-[13px] leading-[1.6] text-danger">{err}</p>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
                {resetSent ? (
                    <p className="break-keep text-xs leading-[1.7] text-ink-2">
                        {isKR
                            ? "초기화 요청이 접수되었습니다 — 교수님 확인 후 재등록하면 됩니다 (학습 기록 유지)."
                            : "Reset request received — register again after your instructor confirms (records are kept)."}
                    </p>
                ) : forgot ? (
                    <p className="break-keep text-xs leading-[1.7] text-ink-3">
                        {isKR ? "학번을 입력하고 " : "Enter your ID and "}
                        <button type="button" onClick={requestReset} disabled={busy} className="font-semibold text-ink-2 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink">
                            {isKR ? "초기화 요청" : "request a reset"}
                        </button>
                        {isKR ? " — 기록은 유지되고 비밀번호만 다시 설정됩니다." : " — records are kept, only the password is set again."}
                    </p>
                ) : (
                    <button type="button" onClick={() => setForgot(true)} className={linkCls}>
                        {isKR ? "비밀번호를 잊었나요?" : "Forgot your password?"}
                    </button>
                )}
            </div>

            <p className="mt-2 break-keep text-[11px] leading-[1.7] text-ink-4">
                {isKR
                    ? "수집: 학번·답안·접속 기록 · 담당 교수만 열람 · 학기 종료 후 파기 — 입장 시 동의로 간주합니다."
                    : "Collected: ID, answers, access logs · instructor-only · destroyed after the term — entering implies consent."}
            </p>
        </form>
    );
}

export default function Lecture() {
    const { language } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="lecture" surface="white">
            <SectionHeader
                index="08"
                kicker={isKR ? "강의" : "Lecture"}
                title={isKR ? "강의" : "Lectures"}
                sub={
                    isKR
                        ? "학번으로 로그인하면 수강 중인 수업이 모두 열립니다 — 처음이면 그 자리에서 비밀번호를 만들면 됩니다."
                        : "Sign in with your student ID to open all of your courses — first-time users set a password on the spot."
                }
                isKorean={isKR}
            />
            <EntryForm isKR={isKR} />
        </Band>
    );
}
