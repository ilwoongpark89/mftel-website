import { NextRequest, NextResponse } from 'next/server';

// POST - Batch IP geolocation using ip-api.com (free, server-side only)
export async function POST(request: NextRequest) {
    try {
        const { ips } = await request.json();
        if (!Array.isArray(ips) || ips.length === 0) {
            return NextResponse.json({ error: 'ips array required' }, { status: 400 });
        }

        const batch = ips.slice(0, 100);

        const res = await fetch('http://ip-api.com/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batch.map((ip: string) => ({ query: ip, fields: 'query,city,country,countryCode,status' }))),
        });
        const data = await res.json();

        const locations: Record<string, string> = {};
        for (const item of data) {
            if (item.status === 'success') {
                locations[item.query] = item.countryCode === 'KR' ? item.city : `${item.city}, ${item.country}`;
            } else {
                locations[item.query] = '?';
            }
        }

        return NextResponse.json({ locations });
    } catch {
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
