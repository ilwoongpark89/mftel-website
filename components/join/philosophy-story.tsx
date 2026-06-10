"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import Reveal from "@/components/ui/reveal";
import { Scene, Label, AmbientField } from "@/components/home/primitives";

/**
 * /philosophy — the public adaptation of the PI's internal vision essay.
 * Kept quiet on purpose: reached via small footer / join links only.
 * The personal narrative stays private; sections 1–4 carry the conviction.
 * Korean by design — it is written for the students it was meant for.
 */

const SECTIONS = [
    {
        n: "1",
        heading: "정보의 유효기간은 짧아지고, 그것을 평가하는 방식의 유효기간은 이미 지났다",
        body: [
            "지식은 여전히 중요하다. 다만 한번 익혀둔 것이 언제까지나 유효하지는 않고, 정보의 유효기간은 점점 짧아지고 있다. 그래서 잘 기억하는 능력의 값어치도 줄어든다.",
            "진짜 문제는 그다음이다. 정보에 유효기간이 있다면, 그것을 평가하는 방식에도 유효기간이 있다. 지식을 얼마나 빨리, 얼마나 정확히 맞히느냐로 사람을 줄 세우는 방식 — 그 유효기간은 이미 의심받고 있다.",
            "우리는 그 줄 바깥에서 다른 이야기를 만들어보려 한다. 기억하는 법이 아니라, 문제를 찾고 정의하고 풀어가는 법. 우리에게는 그쪽이 훨씬 중요하다.",
        ],
    },
    {
        n: "2",
        heading: "정답을 맞히는 일은, 결국 패턴의 반복이다",
        body: [
            "배운 것을 떠올려 답을 적는 일은 익숙한 패턴을 다시 꺼내는 것에 가깝다. 우리가 우선하는 능력은 그보다 한 걸음 앞에 있다.",
            "주어진 문제를 한 번 더 의심하는 것. 당연하게 놓인 물음을 다시 정의하는 것. 그리고 아직 누구도 답을 갖지 못한 자리까지 걸어가, 거기서 비로소 던질 수 있는 새로운 질문을 찾아내는 것.",
            "답을 잘 맞히는 사람보다, 물어야 할 것을 새로 찾아내는 사람. 그런 사람만이 유의미한 새로운 가치를 만들어내는 시대가 오고 있다.",
        ],
    },
    {
        n: "3",
        heading: "새로운 것은 몰입과 실패에서 나온다",
        body: [
            "그렇게 찾아낸 질문의 답은 책상 위에서 단번에 나오지 않는다. 무언가에 푹 빠져 시간을 잊고 직접 부딪치는 것, 그 안에서 몇 번이고 깨지는 것. 전에 없던 것을 먼저 발견하는 길은 그뿐이다.",
            "실패를 자연스러운 과정으로 받아들이고, 그 과정마저 즐길 줄 알게 되는 것. 그리고 수많은 반복 끝에 새로운 것을 만들어내는 것. 그것이 우리가 걸어가는 길이다.",
            "그 길을 끝까지 걷는 사람, 수없이 깨지고도 같은 문제 앞으로 다시 돌아오는 사람. 우리는 그런 사람이고, 그런 사람을 만든다.",
        ],
    },
    {
        n: "4",
        heading: "몰입하는 사람을 기르고, 몰입할 수 있는 자리를 만든다",
        body: [
            "우리는 몰입하는 사람을 길러낸다. 동시에 그 사람이 마음껏 실패하고 다시 일어설 수 있는 환경을 만든다. 사람과 환경, 우리는 그 둘 어느 쪽도 놓지 않는다.",
            "사람과 환경이 나란히 쌓여가는 자리에서, 기존의 줄로는 닿을 수 없는 결과가 나온다. 그것이 우리가 끝내 닿으려는 곳이다. 그리고 그때 우리는, 누군가를 줄 세우지 않고도 자연스럽게 새로운 기준이 된다.",
        ],
    },
];

export default function PhilosophyStory() {
    const { language, lp } = useLanguage();
    const isKR = language === "KR";

    return (
        <div className="relative bg-coal">
            <AmbientField />

            <Scene className="min-h-[60svh]">
                <div className="cal-rise mx-auto max-w-2xl">
                    <Label className="mb-6">MFTEL Common Vision</Label>
                    <h1 className="break-keep text-[36px] font-bold leading-[1.25] tracking-[-0.02em] text-paper [text-wrap:balance] md:text-[52px]">
                        정답 추구가 아닌, <span className="text-ember-400">실패와 몰입</span>
                    </h1>
                    <p className="mt-7 break-keep text-[18px] leading-[1.8] text-stone-300 md:text-[19px]">
                        정답을 빠르게 맞히는 일은 이제 기계가 더 잘한다. 우리는 오랫동안 바로 그
                        능력으로 사람을 줄 세워왔고, 지금의 시스템은 그 줄을 기준으로 돌아간다.
                        하지만 우리는 그 줄 바깥에서 다른 길을 함께 찾으려 한다.
                    </p>
                    {!isKR ? (
                        <p className="mt-5 text-[14px] italic leading-[1.6] text-stone-500">
                            What we believe — written for our students, in the language it was
                            meant in.
                        </p>
                    ) : null}
                </div>
            </Scene>

            {SECTIONS.map((s) => (
                <Scene key={s.n} full={false}>
                    <Reveal className="mx-auto max-w-2xl">
                        <p className="text-[15px] font-semibold text-ember-400">{s.n}</p>
                        <h2 className="mt-3 break-keep text-[24px] font-bold leading-[1.4] tracking-[-0.02em] text-paper [text-wrap:balance] md:text-[28px]">
                            {s.heading}
                        </h2>
                        <div className="mt-6 space-y-5">
                            {s.body.map((p) => (
                                <p
                                    key={p.slice(0, 20)}
                                    className="break-keep text-[16.5px] leading-[1.85] text-stone-300"
                                >
                                    {p}
                                </p>
                            ))}
                        </div>
                    </Reveal>
                </Scene>
            ))}

            <Scene full={false} className="pb-28 md:pb-36">
                <Reveal className="mx-auto max-w-2xl border-t border-white/8 pt-10">
                    <p className="text-[15px] font-semibold text-stone-400">— MFTEL</p>
                    <Link
                        href={lp("/join")}
                        className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 text-[15px] font-medium text-paper transition-colors duration-150 hover:border-white/35 hover:bg-white/5"
                    >
                        {isKR ? "이 길을 함께 걷기" : "Walk this road with us"}
                        <span aria-hidden className="text-stone-500">
                            →
                        </span>
                    </Link>
                </Reveal>
            </Scene>
        </div>
    );
}
