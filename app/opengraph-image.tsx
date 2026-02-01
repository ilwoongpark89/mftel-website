import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MFTEL - Multiphase Flow and Thermal Engineering Laboratory';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
                    padding: '60px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 32,
                            fontWeight: 600,
                            color: '#e11d48',
                            letterSpacing: '0.1em',
                            marginBottom: 20,
                        }}
                    >
                        MFTEL @ INHA UNIVERSITY
                    </div>
                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 700,
                            color: 'white',
                            lineHeight: 1.2,
                            marginBottom: 30,
                            maxWidth: 900,
                        }}
                    >
                        Engineering a Sustainable Energy Future
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            color: '#94a3b8',
                            lineHeight: 1.6,
                            maxWidth: 800,
                            textAlign: 'center',
                        }}
                    >
                        Multiphase Flow and Thermal Engineering Laboratory advancing thermal science through thermal energy storage, electronics cooling, and reactor safety research.
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
