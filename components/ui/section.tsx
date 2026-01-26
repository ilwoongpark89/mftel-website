import { cn } from "@/lib/utils";

export default function Section({
    id,
    className,
    children,
}: {
    id?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            id={id}
            className={cn("py-12 md:py-16 relative overflow-hidden", className)}
        >
            <div className="container relative z-10">{children}</div>
        </section>
    );
}
