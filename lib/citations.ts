import { publications } from "@/app/data";

/**
 * Per-paper citation counts from OpenAlex (official free API, DOI-keyed).
 * Google Scholar has no API and scrapers break silently — OpenAlex counts are
 * slightly conservative but verifiable; the UI labels the source explicitly.
 * Fetched server-side with daily ISR; failure degrades to an empty map.
 */

const OPENALEX = "https://api.openalex.org/works";

function bareDoi(link: string): string | null {
    const m = link.match(/doi\.org\/(.+)$/i);
    return m ? m[1].toLowerCase() : null;
}

export async function getCitations(): Promise<{
    byDoi: Record<string, number>;
    total: number;
}> {
    const dois = publications
        .map((p) => bareDoi(p.link))
        .filter((d): d is string => Boolean(d));
    try {
        const filter = `doi:${dois.join("|")}`;
        const url = `${OPENALEX}?filter=${encodeURIComponent(filter)}&per-page=${dois.length}&select=doi,cited_by_count`;
        const res = await fetch(url, {
            next: { revalidate: 86400 },
            headers: { "User-Agent": "mftel.vercel.app (mailto:ilwoongpark@inha.ac.kr)" },
        });
        if (!res.ok) return { byDoi: {}, total: 0 };
        const json: { results?: { doi?: string; cited_by_count?: number }[] } = await res.json();
        const byDoi: Record<string, number> = {};
        let total = 0;
        for (const w of json.results ?? []) {
            const d = w.doi ? bareDoi(w.doi) : null;
            if (d && typeof w.cited_by_count === "number") {
                byDoi[d] = w.cited_by_count;
                total += w.cited_by_count;
            }
        }
        return { byDoi, total };
    } catch {
        return { byDoi: {}, total: 0 };
    }
}

export { bareDoi };
