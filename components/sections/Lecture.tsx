"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
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
// 수업 게시판(2026-09-22): 같은 주소 아래 /board 로 프록시된다(next.config.ts rewrites). 이 페이지가 그 진입점이다.
const BOARD_URL = "/board";
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
        if (e === "rate_limited") return isKR ? "요청이 많습니다. 잠시 후 다시 시도하세요." : "Too many requests. Try again shortly.";
        if (e === "server" || e === "server_unconfigured")
            return isKR ? "일시적 오류입니다. 잠시 후 다시 시도하세요." : "Temporary error. Try again shortly.";
        return fallback;
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (busy) return;
        setErr("");
        if (sid.toLowerCase() === "admin" || sid === "교수") {
            // 2026-08-08 실사용 결함 수리: admin + 비밀번호를 쳤으면 그 자리에서 콘솔 로그인까지 —
            //   (구버전은 비밀번호를 버리고 콘솔 로그인 화면으로 이동만 해 "다시 물어보는" 이중 로그인이었다.)
            if (!pw) { location.href = ADMIN_URL; return; }
            setBusy(true);
            let j: { ok?: boolean; error?: string };
            try {
                const r = await fetch("/lecture/admin/api", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ op: "login", password: pw }),
                });
                j = await r.json().catch(() => ({ ok: false }));
            } catch { j = { ok: false, error: "server" }; }
            setBusy(false);
            if (j && j.ok) { location.href = ADMIN_URL; return; }
            setErr(authErr(j && j.error, isKR ? "관리자 비밀번호가 올바르지 않습니다." : "Incorrect admin password."));
            return;
        }
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
        if (!cls.trim()) { setErr(isKR ? "반 코드를 입력하세요." : "Enter the class code (from your instructor)."); return; }
        setBusy(true);
        const j = await post("register", { password: pw, classCode: cls.trim() });
        setBusy(false);
        if (j.ok) location.href = HOME_URL;
        else setErr(j.error === "already"
            ? (isKR ? "이미 등록된 학번입니다. 다시 로그인해 주세요." : "Already registered. Please sign in.")
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
        else setErr(authErr(j && j.error, isKR ? "요청을 보내지 못했습니다. 잠시 후 다시 시도하세요." : "Request failed. Try again shortly."));
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
            <div className="w-full">
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
                        {isKR ? "다른 학번으로 로그인" : "Use a different ID"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="flex w-full flex-1 flex-col">
            {confirming && (
                <p className="mb-5 break-keep text-[13px] leading-[1.7] text-ink-2">
                    <b className="font-semibold text-ember-700">{sid}</b>
                    {isKR ? " — 첫 등록입니다. 비밀번호를 정하고, 반 코드를 입력하세요." : " — first registration. Set a password and enter your class code."}
                </p>
            )}

            <div>
                <label className={labelCls} htmlFor="mf-entry-sid">{isKR ? "학번" : "Student ID"}</label>
                <input
                    id="mf-entry-sid"
                    name="username"
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
                    name="password"
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
                    <label className={labelCls} htmlFor="mf-entry-cls">{isKR ? "반 코드 (교수님 공지)" : "Class code (from your instructor)"}</label>
                    <input
                        id="mf-entry-cls"
                        name="class-code"
                        className={inputCls}
                        value={cls}
                        onChange={(e) => setCls(e.target.value)}
                        placeholder="예: HT26-2"
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
                        : (isKR ? "로그인 →" : "Sign in →")}
            </button>

            <div className="mt-3">
                {resetSent ? (
                    <p className="break-keep text-xs leading-[1.7] text-ink-2">
                        {isKR ? "초기화 요청이 접수되었습니다. 교수님 확인 후 다시 등록하면 됩니다." : "Reset requested. Register again after your instructor confirms."}
                    </p>
                ) : forgot ? (
                    <p className="break-keep text-xs leading-[1.7] text-ink-3">
                        {isKR ? "학번을 입력한 뒤 " : "Enter your ID, then "}
                        <button type="button" onClick={requestReset} disabled={busy} className="font-semibold text-ink-2 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink">
                            {isKR ? "초기화 요청" : "request a reset"}
                        </button>
                        {isKR ? "을 누르세요. 기록은 그대로 남습니다." : ". Your records are kept."}
                    </p>
                ) : (
                    <button type="button" onClick={() => setForgot(true)} className={linkCls}>
                        {isKR ? "비밀번호를 잊었나요?" : "Forgot your password?"}
                    </button>
                )}
            </div>

            {/* 고지 = 의미 단위 2줄 고정 — 폭에 밀린 우연 줄바꿈("입장 시/동의로") 대신 내용/동의 문장으로 나눔. 패널 바닥에 붙는다(왼쪽 문과 키를 맞춤). */}
            <div className="mt-auto pt-8">
            <p className="break-keep border-t border-hairline pt-4 text-xs leading-[1.7] text-ink-3">
                <span className="block">{isKR ? "수집 항목은 학번, 답안, 접속 기록이며 담당 교수만 열람하고 학기가 끝나면 파기합니다." : "Collected: ID, answers, access logs · instructor-only · destroyed after term"}</span>
                <span className="block">{isKR ? "로그인하면 위 수집과 이용에 동의한 것으로 봅니다." : "By signing in, you agree to the collection above."}</span>
            </p>
            </div>
        </form>
    );
}

// 두 문의 공통 틀 — 왼쪽 수업 게시판, 오른쪽 강의 자료. 같은 크기·같은 결로 나란히 선다(2026-09-22 발주자 배치).
const doorCls = "flex flex-col rounded-lg border border-hairline bg-paper p-6 md:p-8";
const doorLabelCls = "font-mono text-xs font-medium uppercase tracking-[0.06em] text-ember-700";
const doorTitleCls = "mt-3 break-keep text-xl font-semibold tracking-tight text-ink";
const doorSubCls = "mt-2 break-keep text-sm leading-[1.7] text-ink-2";

// 게시판 문 — 수업을 고르고 입장 코드를 넣으면 그 자리에서 들어간다(오른쪽 학번 로그인과 같은 꼴, 2026-09-22 발주자 지시).
//   수업 목록은 게시판 자신의 공개 API(/board/api/courses, 입장 코드는 담기지 않는다)에서 읽고,
//   코드 확인은 게시판의 /board/api/enter 가 한다(같은 주소라 게시판 쿠키가 그대로 심긴다). 목록을 못 읽으면 게시판 첫 화면으로 보내는 단추 하나.
type BoardCourse = { slug: string; title: string; title_en?: string | null; entry_required: boolean; kind: "gallery" | "ask" };
const BOARD_COURSES_URL = `${BOARD_URL}/api/courses`;
const BOARD_ENTER_URL = `${BOARD_URL}/api/enter`;
const SLUG_RE = /^[a-z0-9-]{2,20}$/;

function BoardDoor({ isKR }: { isKR: boolean }) {
    const [courses, setCourses] = useState<BoardCourse[] | null>(null);
    const [picked, setPicked] = useState("");
    const [code, setCode] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch(BOARD_COURSES_URL, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows: unknown) => {
                if (!alive) return;
                const list = Array.isArray(rows)
                    ? (rows as BoardCourse[]).filter((c) => c && typeof c.slug === "string" && SLUG_RE.test(c.slug) && typeof c.title === "string")
                    : [];
                setCourses(list);
            })
            .catch(() => { if (alive) setCourses([]); });
        return () => { alive = false; };
    }, []);

    const course = courses?.find((c) => c.slug === picked) ?? null;
    const needsCode = !!course && course.entry_required;

    // 게시판으로 건너갈 때 이 화면의 언어를 같이 넘긴다(게시판은 cb_lang 쿠키를 먼저 본다). 안 넘기면 브라우저 언어로 다시 정해져 화면이 바뀐다.
    function go(slug: string) {
        try {
            document.cookie = `cb_lang=${isKR ? "ko" : "en"}; path=${BOARD_URL}; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        } catch { /* 쿠키가 막힌 환경 — 게시판이 브라우저 언어로 정한다 */ }
        setBusy(false); // 뒤로 가기로 이 화면이 되살아나도(bfcache) 단추가 잠겨 있지 않게, 옮기기 전에 푼다.
        location.href = `${BOARD_URL}/${slug}`;
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (busy) return;
        setErr("");
        if (!course) { setErr(isKR ? "수업을 먼저 골라 주세요." : "Pick your course first."); return; }
        // 코드가 필요 없는 수업, 또는 코드를 비워 둔 경우: 게시판으로 바로 간다 — 전에 들어온 적이 있으면 그 쿠키로 들어가고,
        //   아니면 게시판이 그 수업의 코드 화면을 연다. (코드를 다시 모르는 학생이 여기서 막히지 않게.)
        if (!needsCode || !code.trim()) { go(course.slug); return; }
        setBusy(true);
        try {
            const res = await fetch(BOARD_ENTER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim(), slug: course.slug }),
            });
            const j = (await res.json().catch(() => ({}))) as { slug?: string; error?: string; code?: string };
            if (res.ok && j.slug && SLUG_RE.test(j.slug)) { go(j.slug); return; }
            setBusy(false);
            setErr(
                j.code === "rate_limited"
                    ? (isKR ? "코드를 너무 여러 번 잘못 넣었습니다. 잠시 뒤 다시 해 주세요." : "Too many wrong codes. Try again shortly.")
                    : j.code === "bad_code" || res.status === 400
                        ? (isKR ? "코드가 맞지 않습니다. 화면에 보이는 코드를 다시 확인해 주세요." : "That code is not right. Check the code shown in class.")
                        : (isKR ? "일시적 오류입니다. 잠시 후 다시 시도하세요." : "Temporary error. Try again shortly."),
            );
        } catch {
            setBusy(false);
            setErr(isKR ? "연결이 끊겼습니다. 잠시 후 다시 시도하세요." : "Connection lost. Try again shortly.");
        }
    }

    // 진짜 라디오를 쓴다(화살표 이동 · 탭 한 번 · 읽어 주는 이름은 legend). 보이는 줄은 label 이 그리고, 입력은 sr-only 로 숨긴다.
    const rowCls = (on: boolean) =>
        `flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 text-sm font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ember-700 md:min-h-11 ${
            on ? "border-ember-700 bg-white text-ink ring-1 ring-ember-700" : "border-hairline bg-white text-ink hover:border-hairline-2"
        }`;

    return (
        <div className={doorCls}>
            <p className={doorLabelCls}>{isKR ? "수업 게시판" : "Class board"}</p>
            <h3 className={doorTitleCls}>{isKR ? "입장 코드로 들어가기" : "Enter with the class code"}</h3>
            <p className={doorSubCls}>
                {isKR
                    ? "수업 시간에 교수님이 낸 질문에 답하고, 만든 결과물을 올려 함께 봅니다."
                    : "Answer the questions posed in class and post your work for everyone to see."}
            </p>
            {courses && courses.length > 0 ? (
                <form onSubmit={submit} className="mt-6 flex flex-1 flex-col">
                    <fieldset className="m-0 min-w-0 border-0 p-0">
                        <legend className={labelCls}>{isKR ? "수업" : "Course"}</legend>
                        <div className="grid gap-2">
                            {courses.map((c) => {
                                const on = c.slug === picked;
                                return (
                                    <label key={c.slug} className={rowCls(on)}>
                                        <input
                                            type="radio"
                                            name="board-course"
                                            value={c.slug}
                                            checked={on}
                                            onChange={() => { setPicked(c.slug); setErr(""); }}
                                            className="sr-only"
                                        />
                                        <span className="break-keep">{isKR || !c.title_en ? c.title : c.title_en}</span>
                                        <span className="shrink-0 text-xs text-ink-3">
                                            {c.kind === "gallery" ? (isKR ? "결과물" : "Work") : (isKR ? "질문·답" : "Q&A")}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                    {(!course || needsCode) && (
                        <div className="mt-4">
                            <label className={labelCls} htmlFor="mf-board-code">{isKR ? "입장 코드" : "Entry code"}</label>
                            <input
                                id="mf-board-code"
                                name="entry-code"
                                className={inputCls}
                                value={code}
                                onChange={(e) => { setCode(e.target.value); if (err) setErr(""); }}
                                placeholder={isKR ? "수업 중에 알려 준 코드" : "The code given in class"}
                                autoComplete="off"
                                autoCapitalize="characters"
                            />
                        </div>
                    )}
                    {err && <p role="alert" className="mt-3 break-keep text-[13px] leading-[1.6] text-danger">{err}</p>}
                    <div className="mt-auto pt-6">
                        <button type="submit" className={ctaCls} disabled={busy}>
                            {busy ? (isKR ? "확인 중…" : "Checking…") : (isKR ? "게시판 들어가기 →" : "Enter the board →")}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-auto pt-6">
                    <a href={BOARD_URL} className={ctaCls}>{isKR ? "게시판 열기 →" : "Open the board →"}</a>
                    <p className="mt-3 break-keep text-xs leading-[1.7] text-ink-3">
                        {isKR ? "입장 코드는 수업 중에 교수님이 알려 줍니다." : "Your instructor gives out the entry code in class."}
                    </p>
                </div>
            )}
        </div>
    );
}

function LectureDoor({ isKR }: { isKR: boolean }) {
    return (
        <div className={doorCls}>
            <p className={doorLabelCls}>{isKR ? "강의 자료" : "Course materials"}</p>
            <h3 className={doorTitleCls}>{isKR ? "학번으로 로그인" : "Sign in with your student ID"}</h3>
            <p className={doorSubCls}>
                {isKR ? "수강 중인 수업의 자료와 문제를 이어서 봅니다." : "Continue with the materials and problems of your courses."}
            </p>
            <div className="mt-6 flex flex-1 flex-col">
                <EntryForm isKR={isKR} />
            </div>
        </div>
    );
}

export default function Lecture() {
    const { language, lp } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="lecture" surface="white" compact>
            {/* 머리(08 — 강의)를 위로 올리고, 그 아래 두 문을 좌우로: 왼쪽 수업 게시판, 오른쪽 강의 자료 (2026-09-22). */}
            <SectionHeader
                index="08"
                kicker={isKR ? "강의" : "Lecture"}
                title={isKR ? "수업으로 들어가기" : "Enter Your Class"}
                sub={
                    <span className="break-keep [overflow-wrap:break-word] [text-wrap:pretty]">
                        {isKR
                            ? "수업 중 게시판은 입장 코드로, 강의 자료는 학번으로 들어갑니다."
                            : "The class board opens with an entry code; course materials open with your student ID."}
                    </span>
                }
                isKorean={isKR}
                className="mb-8 md:mb-10"
            />
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                <BoardDoor isKR={isKR} />
                <LectureDoor isKR={isKR} />
            </div>
            {/* 광고 고지 — 두 문에 함께 해당. 자세한 것은 처리방침으로. */}
            <p className="mt-6 break-keep text-xs leading-[1.7] text-ink-3">
                {isKR ? "이 사이트는 구글 애드센스 광고를 싣고, 광고 쿠키가 쓰입니다. " : "This site carries Google AdSense ads and uses advertising cookies. "}
                <Link href={lp("/privacy")} className="underline underline-offset-[3px] hover:text-ink">
                    {isKR ? "개인정보 처리방침" : "Privacy policy"}
                </Link>
            </p>
        </Band>
    );
}
