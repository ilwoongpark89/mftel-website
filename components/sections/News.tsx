"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, X } from "lucide-react";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";
import Band from "@/components/ui/band";
import ArchiveYear from "@/components/ui/archive-year";
import { SectionHeader, Meta } from "@/components/ui/typo";
import { useLanguage, type Language } from "@/lib/LanguageContext";

/** Year-grouped editorial news. Images open in a lightbox; recruitment
 * details expand in place. Dates inherit the year from each group heading. */

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
        date: "2026-10-06",
        title: { EN: "NTNU Students Visited MFTEL through UTFORSK", KR: "UTFORSK 프로그램으로 NTNU 학생들 연구실 방문" },
        description: {
            EN: "NTNU students visited MFTEL through the UTFORSK program and discussed collaboration in education and research. The visit is part of SONoKo, an education partnership between NTNU and Inha University from 2025 to 2028. The project focuses on a safe and sustainable ocean. Samsung Heavy Industries, HD Hyundai Europe R&D Center, KOGAS, and Equinor take part as partners.",
            KR: "NTNU 학생들이 UTFORSK 프로그램으로 연구실을 방문해 교육과 연구 협력 방안을 논의했습니다. NTNU와 인하대학교는 2025년부터 2028년까지 교육 협력 프로젝트 SONoKo를 함께 진행하고 있습니다. SONoKo는 안전하고 지속가능한 해양을 주제로 하며, 삼성중공업, HD현대 유럽연구개발센터, 한국가스공사, Equinor가 파트너로 참여합니다.",
        },
        images: ["/images/news/261006-utforsk-ntnu-students-visit.jpeg"],
    },
    {
        date: "2026-08-25",
        title: { EN: "Minister's Award for Sung Jin Kim", KR: "김성진 학생 기후에너지환경부 장관상 수상" },
        description: {
            EN: "Sung Jin Kim received the Minister's Award from the Ministry of Climate, Energy and Environment. It was the Best Award in the Outstanding Talent category of the 2026 Energy Human Resources Development Program. Sung Jin Kim is a Ph.D. student who studies boiling heat transfer and dielectric fluids. Congratulations!",
            KR: "김성진 학생이 2026년 에너지인력양성사업 우수인재 부문에서 최우수상인 기후에너지환경부 장관상을 받았습니다. 김성진 학생은 박사과정에서 비등 열전달과 절연유체를 연구하고 있습니다. 축하합니다!",
        },
        images: ["/images/news/260825-sungjin-kim-energy-hrd-award.jpeg"],
        imageLayout: "document",
    },
    {
        date: "2026-06-23",
        title: { EN: "Frontiers in Thermal-Hydraulics", KR: "NTNU 국제 열수력 워크숍" },
        description: {
            EN: "Prof. Il Woong Park organized the international workshop \"Frontiers in Thermal-Hydraulics\" at NTNU in Trondheim on 23–24 June. Carlos Dorao and Hyung Ju Kim of NTNU were co-organizers. On the first day, graduate students and early-career researchers presented work on the fundamentals of multiphase flow. On the second day, invited experts spoke on nuclear safety and marine energy. Hyeon Geun Shin, Sung Jin Kim, and Sang Min Song from MFTEL gave talks. Speakers came from NTNU, IIT Bombay, Seoul National University, Hanyang University, Kyung Hee University, KAIST, and Inha University. The UTFORSK SONoKo project supported the workshop.",
            KR: "박일웅 교수가 6월 23일부터 이틀간 노르웨이 트론헤임의 NTNU에서 국제 열수력 워크숍 'Frontiers in Thermal-Hydraulics'를 열었습니다. NTNU의 Carlos Dorao 교수와 Hyung Ju Kim 교수가 공동 조직위원으로 함께했습니다. 첫날에는 대학원생과 신진 연구자들이 다상유동 기초 연구를 발표했고, 둘째 날에는 초청 연사들이 원자력 안전과 해양 에너지를 주제로 강연했습니다. 연구실에서는 신현근, 김성진, 송상민 학생이 발표했습니다. 발표자는 NTNU, 인도 IIT Bombay, 서울대, 한양대, 경희대, KAIST, 인하대 소속이었습니다. 워크숍은 UTFORSK SONoKo 프로젝트가 지원했습니다.",
        },
        images: ["/images/news/260624-th-workshop-trondheim-1.jpeg", "/images/news/260624-th-workshop-trondheim-2.jpeg", "/images/news/260624-th-workshop-trondheim-3.jpeg"],
        imageLayout: "feature",
    },
    {
        date: "2026-01-25",
        title: { EN: "Visiting Researchers at Th2FLAB", KR: "NTNU Th2FLAB 방문연구 시작" },
        description: {
            EN: "Sung Jin Kim, Hyeon Geun Shin, and Sang Min Song will stay at NTNU for a year to conduct collaborative research with Professor Carlos Dorao. At MFTEL, Sung Jin Kim studies boiling, Hyeon Geun Shin studies two-phase flow instability, and Sang Min Song studies condensation. It was a weekend, but Professor Dorao helped them set up the experimental rig.",
            KR: "김성진, 신현근, 송상민 학생이 Carlos Dorao 교수와 공동연구를 위해 NTNU에서 1년간 방문연구를 시작합니다. 세 학생은 연구실에서 각각 비등, 이상유동 불안정성, 응축을 연구하고 있습니다. 주말인데도 Dorao 교수가 실험장치 설치를 도와주었습니다.",
        },
        images: ["/images/news/250125-hard-work-ntnu-2.jpg", "/images/news/250125-hard-work-ntnu-1.jpg"],
    },
    {
        date: "2026-01-22",
        title: { EN: "EPT Day 2026", KR: "EPT Day 2026" },
        description: {
            EN: "Prof. Il Woong Park gave a talk at EPT Day 2026, the annual event of the Department of Energy and Process Engineering (EPT) at NTNU. His talk, \"Breaking the Power Barrier: Why Multi-phase Flow is the Key to the AI Transition\", was part of the morning research session. He presented MFTEL's research on nuclear engineering, thermal energy storage, and electronics cooling. At EPT Day, students, staff, and industry look at the department's education, research, and careers together.",
            KR: "박일웅 교수가 노르웨이 NTNU 에너지공정공학과(EPT)가 매년 여는 EPT Day 2026에서 강연했습니다. 오전 연구 세션에서 'Breaking the Power Barrier: Why Multi-phase Flow is the Key to the AI Transition'을 주제로 연구실의 원자력, 열에너지 저장, 전자기기 냉각 연구를 소개했습니다. EPT Day는 학생과 교직원, 산업계가 함께 학과의 교육과 연구, 진로를 살펴보는 행사입니다.",
        },
        images: ["/images/news/ept-day-2026-1.jpg", "/images/news/ept-day-2026-2.png"],
    },
    {
        date: "2025-12-19",
        title: { EN: "Th2FLAB Professors Visited MFTEL", KR: "NTNU Th2FLAB 교수진 MFTEL 방문" },
        description: {
            EN: "Professors Carlos Alberto Dorao and Maria Fernandino of NTNU's Thermal Two-Phase Flow Laboratory (Th2FLAB) visited MFTEL at Inha University, Korea, to discuss research collaboration and academic exchange. Students attended a lecture on fundamental thermal-hydraulics and 1D numerical simulation with the homogeneous two-phase flow model. The two professors also toured the experimental rigs of MFTEL.",
            KR: "노르웨이 NTNU Th2FLAB의 Carlos Alberto Dorao 교수와 Maria Fernandino 교수가 연구실을 방문해 공동연구와 학술교류를 논의했습니다. 학생들은 열수력 기초와 균질 이상유동 모델을 이용한 1차원 수치해석 강의를 들었습니다. 두 교수는 연구실의 실험장치도 둘러보았습니다.",
        },
        images: ["/images/news/251219-carlos-maria-visit-1.jpeg", "/images/news/251219-carlos-maria-visit-2.jpeg"],
    },
    {
        date: "2025-11-17",
        title: { EN: "Lecture by Bluepill CEO Kwang Ho Park", KR: "블루필 박광호 대표 특강" },
        description: {
            EN: "CEO Kwang Ho Park of Bluepill visited Inha University and gave a lecture titled \"The Future of Coding through Vibe Coding\". He showed how people can build software by talking with AI instead of studying programming syntax first. Bluepill runs Buildersgate, a team that plans, designs, and develops IT systems together with AI agents.",
            KR: "블루필 박광호 대표가 인하대학교를 방문해 '바이브 코딩으로 보는 코딩의 미래'를 주제로 특강을 했습니다. 박광호 대표는 문법을 먼저 배우지 않고 AI와 대화하며 프로그램을 만드는 방법을 소개했습니다. 블루필은 AI 에이전트와 함께 IT 시스템을 기획, 디자인, 개발하는 빌더스게이트를 운영합니다.",
        },
        images: ["/images/news/251117-vibe-coding-ceo-visit.jpeg", "/images/news/251117-vibe-coding-ceo-visit-2.png"],
    },
    {
        date: "2025-10-21",
        title: { EN: "NTNU Students Visited Inha University through UTFORSK", KR: "UTFORSK 프로그램으로 NTNU 학생들이 인하대 방문" },
        description: {
            EN: "NTNU students visited Inha University through the UTFORSK SONoKo project. MFTEL visited NTNU in August under the same project. The students took a group photo in front of the Inha main building and tried a media room with a large projection wall.",
            KR: "NTNU 학생들이 UTFORSK SONoKo 프로젝트로 인하대학교를 방문했습니다. 연구실은 8월에 같은 프로젝트로 NTNU를 방문했습니다. 학생들은 인하대 본관 앞에서 단체 사진을 찍고, 대형 영상 벽이 있는 미디어 공간을 체험했습니다.",
        },
        images: ["/images/news/251021-visiting-inha-utforsk-2.png", "/images/news/251021-visiting-inha-utforsk-1.jpeg"],
    },
    {
        date: "2025-09-03",
        title: { EN: "NURETH-21", KR: "NURETH-21 학회 참가" },
        description: {
            EN: "MFTEL participated in NURETH-21 with NTNU Th2FLAB members: Prof. Carlos Dorao, Th2FLAB alumnus Dr. Julio Pacio, and PhD student Karim. NURETH-21 is the 21st International Topical Meeting on Nuclear Reactor Thermal Hydraulics, held every two years. It took place at BEXCO in Busan from 31 August to 5 September 2025. The theme was \"Innovation in Thermal Hydraulics for Nuclear Future\".",
            KR: "연구실이 NTNU Th2FLAB의 Carlos Dorao 교수, Th2FLAB 졸업생 Julio Pacio 박사, 박사과정 Karim과 함께 NURETH-21 학회에 참가했습니다. NURETH-21은 2년마다 열리는 제21회 원자로 열수력 국제학회입니다. 2025년 8월 31일부터 9월 5일까지 부산 BEXCO에서 열렸고, 주제는 'Innovation in Thermal Hydraulics for Nuclear Future'였습니다.",
        },
        images: ["/images/news/250903-nureth.jpeg"],
    },
    {
        date: "2025-08-14",
        title: { EN: "MFTEL Visited Th2FLAB", KR: "NTNU Th2FLAB 방문" },
        description: {
            EN: "MFTEL visited Th2FLAB to discuss future collaboration on multiphase flow research. The team also toured laboratories on the NTNU Gløshaugen campus. Th2FLAB studies boiling, condensation, and two-phase flow instabilities such as density wave oscillations.",
            KR: "연구실이 다상유동 공동연구를 논의하기 위해 노르웨이 NTNU의 Th2FLAB을 방문했습니다. 연구실은 NTNU 글뢰스하우겐 캠퍼스의 실험실도 둘러보았습니다. Th2FLAB은 비등과 응축, 그리고 밀도파 진동 같은 이상유동 불안정성을 연구합니다.",
        },
        images: ["/images/news/250814-visiting-ntnu-1.jpeg", "/images/news/250814-visiting-ntnu-2.jpeg"],
    },
    {
        date: "2025-08-11",
        title: { EN: "UTFORSK Visit to NTNU", KR: "UTFORSK 프로그램으로 연구실 전원 NTNU 방문" },
        description: {
            EN: "The entire MFTEL team from Inha University visited Associate Professor Hyung Ju Kim's lab at NTNU through the UTFORSK program. Hyung Ju Kim studies maritime safety and risk analysis in the Department of Mechanical and Industrial Engineering at NTNU. The visit is part of SONoKo, an education partnership between NTNU and Inha University from 2025 to 2028.",
            KR: "연구실 전원이 UTFORSK 프로그램으로 NTNU를 방문해 Hyung Ju Kim 부교수 연구실을 찾았습니다. Hyung Ju Kim 교수는 NTNU 기계산업공학과에서 해양 안전과 위험 분석을 연구합니다. 이번 방문은 SONoKo 프로젝트의 지원을 받았습니다. SONoKo는 NTNU와 인하대학교가 2025년부터 2028년까지 함께하는 교육 협력 프로젝트입니다.",
        },
        images: ["/images/news/250811-utforsk-ntnu.jpeg", "/images/news/250811-utforsk-ntnu-visiting.jpeg"],
    },
    {
        date: "2025-05-12",
        title: { EN: "11th WORTH in China", KR: "제11회 WORTH 워크숍 발표 (중국)" },
        description: {
            EN: "Hyeon Geun Shin presented research findings at WORTH-11, the 11th China-Korea Workshop on Nuclear Reactor Thermal-Hydraulics. The workshop took place at Harbin Engineering University in Harbin, China, from 12 to 15 May 2025. About 150 researchers from Korea and China attended. Hyeon Geun Shin is a Ph.D. student who studies two-phase flow instability.",
            KR: "신현근 학생이 중국 하얼빈공정대학교에서 열린 제11회 한중 원자로 열수력 워크숍(WORTH-11)에서 연구 결과를 발표했습니다. 워크숍은 2025년 5월 12일부터 15일까지 열렸고, 한국과 중국의 연구자 150여 명이 참석했습니다. 신현근 학생은 박사과정에서 이상유동 불안정성을 연구합니다.",
        },
        images: ["/images/news/250505-hyeongeun-shin-worth.jpg"],
    },
    {
        date: "2025-03-02",
        title: { EN: "Visiting Research at HZDR and UPC", KR: "독일 HZDR, 스페인 UPC 방문연구" },
        description: {
            EN: "Hyun Jin Yong conducted visiting research at HZDR in Dresden, Germany, and Kyeong Ju Ko at UPC in Spain, from March to September 2025. Hyun Jin Yong is a Ph.D. student who studies boiling heat transfer. Kyeong Ju Ko is an M.S. student who studies computational fluid dynamics.",
            KR: "용현진 학생은 독일 드레스덴의 HZDR에서, 고경주 학생은 스페인 UPC에서 2025년 3월부터 9월까지 방문연구를 했습니다. 용현진 학생은 박사과정에서 비등 열전달을, 고경주 학생은 석사과정에서 전산유체역학을 연구합니다.",
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

function formatDate(iso: string, language: Language, includeYear = true): string {
    const [y, m, d] = iso.split("-").map(Number);
    if (language === "KR") {
        return `${includeYear ? `${y}. ` : ""}${String(m).padStart(2, "0")}. ${String(d).padStart(2, "0")}.`;
    }
    return `${EN_MONTHS[m - 1]} ${d}${includeYear ? `, ${y}` : ""}`;
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
    const dialogRef = useDialogFocus(true);
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
            ref={dialogRef}
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
            className={`news-media relative block aspect-[3/2] w-full overflow-hidden rounded-md ${contain ? "news-document" : "bg-well"}`}
        >
            <Image
                src={images[0]}
                alt={`${alt} 1`}
                fill
                sizes="(max-width: 767px) calc(100vw - 48px), 260px"
                className={contain ? "object-contain" : "object-cover"}
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
        <article className="news-entry">
            <div className="min-w-0">
                <Meta className="whitespace-nowrap"><time dateTime={item.date}>{formatDate(item.date, language, false)}</time></Meta>
                <h4 className="mt-1.5 break-keep text-[17px] font-semibold leading-snug text-ink md:text-lg">
                    {alt}
                </h4>
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
            <div className="news-entry">
            <div className="min-w-0">
                <Meta className="whitespace-nowrap">
                    <time dateTime={ANNOUNCEMENT.date}>{formatDate(ANNOUNCEMENT.date, language, false)}</time> · {isKR ? "모집공고" : "Call"}
                    {closed ? (isKR ? " · 마감" : " · Closed") : ""}
                </Meta>
                <h4 className="mt-1.5 break-keep text-[17px] font-semibold leading-snug text-ink md:text-lg">
                    {ANNOUNCEMENT.title[language]}
                </h4>
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
                isKorean={isKR}
            />

            <div className="archive-years">
                {yearGroups.map(({ year, entries }) => (
                    <ArchiveYear key={year} year={year} id={`news-year-${year}`}>
                        <ul className="news-year-entries divide-y divide-hairline">
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
                    </ArchiveYear>
                ))}
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
