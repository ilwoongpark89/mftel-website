"use client";

import { useState } from "react";
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
    const { language } = useLanguage();
    const isKR = language === "KR";

    const SEEK = isKR
        ? [
              {
                  index: "01",
                  title: "질문을 새로 만드는 사람",
                  desc: "주어진 문제를 한 번 더 의심하고, 당연해 보이는 물음을 다시 정의해 보는 사람입니다. 저희는 이 능력을 가장 중요하게 봅니다.",
              },
              {
                  index: "02",
                  title: "실패해도 다시 돌아오는 사람",
                  desc: "실패를 과정의 일부로 받아들이고, 여러 번 실패한 뒤에도 같은 문제 앞에 다시 서는 사람입니다. 연구실의 새로운 결과는 대부분 그런 반복 끝에 나왔습니다.",
              },
              {
                  index: "03",
                  title: "몰입을 아는 사람",
                  desc: "시간 가는 줄 모르고 무언가에 빠져 본 사람입니다. 연구가 아니어도 좋습니다. 팀으로 경기를 해 본 사람이라면 더 빨리 적응할 것입니다.",
              },
          ]
        : [
              {
                  index: "01",
                  title: "People who ask new questions",
                  desc: "Those who doubt the given problem once more and redefine what everyone takes for granted. That is the ability we value most.",
              },
              {
                  index: "02",
                  title: "People who keep coming back after failure",
                  desc: "Those who treat failure as part of the process and come back to the same problem. Most new results in this lab arrived at the end of that repetition.",
              },
              {
                  index: "03",
                  title: "People who know deep focus",
                  desc: "Those who have lost track of time inside something. It does not have to be research. If you have competed as part of a team, you will click with us faster.",
              },
          ];

    const MAIL_SPEC = isKR
        ? {
              heading: "지원은 이메일로 받습니다",
              items: [
                  { n: "①", text: "인생에서 깊게 몰입한 주제와 경험들. 연구가 아니어도 좋습니다.", sub: "스포츠, 예체능, 게임 등 오랜 기간 높은 수준의 몰입으로 무엇인가를 이뤄 본 경험이 있으면 우대합니다." },
                  { n: "②", text: "연구실의 연구를 둘러보다 떠오른 질문 하나." },
                  { n: "+", text: "학위과정 지원자는 관심 있는 연구 분야(열에너지 저장, AI 반도체 냉각, SMR 안전)도 함께 적어 주세요." },
              ],
              promise: "받은 메일에는 일주일 안에 답장합니다.",
              cta: "이메일 주소 복사",
          }
        : {
              heading: "Applying starts with one email",
              items: [
                  { n: "①", text: "Topics and experiences you have immersed yourself in most deeply. They do not have to be research.", sub: "Long, high-level immersion that led to a real achievement in sports, the arts, music, or games counts in your favor." },
                  { n: "②", text: "One question that came to you while looking through our research." },
                  { n: "+", text: "If you are applying for a degree program, add the field you are interested in: thermal energy storage, AI semiconductor cooling, or SMR safety." },
              ],
              promise: "We reply to every email within a week.",
              cta: "Copy email address",
          };

    return (
        <div className="relative bg-coal">
            <AmbientField />

            {/* opening — the distilled vision */}
            <Scene>
                <div className="cal-rise max-w-3xl">
                    <Label className="mb-6">{isKR ? "모집 안내" : "Join Us"}</Label>
                    <h1 className={display(isKR)}>
                        {isKR ? (
                            <>
                                답을 빨리 맞히는 사람보다{" "}
                                <span className="text-ember-400">물어야 할 것을 찾아내는 사람</span>
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
                            ? "한 문제에 오래 몰입해 본 사람을 찾습니다. 석사·박사과정, 박사후연구원, 학부연구생 모두 이메일 한 통으로 시작합니다."
                            : "MFTEL looks for people who know deep focus and failure. Whether MS, PhD, or undergraduate, it starts with one email."}
                    </p>
                </div>
            </Scene>

            {/* who we look for */}
            <Scene full={false}>
                <Reveal>
                    <Label>{isKR ? "이런 사람을 찾습니다" : "Who we look for"}</Label>
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

            {/* the contact mail — applying IS the vision */}
            <Scene>
                <div className="mx-auto max-w-3xl">
                    <Reveal>
                        <Label>{isKR ? "지원 방법" : "How to apply"}</Label>
                        <h2 className={cn("mt-5", title(isKR))}>{MAIL_SPEC.heading}</h2>
                    </Reveal>
                    <Reveal as="ul" className="reveal-stagger mt-9 space-y-5">
                        {MAIL_SPEC.items.map((it) => (
                            <li key={it.n} className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-6">
                                <span className="text-[18px] font-bold text-ember-400">{it.n}</span>
                                <span className="min-w-0">
                                    <span className={cn("block break-keep text-[16px] text-stone-300", isKR ? "leading-[1.75]" : "leading-[1.6]")}>
                                        {it.text}
                                    </span>
                                    {"sub" in it && it.sub ? (
                                        <span className={cn("mt-1.5 block break-keep text-[14px] text-stone-400", isKR ? "leading-[1.7]" : "leading-[1.55]")}>
                                            {it.sub}
                                        </span>
                                    ) : null}
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

        </div>
    );
}
