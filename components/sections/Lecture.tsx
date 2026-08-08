"use client";

import { useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader, Meta } from "@/components/ui/typo";

/**
 * CALORIMETER §08 LECTURE — the site's lecture page IS the platform entrance
 * (2026-08-08 mandate: 홈페이지 통일성 1번). Visual grammar = the archive pages
 * (Publications): white band, left axis, unboxed content on hairlines — no
 * card chrome, no showcase blocks. One narrow sign-in form, TOFU identical to
 * the platform onboarding (status → login|register against /lecture/api/auth,
 * same-origin via the beforeFiles proxy). Course listing removed — course
 * choice belongs to /lecture/home after sign-in.
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
    "inline-flex h-11 w-full items-center justify-center rounded-full bg-ember-700 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ember-800 disabled:opacity-55";
const linkCls =
    "text-xs text-ink-3 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink";

function EntryForm({ isKR }: { isKR: boolean }) {
    const sessionSid = useSyncExternalStore(subscribeNoop, readSidCookie, () => "");
    const [confirming, setConfirming] = useState(false);
    const [sid, setSid] = useState("");
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [forgot, setForgot] = useState(false);

    async function post(action: string, extra: Record<string, unknown> = {}) {
        const res = await fetch(AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, studentId: sid, ...extra }),
        });
        return res.json().catch(() => ({ ok: false }));
    }
    function authErr(e: string | undefined, fallback: string): string {
        if (e === "rate_limited") return isKR ? "요청이 많습니다. 잠시 후 다시." : "Too many requests — try again shortly.";
        if (e === "server" || e === "server_unconfigured")
            return isKR ? "일시적 오류입니다. 잠시 후 다시." : "Temporary error — try again shortly.";
        return fallback;
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
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
        setBusy(true);
        const j = await post("register", { password: pw });
        setBusy(false);
        if (j.ok) location.href = HOME_URL;
        else setErr(j.error === "already"
            ? (isKR ? "이미 등록된 학번입니다. 다시 로그인해 주세요." : "Already registered — please sign in.")
            : authErr(j.error, isKR ? "등록 실패." : "Registration failed."));
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
            <div className="max-w-sm">
                <p className="break-keep text-[15px] font-semibold text-ink">
                    {isProf
                        ? (isKR ? "교수자로 로그인되어 있습니다." : "Signed in as instructor.")
                        : (isKR ? `${sessionSid} 님, 로그인되어 있습니다.` : `Signed in as ${sessionSid}.`)}
                </p>
                <a href={isProf ? ADMIN_URL : HOME_URL} className={`${ctaCls} mt-5`}>
                    {isProf ? (isKR ? "관리 콘솔로 →" : "Open console →") : (isKR ? "내 수업으로 →" : "My courses →")}
                </a>
                {!isProf && (
                    <button type="button" onClick={signOut} disabled={busy} className={`${linkCls} mt-4`}>
                        {isKR ? "다른 학번으로 입장" : "Use a different ID"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="max-w-sm">
            {confirming && (
                <p className="mb-5 break-keep text-[13px] leading-[1.75] text-ink-2">
                    <b className="font-semibold text-ember-700">{sid}</b>
                    {isKR
                        ? " — 처음 등록하는 학번입니다. 아래 비밀번호(8자 이상)로 등록됩니다."
                        : " is new — it will be registered with the password below (8+ chars)."}
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

            {err && (
                <p role="alert" className="mt-3 break-keep text-[13px] leading-[1.6] text-[#B23A2E]">{err}</p>
            )}

            <button type="submit" className={`${ctaCls} mt-5`} disabled={busy}>
                {busy
                    ? (isKR ? "확인 중…" : "Checking…")
                    : confirming
                        ? (isKR ? "등록하고 시작 →" : "Register and start →")
                        : (isKR ? "입장 →" : "Enter →")}
            </button>

            <div className="mt-4">
                <button type="button" onClick={() => setForgot((f) => !f)} className={linkCls}>
                    {isKR ? "비밀번호를 잊었나요?" : "Forgot your password?"}
                </button>
                {forgot && (
                    <p className="mt-1.5 break-keep text-xs leading-[1.75] text-ink-3">
                        {isKR
                            ? "담당 교수에게 초기화를 요청하세요 — 학습 기록은 유지된 채 비밀번호만 다시 설정됩니다."
                            : "Ask your instructor for a reset — your records are kept and only the password is set again."}
                    </p>
                )}
            </div>

            <p className="mt-6 break-keep text-[11px] leading-[1.75] text-ink-4">
                {isKR
                    ? "처음이면 이 자리에서 비밀번호를 설정합니다. 수집: 학번·답안·접속 기록 · 목적: 출석·학습 확인 · 담당 교수만 열람 · 보관: 학기 종료 후 파기. 입장 시 동의로 간주합니다."
                    : "First-time users set a password right here. Collected: ID, answers, access logs · used for attendance and learning records · visible to your instructor only · destroyed after the term. Entering implies consent."}
            </p>

            <p className="mt-6 border-t border-hairline pt-4 text-xs text-ink-3">
                {isKR ? "교수자·조교 — " : "Instructors & TAs — "}
                <a href={ADMIN_URL} className="font-semibold text-ink-2 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink">
                    {isKR ? "콘솔 로그인 →" : "console sign-in →"}
                </a>
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
                        ? "학번으로 로그인하면 수강 중인 수업이 모두 열립니다."
                        : "Sign in with your student ID to open all of your courses."
                }
                isKorean={isKR}
            />
            <Meta className="-mt-4 mb-10 block text-xs md:-mt-8">
                {isKR
                    ? "다상유동열공학연구실 자체 강의 플랫폼 · 강의 자료 · 문항 제출 · 채점 · 진도"
                    : "The lab's self-built lecture platform · materials · submissions · grading · progress"}
            </Meta>
            <EntryForm isKR={isKR} />
        </Band>
    );
}
