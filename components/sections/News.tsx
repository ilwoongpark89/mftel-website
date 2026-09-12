"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, X } from "lucide-react";
import Band from "@/components/ui/band";
import { SectionHeader, Meta } from "@/components/ui/typo";
import { useLanguage, type Language } from "@/lib/LanguageContext";

/**
 * CALORIMETER §06 NEWS — one unified, date-sorted stream of rows. Two row
 * types share the same geometry (thumbnail kept on mobile, mono date,
 * full-row <button aria-expanded>, CSS-only 250ms accordion, lightbox):
 * 1) activity rows (description + image grid), 2) the CALL announcement row
 *    (structured h4/dl detail — never a pre-line blob). The newest entry
 *    renders expanded by default. Frame-0: every string + image is in the
 *    server HTML; collapsed content is hidden with grid-rows-[0fr], never
 *    conditionally rendered.
 */

interface Localized {
    EN: string;
    KR: string;
}

interface AnnouncementItem {
    label?: Localized;
    text: Localized;
    href?: string;
}

interface AnnouncementSection {
    heading: Localized;
    items: AnnouncementItem[];
}

interface Announcement {
    date: string; // ISO
    deadline: string; // ISO
    deadlineTime: string;
    closed: boolean; // recruitment window over → muted card + disabled apply
    projectNo: string;
    email: string;
    image: string;
    title: Localized;
    intro: Localized;
    sections: AnnouncementSection[];
}

const ANNOUNCEMENT: Announcement = {
    date: "2026-05-21",
    deadline: "2026-05-31",
    deadlineTime: "18:00",
    closed: true,
    projectNo: "RS-2026-25540249",
    email: "ilwoongpark@inha.ac.kr",
    image: "/images/news/260521-global-hr-program.png",
    title: {
        EN: "2026 New Industry Global HR Development Program — Call for Overseas Dispatch Students",
        KR: "2026 신산업 글로벌 인력양성사업 해외파견 학생 모집 공고",
    },
    intro: {
        EN: "Sponsored by the Ministry of Climate, Energy and Environment under 「Development of a Korean-style Energy Island Based on Wind Power — New Industry Global HR Development Program」 (Project No. RS-2026-25540249). We are recruiting graduate students to participate in overseas education and research programs.",
        KR: "본 사업단에서는 기후에너지환경부 지원 「풍력발전 기반 한국형 에너지 아일랜드 개발을 위한 신산업 글로벌 인력양성사업」(과제번호: RS-2026-25540249)의 일환으로 해외 교육 및 연구 프로그램에 참여할 학생을 아래와 같이 모집하오니 관심 있는 학생들의 많은 지원 바랍니다.",
    },
    sections: [
        {
            heading: { EN: "Program Overview", KR: "사업 개요" },
            items: [
                {
                    label: { EN: "Title", KR: "사업명" },
                    text: {
                        EN: "Development of a Korean-style Energy Island Based on Wind Power — New Industry Global HR Development Program",
                        KR: "풍력발전 기반 한국형 에너지 아일랜드 개발을 위한 신산업 글로벌 인력양성사업",
                    },
                },
                {
                    label: { EN: "Project No.", KR: "과제번호" },
                    text: { EN: "RS-2026-25540249", KR: "RS-2026-25540249" },
                },
                {
                    label: { EN: "Period", KR: "사업기간" },
                    text: {
                        EN: "2026. 4. 1. – 2027. 3. 31. (12 months)",
                        KR: "2026. 4. 1. ~ 2027. 3. 31. (12개월)",
                    },
                },
                {
                    label: { EN: "Scope", KR: "주요내용" },
                    text: {
                        EN: "Overseas education, research, and field training to strengthen global competence in wind power and energy island fields.",
                        KR: "풍력발전 및 에너지 아일랜드 분야 글로벌 역량 강화를 위한 해외 교육·연구·현장연수 프로그램 운영",
                    },
                },
            ],
        },
        {
            heading: { EN: "Recruitment", KR: "모집 개요" },
            items: [
                {
                    label: { EN: "Eligibility", KR: "모집대상" },
                    text: {
                        EN: "Graduate students in participating departments",
                        KR: "본 사업 참여 학과 대학원생",
                    },
                },
                {
                    label: { EN: "Destination", KR: "파견국가" },
                    text: { EN: "To be announced individually", KR: "추후 개별 안내" },
                },
                {
                    label: { EN: "Dispatch period", KR: "파견기간" },
                    text: {
                        EN: "At least 6 months within the project period",
                        KR: "사업기간 내 최소 6개월",
                    },
                },
                {
                    label: { EN: "Support", KR: "지원내용" },
                    text: {
                        EN: "Airfare, living expenses, tuition, etc. (partial or full; varies by country/program)",
                        KR: "항공료, 체재비, 교육비 등 일부 또는 전액 지원 ※ 파견 국가 및 프로그램에 따라 지원 비용은 상이할 수 있음",
                    },
                },
            ],
        },
        {
            heading: { EN: "Qualifications", KR: "지원 자격" },
            items: [
                {
                    text: {
                        EN: "Master's / PhD students with research outputs in the dispatch field and active conference participation",
                        KR: "파견연구 분야 연구 결과물이 있으며 활발하게 학회 참여 중인 석·박사과정 학생",
                    },
                },
                {
                    text: {
                        EN: "Able to conduct on-site research for at least 6 months",
                        KR: "6개월 이상 현지에서 파견연구 활동을 수행할 수 있는 석·박사 과정 학생",
                    },
                },
                {
                    text: {
                        EN: "Sufficient foreign-language proficiency for research communication",
                        KR: "파견연구를 위한 소통이 가능하도록 충분한 외국어 능력을 겸비한 학생",
                    },
                },
                {
                    text: {
                        EN: "Holds related research experience and capabilities",
                        KR: "파견연구 주제와 직·간접적 관련 연구를 수행하였으며, 해당 역량을 보유한 학생",
                    },
                },
                {
                    text: {
                        EN: "Holds a valid passport (no expiry during dispatch) and meets visa requirements",
                        KR: "여권을 소지하고, 파견기간 중 여권 만료나 비자 발급에 결격 사유가 없는 학생",
                    },
                },
            ],
        },
        {
            heading: { EN: "Application", KR: "신청 방법" },
            items: [
                {
                    label: { EN: "Posting period", KR: "공고 시작일" },
                    text: { EN: "From the announcement date", KR: "공고일부터 접수 시작" },
                },
                {
                    label: { EN: "Deadline", KR: "접수 마감일" },
                    text: {
                        EN: "2026. 5. 31. (Sun) 18:00",
                        KR: "2026년 5월 31일(일) 18:00까지",
                    },
                },
                {
                    label: { EN: "Documents", KR: "제출서류" },
                    text: {
                        EN: "Application form, dispatch research plan, enrollment certificate, language proficiency proof or advisor's confirmation, passport copy (or issuance plan)",
                        KR: "참가 지원서 1부 / 파견 연구계획서 1부 / 재학증명서 또는 과정확인 서류 1부 / 어학능력 증빙서류 또는 지도교수 확인서 / 여권 사본 또는 여권 발급 예정 확인 자료",
                    },
                },
                {
                    label: { EN: "Submission", KR: "접수방법" },
                    text: {
                        EN: "Email to ilwoongpark@inha.ac.kr",
                        KR: "이메일 접수 (ilwoongpark@inha.ac.kr)",
                    },
                    href: "mailto:ilwoongpark@inha.ac.kr",
                },
            ],
        },
        {
            heading: { EN: "Selection", KR: "선발 방법" },
            items: [
                {
                    text: {
                        EN: "Document and interview review",
                        KR: "서류심사 및 면접심사 진행",
                    },
                },
                {
                    label: { EN: "Criteria", KR: "평가 기준" },
                    text: {
                        EN: "Foreign-language ability, research-field fit, related performance, study-abroad plan, academic plan, and motivation",
                        KR: "외국어 능력, 연구 분야 적합성, 지원연구 관련 실적, 국외수학 계획서, 학업계획 및 참여 의지 등",
                    },
                },
            ],
        },
        {
            heading: { EN: "Notes", KR: "유의사항" },
            items: [
                {
                    text: {
                        EN: "Submitted documents will not be returned.",
                        KR: "제출된 서류는 반환하지 않음",
                    },
                },
                {
                    text: {
                        EN: "Selection may be cancelled if false information is provided.",
                        KR: "허위 사실 기재 시 선발이 취소될 수 있음",
                    },
                },
                {
                    text: {
                        EN: "Schedule and program details may change.",
                        KR: "해외 파견 일정 및 세부 프로그램은 사정에 따라 변경될 수 있음",
                    },
                },
                {
                    text: {
                        EN: "A paper must be accepted in an SCIE-indexed journal within one year of the dispatch. Otherwise, part or all of the support must be returned.",
                        KR: "파견 후 1년 안에 SCIE급 논문 게재 확정(Accept)이 필수임. 조건을 만족하지 못할 경우 지원 경비의 일부 또는 전액을 반환해야 함",
                    },
                },
                {
                    text: {
                        EN: "Other matters follow the program operating standards.",
                        KR: "기타 사항은 사업단 운영 기준에 따름",
                    },
                },
            ],
        },
        {
            heading: { EN: "Contact", KR: "문의처" },
            items: [
                {
                    text: {
                        EN: "Prof. Il Woong Park, Department of Mechanical Engineering, Inha University",
                        KR: "인하대학교 기계공학과 박일웅 교수",
                    },
                },
                {
                    label: { EN: "Email", KR: "이메일" },
                    text: { EN: "ilwoongpark@inha.ac.kr", KR: "ilwoongpark@inha.ac.kr" },
                    href: "mailto:ilwoongpark@inha.ac.kr",
                },
            ],
        },
    ],
};

interface ActivityItem {
    date: string; // ISO
    title: Localized;
    description: Localized;
    images: string[];
    /**
     * "grid" (default) = uniform 3:2 landscape tiles, for snapshot photos.
     * "feature" = the lead photo (images[0]) shown large and uncropped on the left,
     * with the remaining images in a narrower secondary column on the right, kept in
     * their natural portrait ratio — for a hero photo plus document-style assets
     * (posters, programmes). Stacks to photo-over-posters on mobile.
     * "document" = portrait documents only (certificates, letters): every image is
     * shown whole (object-contain on white) in an A-series 1:√2 frame, in a narrow
     * column so the text stays legible in the lightbox rather than cropped in a tile.
     */
    imageLayout?: "grid" | "feature" | "document";
}

const ACTIVITY_ITEMS: ActivityItem[] = [
    {
        date: "2026-08-25",
        title: {
            EN: "Minister's Award for Sung Jin Kim",
            KR: "김성진 학생 기후에너지환경부 장관상 수상",
        },
        description: {
            EN: "Sung Jin Kim won the top prize in the Outstanding Talent category of the 2026 Energy Human Resources Development Program and received the Minister's Award from the Ministry of Climate, Energy and Environment. Congratulations!",
            KR: "김성진 학생이 2026년 에너지인력양성사업 우수인재 부문에서 최우수상인 기후에너지환경부 장관상을 받았습니다. 축하합니다!",
        },
        images: ["/images/news/260825-sungjin-kim-energy-hrd-award.jpeg"],
        imageLayout: "document",
    },
    {
        date: "2026-06-24",
        title: {
            EN: "Frontiers in Thermal-Hydraulics",
            KR: "NTNU 국제 열수력 워크숍",
        },
        description: {
            EN: "Prof. Il Woong Park held an international thermal-hydraulics workshop at NTNU in Trondheim, together with Carlos Dorao and Hyung Ju Kim. Researchers and graduate students from Norway, Korea, and India came for two days of talks on multiphase flow and nuclear safety.",
            KR: "연구실이 NTNU의 Carlos Dorao, Hyung Ju Kim 교수와 함께 노르웨이 트론헤임에서 국제 열수력 워크숍을 열었습니다. 노르웨이와 한국, 인도에서 온 연구자와 대학원생들이 모여 이틀간 다상유동과 원자력 안전을 주제로 발표하고 토론했습니다.",
        },
        images: [
            "/images/news/260624-th-workshop-trondheim-1.jpeg",
            "/images/news/260624-th-workshop-trondheim-2.jpeg",
            "/images/news/260624-th-workshop-trondheim-3.jpeg",
        ],
        imageLayout: "feature",
    },
    {
        date: "2026-01-25",
        title: { EN: "Visiting Researchers at Th2FLAB", KR: "NTNU Th2FLAB 방문연구 시작" },
        description: {
            EN: "Sung Jin Kim, Hyeon Geun Shin, and Sang Min Song will stay at NTNU for a year to conduct collaborative research with Professor Carlos Dorao. It was a hard-working weekend!",
            KR: "김성진, 신현근, 송상민 학생이 Carlos Dorao 교수와 공동연구를 위해 NTNU에서 1년간 방문연구를 시작합니다. 주말인데도 Dorao 교수가 실험장치 설치를 도와주었습니다.",
        },
        images: ["/images/news/250125-hard-work-ntnu-2.jpg", "/images/news/250125-hard-work-ntnu-1.jpg"],
    },
    {
        date: "2026-01-22",
        title: { EN: "EPT Day 2026", KR: "EPT Day 2026" },
        description: {
            EN: "Prof. Il Woong Park participated in EPT Day 2026 and presented his latest research on multiphase flow and thermal engineering.",
            KR: "박일웅 교수가 노르웨이 NTNU 에너지공정공학과(Department of Energy and Process Engineering, EPT)의 학과 행사 EPT Day 2026에서 강연했습니다.",
        },
        images: ["/images/news/ept-day-2026-1.jpg", "/images/news/ept-day-2026-2.png"],
    },
    {
        date: "2025-12-19",
        title: { EN: "Th2FLAB Professors Visited MFTEL", KR: "NTNU Th2FLAB 교수진 MFTEL 방문" },
        description: {
            EN: "Professors Carlos Alberto Dorao and Maria Fernandino of NTNU's Thermal Two-Phase Flow Laboratory (Th2FLAB) visited MFTEL at Inha University, Korea, for research collaboration and academic exchange.",
            KR: "노르웨이 NTNU Th2FLAB의 Carlos Alberto Dorao 교수와 Maria Fernandino 교수가 연구실을 방문해 공동연구와 학술교류를 논의했습니다.",
        },
        images: ["/images/news/251219-carlos-maria-visit-1.jpeg", "/images/news/251219-carlos-maria-visit-2.jpeg"],
    },
    {
        date: "2025-11-17",
        title: { EN: "Bluepill CEO Visited Inha University", KR: "블루필 박광호 대표 특강" },
        description: {
            EN: "CEO Kwang Ho Park of Bluepill visited Inha University and presented the future of coding using vibe coding.",
            KR: "블루필 박광호 대표가 인하대학교를 방문해 '바이브 코딩으로 보는 코딩의 미래'를 주제로 특강을 했습니다.",
        },
        images: ["/images/news/251117-vibe-coding-ceo-visit.jpeg", "/images/news/251117-vibe-coding-ceo-visit-2.png"],
    },
    {
        date: "2025-10-21",
        title: { EN: "UTFORSK 2024 at Inha University", KR: "UTFORSK 프로그램으로 NTNU 학생들이 인하대 방문" },
        description: {
            EN: "NTNU students visited Inha University through the UTFORSK program.",
            KR: "UTFORSK 프로그램으로 NTNU 학생들이 인하대학교를 방문했습니다.",
        },
        images: ["/images/news/251021-visiting-inha-utforsk-2.png", "/images/news/251021-visiting-inha-utforsk-1.jpeg"],
    },
    {
        date: "2025-09-03",
        title: { EN: "NURETH-21", KR: "NURETH-21 학회 참가" },
        description: {
            EN: "MFTEL participated in NURETH-21 with NTNU Th2FLAB members: Prof. Carlos Dorao, Th2FLAB alumni Dr. Julio Pacio, and PhD student Karim.",
            KR: "연구실이 NTNU Th2FLAB과 함께 NURETH-21 학회에 참가했습니다. Carlos Dorao 교수, Th2FLAB 졸업생 Julio Pacio 박사, 박사과정 Karim과 함께했습니다.",
        },
        images: ["/images/news/250903-nureth.jpeg"],
    },
    {
        date: "2025-08-14",
        title: { EN: "MFTEL Visited Th2FLAB", KR: "NTNU Th2FLAB 방문" },
        description: {
            EN: "MFTEL visited Th2FLAB to discuss future collaboration on multiphase flow research.",
            KR: "다상유동 공동연구를 논의하기 위해 노르웨이 NTNU의 Th2FLAB을 방문했습니다.",
        },
        images: ["/images/news/250814-visiting-ntnu-1.jpeg", "/images/news/250814-visiting-ntnu-2.jpeg"],
    },
    {
        date: "2025-08-11",
        title: { EN: "UTFORSK Visit to NTNU", KR: "UTFORSK 프로그램으로 연구실 전원 NTNU 방문" },
        description: {
            EN: "The entire MFTEL team from Inha University visited Associate Professor Hyung Ju Kim's lab at NTNU through the UTFORSK program.",
            KR: "연구실 전원이 UTFORSK 프로그램으로 NTNU를 방문해 Hyung Ju Kim 교수 연구실을 찾았습니다.",
        },
        images: ["/images/news/250811-utforsk-ntnu.jpeg", "/images/news/250811-utforsk-ntnu-visiting.jpeg"],
    },
    {
        date: "2025-05-11",
        title: { EN: "11th WORTH in China", KR: "제11회 WORTH 학회 발표 (중국)" },
        description: {
            EN: "Hyeon Geun Shin presented research findings at the 11th WORTH conference in China.",
            KR: "신현근 학생이 중국에서 열린 제11회 WORTH 학회에서 연구 결과를 발표했습니다.",
        },
        images: ["/images/news/250505-hyeongeun-shin-worth.jpg"],
    },
    {
        date: "2025-03-02",
        title: { EN: "Visiting Research at HZDR and UPC", KR: "독일 HZDR, 스페인 UPC 방문연구" },
        description: {
            EN: "Hyun Jin Yong conducted visiting research at HZDR, Germany, and Kyeong Ju Ko at UPC, Spain.",
            KR: "용현진 학생은 독일 HZDR에서, 고경주 학생은 스페인 UPC에서 방문연구를 했습니다.",
        },
        images: ["/images/news/250309-hyunjin-yong-hzdr.jpg", "/images/news/250309-kyeongju-ko-upc.jpg"],
    },
];

/**
 * Unified, date-sorted news stream: activity items + the (closed) CALL
 * announcement live in one chronological list. The newest entry renders
 * expanded by default; everything else opens on click.
 */
type NewsEntry =
    | { kind: "activity"; date: string; item: ActivityItem }
    | { kind: "announcement"; date: string };

const NEWS_ENTRIES: NewsEntry[] = [
    ...ACTIVITY_ITEMS.map((item) => ({ kind: "activity" as const, date: item.date, item })),
    { kind: "announcement" as const, date: ANNOUNCEMENT.date },
].sort((a, b) => b.date.localeCompare(a.date));

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string, language: Language): string {
    const [y, m, d] = iso.split("-").map(Number);
    if (language === "KR") {
        return `${y}. ${String(m).padStart(2, "0")}. ${String(d).padStart(2, "0")}.`;
    }
    return `${EN_MONTHS[m - 1]} ${d}, ${y}`;
}

interface LightboxState {
    images: string[];
    index: number;
    alt: string;
}

function Lightbox({
    state,
    language,
    onClose,
    onIndex,
}: {
    state: LightboxState;
    language: Language;
    onClose: () => void;
    onIndex: (i: number) => void;
}) {
    const { images, index, alt } = state;
    const n = images.length;
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (n > 1 && e.key === "ArrowRight") onIndex((index + 1) % n);
            if (n > 1 && e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [index, n, onClose, onIndex]);
    const navBtn = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-paper transition-colors duration-150 hover:bg-white/20";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            className="fixed inset-0 z-50 flex items-center justify-center bg-coal/90 p-4 md:p-10"
            onClick={onClose}
        >
            <button
                type="button"
                aria-label={language === "KR" ? "닫기" : "Close"}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-paper/70 transition-colors duration-150 hover:text-paper"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </button>
            {n > 1 ? (
                <button
                    type="button"
                    aria-label={language === "KR" ? "이전 사진" : "Previous image"}
                    className={`${navBtn} left-3`}
                    onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + n) % n); }}
                >
                    ‹
                </button>
            ) : null}
            <div
                className="relative h-full max-h-[82vh] w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[index]}
                    alt={`${alt} ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="object-contain"
                />
            </div>
            {n > 1 ? (
                <button
                    type="button"
                    aria-label={language === "KR" ? "다음 사진" : "Next image"}
                    className={`${navBtn} right-3`}
                    onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % n); }}
                >
                    ›
                </button>
            ) : null}
            {n > 1 ? (
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-paper/80 tabular-nums">
                    {index + 1} / {n}
                </p>
            ) : null}
        </div>
    );
}

/** 모든 소식이 같은 틀 — 3:2 액자 하나. 사진은 채우고(cover), 상장·포스터 같은 문서는 온전히(contain). 여러 장이면 «+N» 뒤 라이트박스로 넘긴다. */
function MediaFrame({
    images,
    alt,
    contain,
    language,
    onOpen,
}: {
    images: string[];
    alt: string;
    contain: boolean;
    language: Language;
    onOpen: (s: LightboxState) => void;
}) {
    return (
        <button
            type="button"
            aria-label={language === "KR" ? "이미지 크게 보기" : "Enlarge image"}
            onClick={() => onOpen({ images, index: 0, alt })}
            className="relative block aspect-[3/2] w-full overflow-hidden rounded-lg border border-hairline bg-well transition-colors duration-150 hover:border-hairline-2"
        >
            <Image
                src={images[0]}
                alt={`${alt} 1`}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className={contain ? "object-contain p-3" : "object-cover"}
            />
            {images.length > 1 ? (
                <span className="absolute bottom-2 right-2 rounded-md bg-coal/80 px-2 py-0.5 text-[12px] font-medium text-paper tabular-nums">
                    +{images.length - 1}
                </span>
            ) : null}
        </button>
    );
}

function ActivityRow({
    item,
    language,
    onImageOpen,
}: {
    item: ActivityItem;
    language: Language;
    onImageOpen: (s: LightboxState) => void;
}) {
    const isKR = language === "KR";
    const alt = item.title[language];
    return (
        <article className="grid gap-5 py-7 md:grid-cols-[1fr_400px] md:gap-10">
            <div className="min-w-0">
                <Meta className="whitespace-nowrap">{formatDate(item.date, language)}</Meta>
                <h3 className="mt-1.5 break-keep text-[17px] font-semibold leading-snug text-ink md:text-lg">
                    {alt}
                </h3>
                <p
                    className={`mt-2 whitespace-pre-line break-keep text-sm text-ink-2 md:text-[15px] ${isKR ? "leading-[1.75]" : "leading-relaxed"}`}
                >
                    {item.description[language]}
                </p>
            </div>
            <MediaFrame
                images={item.images}
                alt={alt}
                contain={item.imageLayout === "document"}
                language={language}
                onOpen={onImageOpen}
            />
        </article>
    );
}

function AnnouncementRow({
    language,
    onImageOpen,
}: {
    language: Language;
    onImageOpen: (s: LightboxState) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isKR = language === "KR";
    const panelId = "news-call-detail";
    const closed = ANNOUNCEMENT.closed;

    return (
        <div>
            <div className="grid gap-5 py-7 md:grid-cols-[1fr_400px] md:gap-10">
            <div className="min-w-0">
                <Meta className="whitespace-nowrap">
                    {formatDate(ANNOUNCEMENT.date, language)} · {isKR ? "모집공고" : "Call"}
                    {closed ? (isKR ? " · 마감" : " · Closed") : ""}
                </Meta>
                <h3 className="mt-1.5 break-keep text-[17px] font-semibold leading-snug text-ink md:text-lg">
                    {ANNOUNCEMENT.title[language]}
                </h3>
                <p className={`mt-2 break-keep text-sm text-ink-2 md:text-[15px] ${isKR ? "leading-[1.75]" : "leading-relaxed"}`}>
                    {ANNOUNCEMENT.intro[language]}
                </p>
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ember-700 transition-colors duration-150 hover:text-ember-800"
                >
                    {expanded ? (isKR ? "공고 접기" : "Hide details") : (isKR ? "공고 전문 보기" : "Full announcement")}
                    <ChevronDown
                        aria-hidden
                        className={`h-4 w-4 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
                    />
                </button>
            </div>
            <MediaFrame
                images={[ANNOUNCEMENT.image]}
                alt={ANNOUNCEMENT.title[language]}
                contain
                language={language}
                onOpen={onImageOpen}
            />
            </div>

            {/* full announcement — structured, CSS-only accordion (content always in server HTML) */}
            <div
                id={panelId}
                className={`grid transition-[grid-template-rows] duration-[250ms] ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="flex gap-4 pb-7">
                        <div className="min-w-0 flex-1">
                            <div>
                                <Meta className="text-sm font-medium text-ink-3">
                                    {isKR ? "마감" : "DEADLINE"} · {formatDate(ANNOUNCEMENT.deadline, language)}{" "}
                                    {ANNOUNCEMENT.deadlineTime}
                                    
                                </Meta>
                            </div>

                            <div className="mt-6">
                                <div className="grid content-start gap-6 sm:grid-cols-2">
                                    {ANNOUNCEMENT.sections.map((sec, sIdx) => (
                                        <section key={sec.heading.EN}>
                                            <h4 className="break-keep text-sm font-semibold text-ink">
                                                {sIdx + 1}. {sec.heading[language]}
                                            </h4>
                                            <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                                                {sec.items.map((it) => (
                                                    <li
                                                        key={it.text.EN}
                                                        className={`flex gap-2 ${isKR ? "break-keep leading-[1.75]" : "leading-relaxed"}`}
                                                    >
                                                        <span aria-hidden className="shrink-0 text-ink-4">
                                                            –
                                                        </span>
                                                        <span className="min-w-0">
                                                            {it.label ? (
                                                                <span className="font-medium text-ink">
                                                                    {it.label[language]}:{" "}
                                                                </span>
                                                            ) : null}
                                                            {it.href ? (
                                                                <a
                                                                    href={it.href}
                                                                    className="text-ink underline underline-offset-2 transition-colors duration-150 hover:text-ink-2"
                                                                >
                                                                    {it.text[language]}
                                                                </a>
                                                            ) : (
                                                                it.text[language]
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function News() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const [lightbox, setLightbox] = useState<LightboxState | null>(null);

    // 연도별 묶음 — 논문 페이지와 같은 연도 레일. 접힘 없이 전부 펼쳐 보인다.
    const yearGroups: { year: string; entries: NewsEntry[] }[] = [];
    for (const entry of NEWS_ENTRIES) {
        const year = entry.date.slice(0, 4);
        const last = yearGroups[yearGroups.length - 1];
        if (last && last.year === year) last.entries.push(entry);
        else yearGroups.push({ year, entries: [entry] });
    }

    return (
        <Band id="news" surface="white">
            <SectionHeader
                index="06"
                kicker={t("news.label")}
                title={t("news.title")}
                sub={t("news.description")}
                isKorean={isKR}
            />

            <div className="mt-2">
                {yearGroups.map(({ year, entries }) => (
                    <div
                        key={year}
                        className="grid border-t border-hairline py-5 md:grid-cols-[96px_1fr] md:gap-6 md:py-6"
                    >
                        <div className="pb-2 md:pb-0">
                            <p className="text-2xl font-semibold leading-none tracking-tight text-ink-4 tabular-nums md:sticky md:top-24">
                                {year}
                            </p>
                        </div>
                        <ul className="divide-y divide-hairline md:-mt-2">
                            {entries.map((entry) => (
                                <li key={`${entry.kind}-${entry.date}`}>
                                    {entry.kind === "announcement" ? (
                                        <AnnouncementRow language={language} onImageOpen={setLightbox} />
                                    ) : (
                                        <ActivityRow item={entry.item} language={language} onImageOpen={setLightbox} />
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div aria-hidden className="border-t border-hairline" />
            </div>

            {lightbox ? (
                <Lightbox
                    state={lightbox}
                    language={language}
                    onClose={() => setLightbox(null)}
                    onIndex={(i) => setLightbox((st) => (st ? { ...st, index: i } : st))}
                />
            ) : null}
        </Band>
    );
}
