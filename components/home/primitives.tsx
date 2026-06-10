import { cn } from "@/lib/utils";

/**
 * v3 DEEP FIELD shared primitives — one scene shell, one label, five type
 * sizes. Used by the home story and the dark narrative pages (/join,
 * /philosophy) so the discipline can never fork.
 */

export function Scene({
    id,
    full = true,
    center = false,
    className,
    children,
}: {
    id?: string;
    full?: boolean;
    center?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            id={id}
            data-nav-dark
            className={cn(
                "relative z-[1] flex",
                full ? "min-h-[80svh] items-center py-20" : "py-16 md:py-24",
                className
            )}
        >
            <div className={cn("mx-auto w-full max-w-[1120px] px-6 md:px-8", center && "text-center")}>
                {children}
            </div>
        </section>
    );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p
            className={cn(
                "text-[13px] font-semibold uppercase tracking-[0.18em] text-ember-400",
                className
            )}
        >
            {children}
        </p>
    );
}

export const display = (isKR: boolean) =>
    cn(
        "break-keep text-[42px] font-bold tracking-[-0.03em] text-paper [text-wrap:balance] md:text-[64px]",
        isKR ? "leading-[1.22]" : "leading-[1.05]"
    );

export const title = (isKR: boolean) =>
    cn(
        "break-keep text-[30px] font-bold tracking-[-0.02em] text-paper [text-wrap:balance] md:text-[42px]",
        isKR ? "leading-[1.3]" : "leading-[1.12]"
    );

export const lead = (isKR: boolean) =>
    cn(
        "break-keep text-[18px] text-stone-300 md:text-[20px]",
        isKR ? "leading-[1.75]" : "leading-[1.65]"
    );

/** dark ambient field — fixed ember space behind every scene of a dark page */
export function AmbientField() {
    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
            style={{
                background:
                    "radial-gradient(ellipse 110% 50% at 50% 115%, rgba(234,88,12,0.10), rgba(234,88,12,0.03) 55%, transparent 78%), radial-gradient(ellipse 80% 60% at 85% -15%, rgba(68,64,60,0.35), transparent 70%)",
            }}
        />
    );
}
