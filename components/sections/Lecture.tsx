"use client";

import { useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader, Meta } from "@/components/ui/typo";

/**
 * CALORIMETER §08 LECTURE — the site's own lecture page doubles as the
 * platform entrance (2026-08-08 mandate: 홈페이지 통일성 1번, 로그인 그 자리에).
 * Left: one muted sample of a real lesson screen (never the catalog — MIT-OCW
 * restraint). Right: production login card, TOFU identical to the platform
 * onboarding (status → login|register against /lecture/api/auth, same-origin
 * via the beforeFiles proxy). Course list below is information, not links —
 * course selection belongs to /lecture/home after sign-in. The old external
 * subdomain cards are gone with the old bare-/lecture rewrite.
 */

const COURSES = [
    { title: "Heat Transfer", titleKR: "열전달", chapters: 15 },
    { title: "Numerical Analysis", titleKR: "수치해석", chapters: 15 },
    { title: "Phase-Change Heat Transfer", titleKR: "상변화열전달", chapters: 4 },
    { title: "Prompt Engineering Basics", titleKR: "프롬프트 엔지니어링 기초", chapters: 7 },
    { title: "Advanced Prompt Engineering", titleKR: "프롬프트 엔지니어링 심화", chapters: 4 },
] as const;

const AUTH_URL = "/lecture/api/auth";
const HOME_URL = "/lecture/home";
const ADMIN_URL = "/lecture/admin";
const SID_RE = /^[A-Za-z0-9-]{4,32}$/;

/** Muted static sample — representative lesson screen, illustrative data only. */
function SamplePane({ isKR }: { isKR: boolean }) {
    return (
        <div className="flex flex-col rounded-lg border border-hairline bg-white p-3.5">
            <div className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-md border border-hairline bg-well">
                <div className="flex items-center justify-between border-b border-hairline px-3 py-2 text-[10px] text-ink-4">
                    <span>
                        <b className="font-semibold text-ink-2">{isKR ? "열전달" : "Heat Transfer"}</b>
                        {isKR ? " — 열교환기 설계" : " — Heat Exchanger Design"}
                    </span>
                    <span>{isKR ? "화면 12 / 14" : "Screen 12 / 14"}</span>
                </div>
                <div className="grid flex-1 grid-cols-[1.2fr_1fr] gap-2.5 p-3">
                    <div className="relative rounded-md border border-hairline bg-white">
                        <svg viewBox="0 0 200 150" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                            <line x1="24" y1="18" x2="24" y2="126" stroke="#D6D3D1" strokeWidth="1.5" />
                            <line x1="24" y1="126" x2="184" y2="126" stroke="#D6D3D1" strokeWidth="1.5" />
                            <path d="M28 30 C 70 34, 120 78, 180 118" fill="none" stroke="#FFB98A" strokeWidth="2.2" />
                            <path d="M28 118 C 80 112, 130 60, 180 30" fill="none" stroke="#D6D3D1" strokeWidth="1.6" strokeDasharray="4 3" />
                            <circle cx="104" cy="74" r="3" fill="#F97316" />
                            <text x="98" y="64" fontSize="8" fill="#C2410C">T_h</text>
                            <text x="30" y="24" fontSize="7" fill="#A8A29E">T</text>
                            <text x="176" y="140" fontSize="7" fill="#A8A29E">x</text>
                        </svg>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="rounded-md border border-hairline bg-white px-2.5 py-2 text-[10.5px] leading-[1.5] text-ink-2">
                            <b className="mb-0.5 block text-[9px] font-extrabold tracking-wider text-ink-3">
                                {isKR ? "Q4 · 개념" : "Q4 · Concept"}
                            </b>
                            {isKR
                                ? "대향류에서 두 유체의 온도 교차가 가능한 이유는?"
                                : "Why can the two outlet temperatures cross in a counterflow exchanger?"}
                        </div>
                        {[
                            { kr: "열용량유량이 다르므로", en: "Heat-capacity rates differ", sel: false },
                            { kr: "국소 온도차가 항상 유지되므로", en: "A local ΔT is maintained throughout", sel: true },
                            { kr: "병류보다 면적이 작으므로", en: "Less area than parallel flow", sel: false },
                        ].map((o, i) => (
                            <div
                                key={o.en}
                                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${
                                    o.sel ? "border-ember-200 bg-ember-50 text-ink" : "border-hairline bg-white text-ink-3"
                                }`}
                            >
                                <span className="flex h-3 w-3 items-center justify-center rounded-full border-[1.5px] border-current text-[7px]">
                                    {i + 1}
                                </span>
                                {isKR ? o.kr : o.en}
                            </div>
                        ))}
                        <span className="mt-0.5 self-end rounded-md bg-ember-100 px-3 py-1 text-[10px] font-extrabold text-ember-800">
                            {isKR ? "제출" : "Submit"}
                        </span>
                    </div>
                </div>
            </div>
            <Meta className="mt-2.5 text-xs">
                {isKR
                    ? "실제 수업 화면의 축소 표현 — 대표 예시"
                    : "Reduced view of an actual lesson screen — illustrative"}
            </Meta>
        </div>
    );
}

// Session detect — lect_sid is the platform's non-httpOnly display cookie.
//   Read as an external store (server snapshot = "": SSR always renders the guest
//   form, a signed-in browser swaps to the doorway state on hydration).
const subscribeNoop = () => () => {};
function readSidCookie(): string {
    const hit = document.cookie.split("; ").find((c) => c.startsWith("lect_sid="));
    return hit ? decodeURIComponent(hit.slice("lect_sid=".length)) : "";
}

/** Inline sign-in — same TOFU contract as the platform onboarding. */
function EntryCard({ isKR }: { isKR: boolean }) {
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
            if (!s.claimed) {
                setBusy(false);
                setConfirming(true);
                return;
            }
            const j = await post("login", { password: pw });
            setBusy(false);
            if (j.ok) location.href = HOME_URL;
            else setErr(j.error === "bad_login"
                ? (isKR ? "비밀번호가 올바르지 않습니다." : "Incorrect password.")
                : authErr(j.error, isKR ? "로그인 실패." : "Sign-in failed."));
            return;
        }
        // confirming: first visit — register with the entered password.
        if (pw.length < 8) { setErr(isKR ? "비밀번호는 8자 이상." : "Password must be 8+ characters."); return; }
        setBusy(true);
        const j = await post("register", { password: pw });
        setBusy(false);
        if (j.ok) location.href = HOME_URL;
        else setErr(j.error === "already"
            ? (isKR ? "이미 등록된 학번입니다. 다시 로그인해 주세요." : "Already registered — please sign in.")
            : authErr(j.error, isKR ? "등록 실패." : "Registration failed."));
    }

    // DELETE clears both platform cookies; the re-render re-reads the cookie store → guest form returns.
    async function signOut() {
        setBusy(true);
        await fetch(AUTH_URL, { method: "DELETE" }).catch(() => null);
        setSid(""); setPw(""); setErr(""); setConfirming(false);
        setBusy(false);
    }

    const input =
        "h-11 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-ink placeholder:text-ink-4 transition-colors duration-150 hover:border-hairline-2 focus:border-hairline-2 focus:outline-none";
    const label = "mb-1.5 block text-xs font-semibold text-ink-2";
    const cta =
        "flex min-h-11 w-full items-center justify-center rounded-lg bg-ember-700 px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-ember-800 disabled:opacity-55";

    // Signed-in states — the card becomes a doorway, not a form.
    if (sessionSid) {
        const isProf = sessionSid === "__prof__";
        return (
            <div className="flex flex-col rounded-lg border border-hairline bg-white p-6">
                <Meta className="text-xs text-ember-700">For students</Meta>
                <h3 className="mt-1.5 break-keep text-lg font-bold text-ink">
                    {isProf
                        ? (isKR ? "교수자 로그인됨" : "Signed in as instructor")
                        : (isKR ? `${sessionSid} 님, 로그인되어 있습니다` : `Signed in as ${sessionSid}`)}
                </h3>
                <a href={isProf ? ADMIN_URL : HOME_URL} className={`${cta} mt-5`}>
                    {isProf ? (isKR ? "관리 콘솔로 →" : "Open console →") : (isKR ? "내 수업으로 →" : "My courses →")}
                </a>
                {!isProf && (
                    <button
                        type="button"
                        onClick={signOut}
                        disabled={busy}
                        className="mt-3 self-center text-xs text-ink-3 underline underline-offset-2 transition-colors duration-150 hover:text-ink"
                    >
                        {isKR ? "다른 학번으로 입장" : "Use a different ID"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="flex flex-col rounded-lg border border-hairline bg-white p-6">
            <Meta className="text-xs text-ember-700">For students</Meta>
            <h3 className="mt-1.5 break-keep text-lg font-bold text-ink">
                {confirming
                    ? (isKR ? "첫 입장 — 비밀번호 설정" : "First visit — set a password")
                    : (isKR ? "수강생 입장" : "Student sign-in")}
            </h3>

            {confirming && (
                <p className="mt-2 break-keep rounded-lg border border-ember-100 bg-ember-50 px-3 py-2 text-xs leading-[1.7] text-ink-2">
                    {isKR
                        ? <><b className="text-ink">{sid}</b> — 처음 등록하는 학번입니다. 아래 비밀번호(8자 이상)로 등록됩니다.</>
                        : <><b className="text-ink">{sid}</b> is new — it will be registered with the password below (8+ chars).</>}
                </p>
            )}

            <div className="mt-4">
                <label className={label} htmlFor="mf-entry-sid">{isKR ? "학번" : "Student ID"}</label>
                <input
                    id="mf-entry-sid"
                    className={input}
                    value={sid}
                    onChange={(e) => { setSid(e.target.value.trim()); if (confirming) setConfirming(false); }}
                    inputMode="numeric"
                    placeholder={isKR ? "예: 12231234" : "e.g. 12231234"}
                    autoComplete="username"
                />
            </div>
            <div className="mt-3">
                <label className={label} htmlFor="mf-entry-pw">
                    {confirming ? (isKR ? "비밀번호 설정 (8자 이상)" : "Set password (8+ chars)") : (isKR ? "비밀번호" : "Password")}
                </label>
                <input
                    id="mf-entry-pw"
                    className={input}
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder={confirming ? (isKR ? "나만 아는 비밀번호" : "A password only you know") : "········"}
                    autoComplete={confirming ? "new-password" : "current-password"}
                />
            </div>

            {err && (
                <p role="alert" className="mt-3 break-keep rounded-lg border border-[#F1D2CC] bg-[#FBE9E6] px-3 py-2 text-xs leading-[1.5] text-[#B23A2E]">
                    {err}
                </p>
            )}

            <button type="submit" className={`${cta} mt-4`} disabled={busy}>
                {busy
                    ? (isKR ? "확인 중…" : "Checking…")
                    : confirming
                        ? (isKR ? "등록하고 시작 →" : "Register and start →")
                        : (isKR ? "입장 →" : "Enter →")}
            </button>

            <button
                type="button"
                onClick={() => setForgot((f) => !f)}
                className="mt-3 self-start text-xs text-ink-2 underline underline-offset-2 transition-colors duration-150 hover:text-ink"
            >
                {isKR ? "비밀번호를 잊었나요?" : "Forgot your password?"}
            </button>
            {forgot && (
                <p className="mt-1.5 break-keep text-xs leading-[1.7] text-ink-3">
                    {isKR
                        ? "담당 교수에게 초기화를 요청하세요 — 학습 기록은 유지된 채 비밀번호만 다시 설정됩니다."
                        : "Ask your instructor for a reset — your records are kept and only the password is set again."}
                </p>
            )}

            <p className="mt-3 break-keep text-[10.5px] leading-[1.7] text-ink-4">
                {isKR
                    ? "처음이면 이 자리에서 비밀번호를 설정합니다 — 학번 하나로 내 수업 전부. 수집: 학번·답안·접속 기록 · 목적: 출석·학습 확인 · 담당 교수만 열람 · 보관: 학기 종료 후 파기. 입장 시 동의로 간주합니다."
                    : "First-time users set a password right here — one ID opens all of your courses. Collected: ID, answers, access logs · used for attendance and learning records · visible to your instructor only · destroyed after the term. Entering implies consent."}
            </p>

            <div className="mt-4 border-t border-hairline pt-3 text-xs text-ink-3">
                {isKR ? "교수자·조교 — " : "Instructors & TAs — "}
                <a href={ADMIN_URL} className="font-semibold text-ink-2 underline underline-offset-2 transition-colors duration-150 hover:text-ink">
                    {isKR ? "콘솔 로그인 →" : "console sign-in →"}
                </a>
            </div>
        </form>
    );
}

export default function Lecture() {
    const { language } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="lecture" surface="well" compact>
            <SectionHeader
                index="08"
                kicker={isKR ? "강의" : "Lecture"}
                title={isKR ? "강의" : "Lectures"}
                sub={
                    isKR
                        ? "다상유동열공학연구실이 자체 구축해 운영하는 강의 플랫폼 — 강의 자료와 문항 제출·채점·진도가 한 곳에서 관리됩니다."
                        : "The lab's self-built lecture platform — course materials, per-question submission, grading, and progress in one place."
                }
                isKorean={isKR}
            />

            <div className="grid gap-4 md:grid-cols-[1.45fr_1fr] md:gap-5">
                <SamplePane isKR={isKR} />
                <EntryCard isKR={isKR} />
            </div>

            <div className="mt-8">
                <Meta className="text-xs">{isKR ? "2026-2 개설 수업" : "Courses · 2026-2"}</Meta>
                <div className="mt-2 rounded-lg border border-hairline bg-white">
                    {COURSES.map((c, i) => (
                        <div
                            key={c.title}
                            className={`flex items-baseline justify-between gap-4 px-4 py-3 ${i > 0 ? "border-t border-hairline" : ""}`}
                        >
                            <span className="break-keep text-sm font-semibold text-ink">
                                {isKR ? c.titleKR : c.title}{" "}
                                <span className="font-normal text-ink-3">{isKR ? c.title : c.titleKR}</span>
                            </span>
                            <Meta className="flex-shrink-0 text-xs">
                                {isKR ? `${c.chapters}챕터` : `${c.chapters} chapters`}
                            </Meta>
                        </div>
                    ))}
                </div>
            </div>
        </Band>
    );
}
