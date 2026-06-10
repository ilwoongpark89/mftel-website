import { cn } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";

/**
 * CALORIMETER mono layer. Mono type is reachable ONLY through these
 * components (Kicker / Meta / FigCaption) — never a raw font-mono class
 * in section code. Keeps the annotation layer from drifting into prose.
 */

/** Folio kicker: mono uppercase label sitting ON a full-width hairline rule. */
export function Kicker({
    index,
    dark = false,
    className,
    children,
}: {
    index?: string;
    dark?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex items-center gap-4", className)}>
            <p
                className={cn(
                    "min-w-0 font-mono text-xs font-medium uppercase tracking-[0.12em]",
                    dark ? "text-ember-400" : "text-ember-700"
                )}
            >
                {index ? `${index} — ` : null}
                {children}
            </p>
            <span
                aria-hidden
                className={cn("h-px min-w-6 flex-1", dark ? "bg-white/10" : "bg-hairline")}
            />
        </div>
    );
}

/** Mono metadata: dates, DOIs, vol/pages, grant + patent numbers. */
export function Meta({
    dark = false,
    className,
    children,
}: {
    dark?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "font-mono text-[13px] tabular-nums",
                dark ? "text-ink-4" : "text-ink-3",
                className
            )}
        >
            {children}
        </span>
    );
}

/** Mono figure caption: "FIG. 02 — PCM CHARGE/DISCHARGE" */
export function FigCaption({
    dark = false,
    className,
    children,
}: {
    dark?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <p
            className={cn(
                "font-mono text-[11px] uppercase tracking-[0.08em]",
                dark ? "text-ink-4" : "text-ink-3",
                className
            )}
        >
            {children}
        </p>
    );
}

/**
 * Standard section header block: folio kicker + h2 + optional subhead.
 * Left-aligned. This is the ONLY block that scroll-reveals (frame-0 law:
 * section bodies never animate in).
 */
export function SectionHeader({
    index,
    kicker,
    title,
    sub,
    dark = false,
    isKorean = false,
    className,
}: {
    index?: string;
    kicker: React.ReactNode;
    title: React.ReactNode;
    sub?: React.ReactNode;
    dark?: boolean;
    isKorean?: boolean;
    className?: string;
}) {
    return (
        <Reveal className={cn("mb-8 md:mb-12", className)}>
            <Kicker index={index} dark={dark}>
                {kicker}
            </Kicker>
            <h2
                className={cn(
                    "mt-4 text-3xl font-semibold tracking-tight md:text-[40px]",
                    isKorean ? "leading-[1.3]" : "leading-[1.15]",
                    dark ? "text-paper" : "text-ink"
                )}
            >
                {title}
            </h2>
            {sub ? (
                <p className={cn("mt-3 max-w-2xl text-lg", dark ? "text-ink-4" : "text-ink-2")}>
                    {sub}
                </p>
            ) : null}
        </Reveal>
    );
}
