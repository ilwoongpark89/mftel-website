"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Check } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import { Scene, Label, display, title, lead, AmbientField } from "@/components/home/primitives";

/**
 * /join — the recruiting experience. The vision is never posted; it is
 * EXPERIENCED: the headline distills it, the "who we look for" rows carry it,
 * and the contact-mail spec itself asks for immersion + a new question —
 * applying IS the first encounter with the lab's philosophy.
 * No administrative vocabulary (no "무제한", no "출퇴근") — culture, not policy.
 */

const EMAIL = "ilwoongpark@inha.ac.kr";
const GRAD_URL = "https://grad.inha.ac.kr";

function EmailCopy({ labelIdle }: { labelIdle: string }) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
        } catch {
            // address is visible either way
        }
        setCopied(true);
    };
    return (
        <div className="flex flex-col items-start gap-3">
            <button
                type="button"
                onClick={copy}
                className="glow-ember inline-flex h-13 items-center gap-2.5 rounded-full bg-ember-600 px-8 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-ember-500"
            >
                {copied ? (
                    <>
                        <Check aria-hidden className="h-4.5 w-4.5" />
                        {EMAIL}
                    </>
                ) : (
                    <>
                        <Mail aria-hidden className="h-4.5 w-4.5" />
                        {labelIdle}
                    </>
                )}
            </button>
            <p
                aria-live="polite"
                className={cn(
                    "text-[14px] transition-colors duration-200",
                    copied ? "text-ember-400" : "text-stone-500"
                )}
            >
                {copied ? t("contact.emailCopied") : EMAIL}
            </p>
        </div>
    );
}

export default function JoinStory() {
    const { language, lp } = useLanguage();
    const isKR = language === "KR";

    const SEEK = isKR
        ? [
              {
                  index: "01",
                  title: "질문을 새로 만드는 사람",
                  desc: "주어진 문제를 한 번 더 의심하고, 당연해 보이는 물음을 다시 정의하는 사람. 답을 빨리 맞히는 것보다 물어야 할 것을 찾아내는 쪽이, 우리에게는 훨씬 중요합니다.",
              },
              {
                  index: "02",
                  title: "깨지고도 다시 돌아오는 사람",
                  desc: "실패를 당연한 과정으로 받아들이고, 수없이 깨지고도 같은 문제 앞에 다시 서는 사람. 새로운 것은 늘 그 반복의 끝에서 나왔습니다.",
              },
              {
                  index: "03",
                  title: "몰입을 아는 사람",
                  desc: "시간 가는 줄 모르고 무언가에 빠져 본 사람. 연구가 아니어도 좋습니다. 팀으로 승부를 겨뤄 본 사람이라면, 우리와 더 빨리 통할 겁니다.",
              },
          ]
        : [
              {
                  index: "01",
                  title: "People who invent questions",
                  desc: "Those who doubt the given problem once more and redefine what everyone takes for granted. Finding what to ask matters far more to us than answering fast.",
              },
              {
                  index: "02",
                  title: "People who come back after breaking",
                  desc: "Those who treat failure as the natural path and return to the same problem after being broken by it — that is where the new comes from.",
              },
              {
                  index: "03",
                  title: "People who know immersion",
                  desc: "Those who have lost track of time inside something. It does not have to be research — athletes who know team-versus-team competition tend to get us quickly.",
              },
          ];

    const HOW = isKR
        ? [
              {
                  title: "시간을 세지 않습니다",
                  desc: "몇 시에 왔는지보다, 무엇이 쌓였는지를 봅니다. 우리는 결과와 기록으로 말합니다.",
              },
              {
                  title: "몰입은 자리에서 나오지 않습니다",
                  desc: "깊이 빠져들 수만 있다면, 그곳이 어디든 연구실입니다.",
              },
              {
                  title: "약속은 하나입니다",
                  desc: "연구의 모든 과정을 우리가 직접 만든 AI 연구 기록 시스템에 남깁니다. 그 기록이 곧 연구실의 역사가 됩니다.",
              },
          ]
        : [
              {
                  title: "We don't count hours",
                  desc: "What accumulates matters more than when you arrived. We speak in results and records.",
              },
              {
                  title: "Immersion doesn't come from a desk",
                  desc: "If you can go deep, wherever you are is the lab.",
              },
              {
                  title: "One promise",
                  desc: "Every step of research accumulates in the AI research-record system we built ourselves. The record becomes the lab's history.",
              },
          ];

    const TRACKS = isKR
        ? [
              {
                  title: "석사 · 박사 · 석박사통합",
                  desc: "연구실의 중심입니다. 세 연구 분야 — 열에너지 저장, AI 반도체 냉각, SMR 안전 — 안에서 자신만의 질문을 찾아갑니다. 입학 전형은 인하대학교 일반대학원 일정을 따르며, 마감 두세 달 전에는 미리 연락해 주시길 권합니다.",
                  meta: { label: "모집요강 ↗", href: GRAD_URL },
              },
              {
                  title: "학부연구생 — 상시 모집",
                  desc: "3~4학년이라면 방학 때 집중해도, 학기 중에 병행해도 좋습니다. 잡무가 아니라 실험 데이터 처리, 적외선 이미지 분석 같은 실제 연구를 맡습니다. 대학원 진학의 가장 자연스러운 출발점입니다.",
              },
              {
                  title: "박사후연구원",
                  desc: "진행 중인 과제에 따라 수시로 모집합니다. CV와 함께 이메일로 문의해 주세요.",
              },
              {
                  title: "International Students",
                  desc: "국적은 상관없습니다. 영어로 연락 주셔도 좋습니다 — we welcome international applicants.",
              },
          ]
        : [
              {
                  title: "MS · PhD · Integrated",
                  desc: "The core of the lab. You will find your own question within our three fronts (thermal energy storage · AI semiconductor cooling · SMR safety). Admissions follow the Inha graduate-school cycle; we recommend contacting us 2–3 months before the deadline.",
                  meta: { label: "Admissions ↗", href: GRAD_URL },
              },
              {
                  title: "Undergraduate Researchers — always open",
                  desc: "3rd–4th year students, full-time over breaks or part-time during semesters. You take on real tasks — rig data processing, IR image analysis. The most natural path into the graduate program.",
              },
              {
                  title: "Postdoctoral Researchers",
                  desc: "Openings depend on active projects. Email us with your CV anytime.",
              },
              {
                  title: "International Students",
                  desc: "We welcome international applicants — feel free to reach out in English.",
              },
          ];

    const MAIL_SPEC = isKR
        ? {
              heading: "지원은 이메일 한 통으로 시작합니다",
              sub: "성적표도, 화려한 스펙도 필요하지 않습니다. 두 가지면 충분합니다.",
              items: [
                  { n: "①", text: "가장 깊이 몰입했던 경험 한 단락. 연구가 아니어도 좋습니다." },
                  { n: "②", text: "우리 연구를 둘러보다 떠오른 질문 하나." },
                  { n: "+", text: "학위과정 지원자라면, 관심 있는 연구 분야도 함께 적어 주세요 — 열에너지 저장, AI 반도체 냉각, SMR 안전." },
              ],
              promise: "받은 메일에는 일주일 안에 반드시 답장합니다.",
              cta: "이메일 주소 복사",
          }
        : {
              heading: "Applying starts with one email",
              sub: "No transcript, no spec sheet. Two things are enough.",
              items: [
                  { n: "①", text: "One paragraph on the deepest immersion you have experienced. It does not have to be research." },
                  { n: "②", text: "One question that came to you while looking through our research." },
                  { n: "+", text: "Degree applicants — add the field you are drawn to: thermal energy storage, AI semiconductor cooling, or SMR safety." },
              ],
              promise: "We reply to every email within a week.",
              cta: "Copy email address",
          };

    const FAQ = isKR
        ? [
              {
                  q: "언제 연락하면 되나요?",
                  a: "학위과정은 전형 마감 두세 달 전이 좋습니다. 학부연구생은 언제든 환영합니다. 전형 일정은 인하대학교 일반대학원 모집요강에서 확인할 수 있습니다.",
              },
              {
                  q: "출신 학교나 전공이 중요한가요?",
                  a: "보지 않습니다. 어디에서 왔는지보다, 무엇에 몰입해 봤고 무엇을 묻고 싶은지가 중요합니다.",
              },
              {
                  q: "연구 주제는 어떻게 정하나요?",
                  a: "세 연구 분야 안에서 시작하되, 정해진 주제를 받아 가는 것이 아니라 자신의 질문을 함께 만들어 갑니다.",
              },
              {
                  q: "연구실 분위기는 어떤가요?",
                  a: "결과와 기록으로 말하는 곳입니다. 위의 '일하는 방식' 세 문장이 사실상 전부입니다.",
              },
              {
                  q: "영어가 부족해도 괜찮나요?",
                  a: "논문은 영어로 쓰지만, 쓰면서 함께 배웁니다. 노르웨이 NTNU, 독일 HZDR, 스페인 UPC와의 교류가 자연스러운 훈련이 됩니다.",
              },
              {
                  q: "학부연구생은 무엇을 하나요?",
                  a: "실험 데이터 처리, 이미지 분석 같은 실제 연구를 맡습니다. 성과가 쌓이면 학회 포스터 발표와 공저 기회로 이어집니다.",
              },
          ]
        : [
              {
                  q: "When should I reach out?",
                  a: "For degree programs, 2–3 months before the admissions deadline. Undergraduate researcher positions are always open. See the Inha graduate admissions guide for exact dates.",
              },
              {
                  q: "Does my school or major matter?",
                  a: "We don't look at where you came from. The two things in the email above — your immersion and your question — are enough.",
              },
              {
                  q: "How are research topics decided?",
                  a: "You start within our three fronts, but you don't receive a topic — we define your question together.",
              },
              {
                  q: "What is lab life like?",
                  a: "Results and records. The three sentences under 'How we work' above are effectively the whole rulebook.",
              },
              {
                  q: "What if my English isn't strong?",
                  a: "Papers are written in English, and you learn by writing them. Exchanges with NTNU, HZDR, and UPC are natural training.",
              },
              {
                  q: "What do undergraduate researchers do?",
                  a: "Real research tasks — rig data processing, image analysis — with poster and co-authorship opportunities as results accumulate.",
              },
          ];

    return (
        <div className="relative bg-coal">
            <AmbientField />

            {/* opening — the distilled vision */}
            <Scene className="min-h-[72svh]">
                <div className="cal-rise max-w-3xl">
                    <Label className="mb-6">{isKR ? "연구실 모집" : "Join Us"}</Label>
                    <h1 className={display(isKR)}>
                        {isKR ? (
                            <>
                                정답을 빨리 맞히는 사람보다,{" "}
                                <span className="text-ember-400">물어야 할 것을 새로 찾아내는 사람</span>
                            </>
                        ) : (
                            <>
                                Not the fastest to answer —{" "}
                                <span className="text-ember-400">the one who finds what to ask</span>
                            </>
                        )}
                    </h1>
                    <p className={cn("mt-7 max-w-xl", lead(isKR))}>
                        {isKR
                            ? "MFTEL은 몰입과 실패를 아는 사람을 찾습니다. 석사든 박사든 학부연구생이든, 시작은 이메일 한 통입니다."
                            : "MFTEL looks for people who know immersion and failure. MS, PhD, or undergraduate — it starts with one email."}
                    </p>
                </div>
            </Scene>

            {/* who we look for */}
            <Scene full={false}>
                <Reveal>
                    <Label>{isKR ? "우리가 찾는 사람" : "Who we look for"}</Label>
                </Reveal>
                <Reveal as="ul" className="reveal-stagger mt-10 border-t border-white/8">
                    {SEEK.map((row) => (
                        <li key={row.index} className="grid grid-cols-12 gap-x-4 border-b border-white/8 px-2 py-9 md:px-4 md:py-10">
                            <span className="col-span-12 mb-3 text-[15px] font-semibold text-ember-400 md:col-span-1 md:mb-0">
                                {row.index}
                            </span>
                            <span className="col-span-12 md:col-span-11">
                                <span
                                    className={cn(
                                        "block break-keep text-[22px] font-bold tracking-[-0.02em] text-paper md:text-[26px]",
                                        isKR ? "leading-[1.35]" : "leading-[1.2]"
                                    )}
                                >
                                    {row.title}
                                </span>
                                <span
                                    className={cn(
                                        "mt-2.5 block max-w-2xl text-[16px] text-stone-400",
                                        isKR ? "leading-[1.75]" : "leading-[1.6]"
                                    )}
                                >
                                    {row.desc}
                                </span>
                            </span>
                        </li>
                    ))}
                </Reveal>
            </Scene>

            {/* how we work — culture, not policy */}
            <Scene full={false}>
                <Reveal>
                    <Label>{isKR ? "일하는 방식" : "How we work"}</Label>
                </Reveal>
                <Reveal className="reveal-stagger mt-10 grid gap-4 md:grid-cols-3">
                    {HOW.map((c) => (
                        <div key={c.title} className="rounded-xl border border-white/8 bg-white/[0.03] p-7">
                            <p className={cn("break-keep text-[19px] font-bold text-paper", isKR ? "leading-[1.4]" : "leading-[1.25]")}>
                                {c.title}
                            </p>
                            <p className={cn("mt-3 break-keep text-[15px] text-stone-400", isKR ? "leading-[1.75]" : "leading-[1.6]")}>
                                {c.desc}
                            </p>
                        </div>
                    ))}
                </Reveal>
            </Scene>

            {/* tracks */}
            <Scene full={false}>
                <Reveal>
                    <Label>{isKR ? "함께 걷는 길" : "Ways to Join"}</Label>
                </Reveal>
                <Reveal as="ul" className="reveal-stagger mt-10 border-t border-white/8">
                    {TRACKS.map((tr) => (
                        <li key={tr.title} className="border-b border-white/8 px-2 py-8 md:px-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
                                <p className={cn("break-keep text-[20px] font-bold text-paper", isKR ? "leading-[1.4]" : "leading-[1.25]")}>
                                    {tr.title}
                                </p>
                                {tr.meta ? (
                                    <a
                                        href={tr.meta.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[13px] font-semibold uppercase tracking-[0.1em] text-stone-500 transition-colors duration-150 hover:text-ember-400"
                                    >
                                        {tr.meta.label}
                                    </a>
                                ) : null}
                            </div>
                            <p className={cn("mt-2.5 max-w-3xl break-keep text-[15px] text-stone-400", isKR ? "leading-[1.75]" : "leading-[1.6]")}>
                                {tr.desc}
                            </p>
                        </li>
                    ))}
                </Reveal>
            </Scene>

            {/* the contact mail — applying IS the vision */}
            <Scene>
                <div className="mx-auto max-w-3xl">
                    <Reveal>
                        <Label>{isKR ? "지원 방법" : "How to apply"}</Label>
                        <h2 className={cn("mt-5", title(isKR))}>{MAIL_SPEC.heading}</h2>
                        <p className={cn("mt-4", lead(isKR))}>{MAIL_SPEC.sub}</p>
                    </Reveal>
                    <Reveal as="ul" className="reveal-stagger mt-9 space-y-5">
                        {MAIL_SPEC.items.map((it) => (
                            <li key={it.n} className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-6">
                                <span className="text-[18px] font-bold text-ember-400">{it.n}</span>
                                <span className={cn("break-keep text-[16px] text-stone-300", isKR ? "leading-[1.75]" : "leading-[1.6]")}>
                                    {it.text}
                                </span>
                            </li>
                        ))}
                    </Reveal>
                    <Reveal className="mt-9">
                        <p className="text-[15px] font-semibold text-ember-400">{MAIL_SPEC.promise}</p>
                        <div className="mt-6">
                            <EmailCopy labelIdle={MAIL_SPEC.cta} />
                        </div>
                    </Reveal>
                </div>
            </Scene>

            {/* FAQ */}
            <Scene full={false} className="pb-28 md:pb-36">
                <Reveal>
                    <Label>FAQ</Label>
                </Reveal>
                <Reveal as="ul" className="reveal-stagger mt-10 border-t border-white/8">
                    {FAQ.map((f) => (
                        <li key={f.q} className="border-b border-white/8 px-2 py-7 md:px-4">
                            <p className={cn("break-keep text-[17px] font-bold text-paper", isKR ? "leading-[1.45]" : "leading-[1.3]")}>
                                {f.q}
                            </p>
                            <p className={cn("mt-2.5 max-w-3xl break-keep text-[15px] text-stone-400", isKR ? "leading-[1.75]" : "leading-[1.6]")}>
                                {f.a}
                            </p>
                        </li>
                    ))}
                </Reveal>
                <Reveal className="mt-12">
                    <Link
                        href={lp("/philosophy")}
                        className="text-[14px] text-stone-500 transition-colors duration-150 hover:text-ember-400"
                    >
                        {isKR ? "우리가 믿는 것 →" : "What we believe →"}
                    </Link>
                </Reveal>
            </Scene>
        </div>
    );
}
