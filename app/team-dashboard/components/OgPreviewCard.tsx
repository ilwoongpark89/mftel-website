"use client";

import { useState, useEffect } from "react";

// Module-level cache to avoid refetching across renders/components
const ogCache = new Map<string, OgData | null>();

interface OgData {
    title: string;
    description: string;
    image: string;
    url: string;
}

export function OgPreviewCard({ url }: { url: string }) {
    const [data, setData] = useState<OgData | null>(ogCache.get(url) ?? null);
    const [loading, setLoading] = useState(!ogCache.has(url));
    const [error, setError] = useState(false);

    useEffect(() => {
        if (ogCache.has(url)) {
            setData(ogCache.get(url) ?? null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(false);

        fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
            .then(res => res.json())
            .then((result: OgData) => {
                if (cancelled) return;
                if (result.title || result.description || result.image) {
                    ogCache.set(url, result);
                    setData(result);
                } else {
                    ogCache.set(url, null);
                    setData(null);
                }
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                ogCache.set(url, null);
                setError(true);
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [url]);

    // Skeleton loading state
    if (loading) {
        return (
            <div className="mt-1.5 flex gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 max-w-[360px] animate-pulse" onClick={e => e.stopPropagation()}>
                <div className="w-[60px] h-[60px] rounded bg-slate-200 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5 py-0.5">
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-200 rounded w-full" />
                    <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                </div>
            </div>
        );
    }

    // Don't render if no data or error
    if (error || !data || (!data.title && !data.description)) return null;

    let domain = '';
    try { domain = new URL(data.url || url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }

    return (
        <a
            href={data.url || url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 flex gap-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-2.5 max-w-[360px] no-underline cursor-pointer"
            onClick={e => e.stopPropagation()}
        >
            {data.image && (
                <div className="w-[60px] h-[60px] rounded bg-slate-200 flex-shrink-0 overflow-hidden">
                    <img
                        src={data.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}
            <div className="flex-1 min-w-0">
                {data.title && (
                    <div className="text-[12px] font-semibold text-slate-700 truncate leading-snug">
                        {data.title}
                    </div>
                )}
                {data.description && (
                    <div className="text-[11px] text-slate-500 line-clamp-2 leading-snug mt-0.5">
                        {data.description}
                    </div>
                )}
                {domain && (
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {domain}
                    </div>
                )}
            </div>
        </a>
    );
}
