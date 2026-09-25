"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader } from "@/components/ui/typo";

/**
 * 개인정보 처리방침 — 이 주소(mftel.vercel.app) 아래 세 서비스(홈페이지 · /lecture 강의 자료 · /board 수업 게시판)와
 * 광고(구글 애드센스)에 대해, 개인정보 보호법 제30조와 개인정보보호위원회 「개인정보 처리방침 작성지침」(2025. 4.)의
 * 항목(무엇을 · 왜 · 어떻게 · 얼마나 · 어떻게 거부하는지)을 쉬운 말로 적는다. 시행일은 아래 EFFECTIVE.
 */
const EFFECTIVE = "2026-09-22";
const EMAIL = "ilwoongpark@inha.ac.kr";
const TEL = "+82-32-860-7335";

type Row = { k: string; v: string };
type Section = { title: string; lead?: string; rows?: Row[]; paras?: string[] };

const KO: Section[] = [
    {
        title: "1. 이 방침이 적용되는 곳",
        paras: [
            "인하대학교 다상유동열공학연구실(MFTEL)이 운영하는 mftel.vercel.app 과 그 아래 화면 — 연구실 홈페이지, 강의 자료(/lecture), 수업 게시판(/board) — 에 적용됩니다.",
            "개인정보 보호책임자: 박일웅(인하대학교 기계공학과 교수). 문의는 아래 연락처로 보내 주세요.",
        ],
    },
    {
        title: "2. 홈페이지를 볼 때",
        rows: [
            { k: "수집 항목", v: "방문한 페이지, 접속 시각, 머문 시간, 대략의 지역(국가·도시), 브라우저 종류와 화면 크기, 어디서 들어왔는지(유입 경로)" },
            { k: "수집 방법", v: "브라우저가 페이지를 열 때 자동으로 보냅니다" },
            { k: "쓰는 곳", v: "사이트 이용 통계(어느 페이지를 얼마나 보는지)" },
            { k: "보유 기간", v: "수집일부터 1년" },
            { k: "거부 방법", v: "브라우저의 추적 방지·자바스크립트 차단 설정. 거부해도 홈페이지 열람에는 지장이 없습니다" },
        ],
    },
    {
        title: "3. 강의 자료(/lecture)에 로그인할 때",
        rows: [
            { k: "수집 항목", v: "학번, 비밀번호(암호화 저장), 답안과 채점 결과, 접속 기록" },
            { k: "쓰는 곳", v: "수강 확인, 학습 진행 상황 파악, 수업 운영. 담당 교수만 열람합니다" },
            { k: "보유 기간", v: "학기가 끝나면 파기합니다" },
            { k: "거부 방법", v: "로그인하지 않으면 수집되지 않습니다. 다만 강의 자료는 볼 수 없습니다" },
        ],
    },
    {
        title: "4. 수업 게시판(/board)에 들어갈 때",
        rows: [
            { k: "수집 항목", v: "올린 답·주소·그림, 직접 적은 표시 이름(선택), 누른 표, 브라우저를 구분하는 식별값(쿠키), 입장 시도 기록(IP 주소는 원문이 아니라 해시값만)" },
            { k: "쓰는 곳", v: "수업 중 답을 모아 함께 보기, 표 집계, 잘못된 코드 입력 제한" },
            { k: "보유 기간", v: "학기가 끝나면 파기하거나 개인을 알아볼 수 없게 처리합니다" },
            { k: "거부 방법", v: "반 코드를 넣지 않으면 수집되지 않습니다. 올린 글은 본인이 지울 수 있습니다" },
        ],
    },
    {
        title: "5. 광고(구글 애드센스)",
        lead: "이 사이트는 구글 애드센스 광고를 싣습니다. 광고는 구글(Google LLC, 미국)이 내보내며, 그 과정에서 구글이 아래 정보를 수집할 수 있습니다.",
        rows: [
            { k: "수집 항목", v: "쿠키·광고 식별자, 방문한 페이지, 기기·브라우저 정보, 대략의 위치" },
            { k: "수집 방법", v: "광고 스크립트가 브라우저에서 자동으로 수집합니다. 저희는 이 정보를 받지 않으며, 개인을 알아보지 않습니다" },
            { k: "쓰는 곳", v: "광고 게재, 관심사에 맞춘 광고, 광고 효과 측정" },
            { k: "보유 기간", v: "구글의 정책에 따릅니다 (policies.google.com/technologies/ads)" },
            { k: "거부 방법", v: "구글 광고 설정(adssettings.google.com)에서 맞춤 광고 끄기 · 브라우저 쿠키 차단 · 스마트폰의 광고 식별자 재설정/차단(설정 → 개인정보 보호). 거부해도 광고는 나오되 맞춤형이 아닙니다" },
        ],
        paras: ["이 사이트는 대학 수업용이라 14세 미만의 이용을 전제하지 않습니다."],
    },
    {
        title: "6. 이 사이트가 직접 두는 쿠키",
        paras: [
            "언어 선택, 강의 로그인 상태, 게시판 입장 상태와 브라우저 구분값을 쿠키로 둡니다. 브라우저 설정에서 지우거나 막을 수 있으며, 막으면 로그인과 입장이 되지 않습니다.",
        ],
    },
    {
        title: "7. 정보를 맡기거나 넘기는 곳",
        rows: [
            { k: "Vercel Inc. (미국)", v: "웹 서버·호스팅. 서버 위치 서울" },
            { k: "Supabase Inc. (미국)", v: "데이터베이스·파일 보관. 서버 위치 서울" },
            { k: "Google LLC (미국)", v: "광고(5항). 구글이 직접 수집" },
        ],
        paras: ["위 회사들은 각자의 개인정보 정책에 따라 정보를 다룹니다. 이 밖의 곳에는 정보를 넘기지 않습니다. 법령에 따른 요청이 있을 때는 예외입니다."],
    },
    {
        title: "8. 본인의 권리",
        paras: [
            "자기 정보를 보여 달라고, 고쳐 달라고, 지워 달라고 요청할 수 있습니다. 아래 이메일로 보내 주시면 확인 뒤 지체 없이 처리합니다.",
            `연락처: ${EMAIL} · ${TEL} · 인천 미추홀구 인하로 100, 인하대학교 2N687`,
        ],
    },
    {
        title: "9. 바뀔 때",
        paras: [`내용이 바뀌면 이 페이지에 새 시행일과 함께 올립니다. 현재 시행일: ${EFFECTIVE}.`],
    },
];

const EN: Section[] = [
    {
        title: "1. Where this applies",
        paras: [
            "This policy covers mftel.vercel.app, run by the Multiphase Flow & Thermal Engineering Laboratory (MFTEL), Inha University — the lab homepage, course materials (/lecture) and the class board (/board).",
            "Privacy officer: Il Woong Park (Professor, Department of Mechanical Engineering, Inha University). Contact details are below.",
        ],
    },
    {
        title: "2. When you browse the homepage",
        rows: [
            { k: "Collected", v: "pages visited, time of visit, time spent, approximate location (country, city), browser type and screen size, referring site" },
            { k: "How", v: "sent automatically by your browser when a page opens" },
            { k: "Used for", v: "site statistics (which pages are read, how much)" },
            { k: "Kept for", v: "one year from collection" },
            { k: "How to refuse", v: "your browser's tracking-protection or script-blocking settings; the homepage still works" },
        ],
    },
    {
        title: "3. When you sign in to course materials (/lecture)",
        rows: [
            { k: "Collected", v: "student ID, password (stored encrypted), answers and grading results, access logs" },
            { k: "Used for", v: "enrolment checks, learning progress, running the course. Only the instructor can read them" },
            { k: "Kept for", v: "destroyed when the term ends" },
            { k: "How to refuse", v: "nothing is collected unless you sign in; without signing in, course materials are not available" },
        ],
    },
    {
        title: "4. When you enter the class board (/board)",
        rows: [
            { k: "Collected", v: "answers, links and pictures you post, an optional display name, votes, a cookie that tells browsers apart, entry attempts (IP address stored as a hash only)" },
            { k: "Used for", v: "collecting answers during class, counting votes, limiting wrong-code attempts" },
            { k: "Kept for", v: "destroyed or anonymised when the term ends" },
            { k: "How to refuse", v: "nothing is collected unless you enter the code; you can delete what you posted" },
        ],
    },
    {
        title: "5. Advertising (Google AdSense)",
        lead: "This site carries Google AdSense ads. Ads are served by Google LLC (USA), which may collect the following in the process.",
        rows: [
            { k: "Collected", v: "cookies and advertising identifiers, pages visited, device and browser information, approximate location" },
            { k: "How", v: "collected automatically by the ad script in your browser. We do not receive this data and do not identify you" },
            { k: "Used for", v: "serving ads, personalising ads to interests, measuring ad performance" },
            { k: "Kept for", v: "per Google's policy (policies.google.com/technologies/ads)" },
            { k: "How to refuse", v: "turn off ad personalisation at adssettings.google.com · block cookies in your browser · reset or limit the advertising identifier on your phone (Settings → Privacy). Ads still appear, but are not personalised" },
        ],
        paras: ["This site is for university classes and is not intended for children under 14."],
    },
    {
        title: "6. Cookies set by this site",
        paras: [
            "Language choice, course sign-in state, board entry state and a browser identifier are kept in cookies. You can clear or block them in your browser; blocking them prevents signing in and entering.",
        ],
    },
    {
        title: "7. Who processes or receives data",
        rows: [
            { k: "Vercel Inc. (USA)", v: "web hosting; servers located in Seoul" },
            { k: "Supabase Inc. (USA)", v: "database and file storage; servers located in Seoul" },
            { k: "Google LLC (USA)", v: "advertising (section 5); collected by Google directly" },
        ],
        paras: ["These companies handle data under their own privacy policies. Data is not passed to anyone else, except where the law requires it."],
    },
    {
        title: "8. Your rights",
        paras: [
            "You may ask to see, correct or delete your data. Email us and we will act without undue delay after confirming your identity.",
            `Contact: ${EMAIL} · ${TEL} · Inha University 2N687, 100 Inha-ro, Michuhol-gu, Incheon`,
        ],
    },
    {
        title: "9. Changes",
        paras: [`Changes are posted on this page with a new effective date. Current effective date: ${EFFECTIVE}.`],
    },
];

export default function Privacy() {
    const { language, lp } = useLanguage();
    const isKR = language === "KR";
    const sections = isKR ? KO : EN;

    return (
        <Band id="privacy" surface="white" compact>
            <SectionHeader
                kicker={isKR ? "개인정보" : "Privacy"}
                title={isKR ? "개인정보 처리방침" : "Privacy Policy"}
                sub={
                    <span className="break-keep [text-wrap:pretty]">
                        {isKR
                            ? "이 사이트가 무엇을 모으고, 왜 쓰고, 언제 지우며, 어떻게 거부할 수 있는지 적었습니다."
                            : "What this site collects, why, for how long, and how to refuse."}
                    </span>
                }
                isKorean={isKR}
                className="mb-8 md:mb-10"
            />
            <div className="grid gap-8 md:max-w-3xl">
                {sections.map((s) => (
                    <section key={s.title}>
                        <h3 className="break-keep text-lg font-semibold text-ink">{s.title}</h3>
                        {s.lead && <p className="mt-2 break-keep text-[15px] leading-[1.75] text-ink-2">{s.lead}</p>}
                        {s.rows && (
                            <dl className="mt-3 divide-y divide-hairline rounded-lg border border-hairline bg-paper">
                                {s.rows.map((r) => (
                                    <div key={r.k} className="grid gap-1 px-4 py-3 md:grid-cols-[9rem_1fr] md:gap-4">
                                        <dt className="text-sm font-semibold text-ink">{r.k}</dt>
                                        <dd className="m-0 break-keep text-sm leading-[1.7] text-ink-2">{r.v}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        {s.paras?.map((p) => (
                            <p key={p} className="mt-3 break-keep text-[15px] leading-[1.75] text-ink-2">{p}</p>
                        ))}
                    </section>
                ))}
                <p className="text-sm text-ink-3">
                    <Link href={lp("/lecture")} className="underline underline-offset-[3px] hover:text-ink">
                        {isKR ? "← 수업으로 들어가기" : "← Enter your class"}
                    </Link>
                </p>
            </div>
        </Band>
    );
}
