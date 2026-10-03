import type { ReactNode } from "react";

/** A shared hierarchy for all year-grouped public archives. */
export default function ArchiveYear({ year, id, count, current = false, children }: {
    year: string;
    id: string;
    count?: string;
    current?: boolean;
    children: ReactNode;
}) {
    return (
        <section className={`archive-year${current ? " archive-current" : ""}`} aria-labelledby={id}>
            <h3 id={id} className="archive-year-heading">{year}{count ? <span className="archive-year-count">{count}</span> : null}</h3>
            {children}
        </section>
    );
}
