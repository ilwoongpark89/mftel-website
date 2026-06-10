import { ImageResponse } from 'next/og';
import { publications, projects, patents } from '@/app/data';

export const runtime = 'edge';

export const alt = 'MFTEL - Multiphase Flow and Thermal Engineering Laboratory';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

// v3 DEEP FIELD — coal ground, ember heat glow, rising bubbles, gradient accent.
// Counters derive from data so the card never drifts from the site.
const BUBBLES = [
    { x: 880, y: 470, r: 7, o: 0.5 },
    { x: 960, y: 380, r: 4, o: 0.35 },
    { x: 1040, y: 520, r: 10, o: 0.55 },
    { x: 1100, y: 300, r: 5, o: 0.3 },
    { x: 820, y: 250, r: 3, o: 0.25 },
    { x: 1010, y: 180, r: 4, o: 0.2 },
    { x: 920, y: 90, r: 3, o: 0.15 },
    { x: 1140, y: 430, r: 6, o: 0.4 },
];

export default async function Image() {
    const stats = [
        [String(publications.length), 'PUBLICATIONS'],
        [String(projects.length), 'FUNDED PROJECTS'],
        [String(patents.length), 'PATENTS'],
    ];
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#0C0A09',
                    backgroundImage:
                        'radial-gradient(ellipse 90% 55% at 50% 125%, rgba(234,88,12,0.42), rgba(234,88,12,0.10) 55%, rgba(12,10,9,0) 78%)',
                    padding: '64px 80px',
                    position: 'relative',
                }}
            >
                {/* rising bubbles — warm near the heated wall, cooling above */}
                {BUBBLES.map((b, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: b.x,
                            top: b.y,
                            width: b.r * 2,
                            height: b.r * 2,
                            borderRadius: 999,
                            backgroundColor:
                                b.y > 350
                                    ? `rgba(255,150,80,${b.o})`
                                    : `rgba(250,250,249,${b.o * 0.7})`,
                        }}
                    />
                ))}

                {/* kicker on hairline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#FAFAF9', letterSpacing: '-0.02em' }}>
                        MFTEL
                    </div>
                    <div
                        style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: '#FF9650',
                            letterSpacing: '0.14em',
                        }}
                    >
                        INHA UNIVERSITY · MULTIPHASE FLOW &amp; THERMAL ENGINEERING LAB
                    </div>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex' }} />
                </div>

                {/* headline — single gradient accent phrase */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            fontSize: 78,
                            fontWeight: 700,
                            color: '#FAFAF9',
                            lineHeight: 1.08,
                            letterSpacing: '-0.025em',
                        }}
                    >
                        Engineering a
                    </div>
                    <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em' }}>
                        <span
                            style={{
                                backgroundImage: 'linear-gradient(90deg, #FFB98A 0%, #FF9650 45%, #EA580C 100%)',
                                backgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            Sustainable Energy
                        </span>
                        <span style={{ color: '#FAFAF9', marginLeft: 22 }}>Future</span>
                    </div>
                </div>

                {/* record strip — derived from data */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 56,
                        borderTop: '1px solid rgba(255,255,255,0.12)',
                        paddingTop: 30,
                    }}
                >
                    {stats.map(([value, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                            <div style={{ fontSize: 44, fontWeight: 700, color: '#FAFAF9' }}>{value}</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#A8A29E', letterSpacing: '0.12em' }}>
                                {label}
                            </div>
                        </div>
                    ))}
                    <div style={{ flex: 1, display: 'flex' }} />
                    <div style={{ fontSize: 18, color: '#78716C' }}>mftel.vercel.app</div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
