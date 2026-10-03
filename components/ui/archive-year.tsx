import type { ReactNode } from "react";

/** A shared hierarchy for all year-grouped public archives. */
export default function ArchiveYear({ year, id, children }: {
    year: string;
    id: string;
    children: ReactNode;
}) {
    return (
        <section className="archive-year" aria-labelledby={id}>
            <h3 id={id} className="archive-year-heading">{year}</h3>
            {children}
        </section>
    );
}
