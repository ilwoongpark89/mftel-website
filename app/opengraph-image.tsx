import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MFTEL - Multiphase Flow and Thermal Engineering Laboratory';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

// CALORIMETER: warm paper, ink, single ember accent — matches the site.
export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#FAFAF9',
                    padding: '72px 80px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: '#C2410C',
                            letterSpacing: '0.12em',
                        }}
                    >
                        INHA UNIVERSITY · MFTEL
                    </div>
                    <div style={{ flex: 1, height: 1, background: '#E7E5E4', display: 'flex' }} />
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 28,
                    }}
                >
                    <div
                        style={{
                            fontSize: 76,
                            fontWeight: 700,
                            color: '#1C1917',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            maxWidth: 1000,
                        }}
                    >
                        Engineering Sustainable Energy Future
                    </div>
                    <div
                        style={{
                            fontSize: 26,
                            color: '#44403C',
                            lineHeight: 1.5,
                            maxWidth: 860,
                        }}
                    >
                        Multiphase Flow and Thermal Engineering Laboratory — thermal energy
                        storage, immersion cooling, and reactor safety research.
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 48,
                        borderTop: '1px solid #E7E5E4',
                        paddingTop: 28,
                    }}
                >
                    {[
                        ['25', 'PUBLICATIONS'],
                        ['12', 'FUNDED PROJECTS'],
                        ['4', 'PATENTS'],
                        ['12', 'COLLABORATORS'],
                    ].map(([value, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                            <div style={{ fontSize: 40, fontWeight: 700, color: '#1C1917' }}>{value}</div>
                            <div style={{ fontSize: 17, color: '#78716C', letterSpacing: '0.08em' }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
