import { cn } from "@/lib/utils";

/**
 * CALORIMETER section shell. One rhythm for every public-site band:
 * paper (default) / well (recessed) / coal (dark — Gallery, Join Us, Footer only).
 * Container: max-w-6xl + single gutter. Padding: py-16 md:py-28 unless compact.
 */
export default function Band({
    id,
    surface = "paper",
    compact = false,
    className,
    containerClassName,
    children,
}: {
    id?: string;
    surface?: "paper" | "white" | "well" | "coal";
    compact?: boolean;
    className?: string;
    containerClassName?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            id={id}
            className={cn(
                compact ? "py-14 md:py-20" : "py-16 md:py-28",
                surface === "paper" && "bg-paper",
                surface === "white" && "bg-white",
                surface === "well" && "bg-well",
                surface === "coal" && "bg-coal text-paper",
                className
            )}
        >
            <div className={cn("mx-auto max-w-6xl px-6 md:px-8", containerClassName)}>
                {children}
            </div>
        </section>
    );
}
