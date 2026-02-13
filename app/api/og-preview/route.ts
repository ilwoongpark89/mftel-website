import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

// In-memory fallback for local dev
const localCache: Record<string, { data: string; expires: number }> = {};

const OG_CACHE_PREFIX = 'mftel:og:';
const OG_TTL = 60 * 60 * 24; // 24 hours in seconds

async function getCached(key: string): Promise<string | null> {
    if (redis) {
        const val = await redis.get(key);
        if (val === null || val === undefined) return null;
        return typeof val === 'string' ? val : JSON.stringify(val);
    }
    const entry = localCache[key];
    if (!entry) return null;
    if (Date.now() > entry.expires) { delete localCache[key]; return null; }
    return entry.data;
}

async function setCached(key: string, value: string): Promise<void> {
    if (redis) {
        await redis.set(key, value, { ex: OG_TTL });
    } else {
        localCache[key] = { data: value, expires: Date.now() + OG_TTL * 1000 };
    }
}

function extractOgTags(html: string): { title: string; description: string; image: string } {
    const getMetaContent = (property: string): string => {
        // Match both property="og:..." and name="og:..."
        const patterns = [
            new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
            new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'),
            new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
            new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'),
        ];
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match?.[1]) return match[1];
        }
        return '';
    };

    let title = getMetaContent('og:title');
    let description = getMetaContent('og:description');
    const image = getMetaContent('og:image');

    // Fallback: try <title> tag if no og:title
    if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (titleMatch?.[1]) title = titleMatch[1].trim();
    }

    // Fallback: try meta description if no og:description
    if (!description) {
        description = getMetaContent('description');
    }

    // Decode HTML entities
    const decodeEntities = (s: string) =>
        s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');

    return {
        title: decodeEntities(title),
        description: decodeEntities(description),
        image,
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
    }

    // Validate URL
    try {
        new URL(url);
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        // Check cache first
        const cacheKey = OG_CACHE_PREFIX + encodeURIComponent(url);
        const cached = await getCached(cacheKey);
        if (cached) {
            return NextResponse.json(JSON.parse(cached), {
                headers: { 'Cache-Control': 'public, max-age=3600' },
            });
        }

        // Fetch URL with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MFTELBot/1.0; +https://mftel.vercel.app)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            redirect: 'follow',
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return NextResponse.json({});
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            return NextResponse.json({});
        }

        // Read only first 50KB to avoid huge pages
        const reader = response.body?.getReader();
        if (!reader) return NextResponse.json({});

        let html = '';
        const decoder = new TextDecoder();
        const MAX_BYTES = 50 * 1024;
        let totalBytes = 0;

        while (totalBytes < MAX_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            html += decoder.decode(value, { stream: true });
            totalBytes += value.length;
            // Early exit if we've found </head>
            if (html.includes('</head>')) break;
        }
        reader.cancel().catch(() => {});

        const og = extractOgTags(html);

        // Resolve relative image URL
        if (og.image && !og.image.startsWith('http')) {
            try {
                const base = new URL(url);
                og.image = new URL(og.image, base.origin).href;
            } catch { /* keep as-is */ }
        }

        const result = {
            title: og.title || '',
            description: og.description || '',
            image: og.image || '',
            url,
        };

        // Cache result
        await setCached(cacheKey, JSON.stringify(result));

        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'public, max-age=3600' },
        });
    } catch {
        // Timeout, network error, etc.
        return NextResponse.json({});
    }
}
