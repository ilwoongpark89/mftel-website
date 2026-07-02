"use client";

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

interface Visit {
    ip: string;
    country: string;
    city: string;
    region: string;
    timestamp: string;
    userAgent: string;
    referrer?: string;
    path?: string;
    language?: string;
    screen?: string;
}

interface SessionJourney {
    paths: string[];
    country: string;
    device: string;
    ms: number;
    start: string;
}

interface AnalyticsData {
    totalVisits: number;
    totalPageViews?: number;
    pageViews?: Record<string, number>;
    pageDwell?: Record<string, number>;
    avgDwellSec?: number;
    sessions?: SessionJourney[];
    engagement?: { rate: number; engagedN: number; totalN: number; pagesPerSession: number; medianEngagedSec: number };
    goals?: Record<string, { total: number; period: number; prev: number }>;
    periodTotal: number;
    prevPeriodTotal?: number;
    uniqueTotal?: number;
    uniquePeriod?: number;
    dailyUnique?: Record<string, number>;
    countries: Record<string, number>;
    allCountries: Record<string, number>;
    recentVisits: Visit[];
    dailyStats: Record<string, number>;
    period: number;
}

const EMBER = '#EA580C';
const INK = '#1C1917';
const INK_3 = '#78716C';
const GRID = '#E7E5E4';
const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid #E7E5E4', fontSize: 12, color: '#1C1917', padding: '6px 10px' } as const;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function fmtDur(sec: number): string {
    if (!sec || sec < 1) return '—';
    if (sec < 60) return `${sec}초`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m}분 ${s}초` : `${m}분`;
}

const GOAL_LABELS: Record<string, string> = { join: '지원·합류 클릭', pdf: '논문 다운로드', contact: '연락(이메일)' };

// Collapse raw referrer hosts into meaningful buckets for a research lab.
function bucketReferrer(host: string): string {
    const h = (host || '').toLowerCase();
    if (/scholar\.google|\.edu|\.ac\.|ac\.kr|orcid|researchgate|semanticscholar|sciencedirect|springer|nature\.com|wiley|mdpi|ieee|arxiv|doi\.org|academia\.edu/.test(h)) return '학술·연구';
    if (/news|twitter|x\.com|reddit|facebook|linkedin|youtube|instagram|t\.co|threads|kakao/.test(h)) return '언론·SNS';
    return '검색·직접';
}

type VisitSource = 'all' | 'human' | 'vercel' | 'claude';

function classifyUA(ua: string): 'vercel' | 'claude' | 'human' {
    const lower = ua.toLowerCase();
    if (lower.includes('vercel') || lower.includes('next.js') || lower.includes('node-fetch') || lower.includes('undici')) return 'vercel';
    if (lower.includes('claude') || lower.includes('anthropic') || lower.includes('chatgpt') || lower.includes('openai') || lower.includes('gptbot')) return 'claude';
    if (lower.includes('bot') || lower.includes('crawler') || lower.includes('spider') || lower.includes('headless')) return 'claude';
    return 'human';
}

const SOURCE_META: Record<VisitSource, { label: string; dot: string }> = {
    all: { label: '전체', dot: '' },
    human: { label: '방문자', dot: INK },
    vercel: { label: '빌드', dot: '#A8A29E' },
    claude: { label: '봇/AI', dot: EMBER },
};

// Heuristic UA parse (UA strings are self-reported; treat as approximate).
// Token references: developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
function parseUA(ua: string): { device: string; os: string; browser: string } {
    const u = (ua || '').toLowerCase();
    let device = 'Desktop';
    if (/ipad|tablet|playbook|silk/.test(u) || (/android/.test(u) && !/mobile/.test(u))) device = 'Tablet';
    else if (/mobi|iphone|ipod|windows phone|iemobile/.test(u)) device = 'Mobile';

    let os = 'Other';
    if (/windows nt/.test(u)) os = 'Windows';
    else if (/iphone|ipad|ipod/.test(u)) os = 'iOS';
    else if (/mac os x|macintosh/.test(u)) os = 'macOS';
    else if (/android/.test(u)) os = 'Android';
    else if (/cros/.test(u)) os = 'ChromeOS';
    else if (/linux/.test(u)) os = 'Linux';

    let browser = 'Other';
    if (/edg\//.test(u)) browser = 'Edge';
    else if (/opr\/|opera/.test(u)) browser = 'Opera';
    else if (/samsungbrowser/.test(u)) browser = 'Samsung';
    else if (/firefox\/|fxios/.test(u)) browser = 'Firefox';
    else if (/chrome\/|crios/.test(u)) browser = 'Chrome';
    else if (/safari\//.test(u)) browser = 'Safari';
    else if (classifyUA(ua) !== 'human') browser = 'Bot';
    return { device, os, browser };
}

function tally<T>(items: T[], key: (t: T) => string | undefined): Array<{ label: string; value: number }> {
    const m: Record<string, number> = {};
    for (const it of items) {
        const k = key(it);
        if (!k) continue;
        m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

function EyeIcon({ off }: { off: boolean }) {
    return off ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function Stat({ label, value, sub, trend }: { label: string; value: React.ReactNode; sub?: string; trend?: number | null }) {
    return (
        <div className="rounded-xl border border-hairline bg-white p-5">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
                {trend != null && (
                    <span className="font-mono text-xs tabular-nums text-ink-3">
                        {trend >= 0 ? '▲' : '▼'} {Math.abs(Math.round(trend))}%
                    </span>
                )}
            </div>
            {sub && <p className="mt-0.5 text-xs text-ink-4">{sub}</p>}
        </div>
    );
}

function Panel({ title, sub, action, children, className = '' }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border border-hairline bg-white ${className}`}>
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold tracking-tight text-ink">{title}</h2>
                    {sub && <p className="mt-0.5 truncate font-mono text-[11px] tabular-nums text-ink-4">{sub}</p>}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// Horizontal distribution list — the workhorse for source/device/os/browser/geo.
function BarList({ items, total, max, empty = '데이터 없음' }: { items: Array<{ label: React.ReactNode; value: number; sub?: string; leading?: React.ReactNode }>; total: number; max?: number; empty?: string }) {
    if (!items.length) return <p className="py-6 text-center text-sm text-ink-4">{empty}</p>;
    const peak = max ?? Math.max(1, ...items.map(i => i.value));
    return (
        <div className="space-y-2.5">
            {items.map((it, i) => {
                const pct = total ? Math.round((it.value / total) * 100) : 0;
                return (
                    <div key={i}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                            <span className="flex min-w-0 items-center gap-2">
                                {it.leading}
                                <span className="truncate text-ink-2">{it.label}</span>
                                {it.sub && <span className="flex-shrink-0 text-ink-4">{it.sub}</span>}
                            </span>
                            <span className="flex-shrink-0 font-mono text-xs tabular-nums text-ink-3">
                                {it.value}<span className="ml-1.5 text-ink-4">{pct}%</span>
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-well">
                            <div className="h-full rounded-full bg-ink-3" style={{ width: `${(it.value / peak) * 100}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function AdminAnalytics() {
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [period, setPeriod] = useState(7);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [countryScope, setCountryScope] = useState<'period' | 'all'>('period');
    const [sourceFilter, setSourceFilter] = useState<VisitSource>('all');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);
    const regionRef = useRef<HTMLDivElement>(null);

    const fetchAnalytics = async (pwd: string, days: number = 7) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/analytics?period=${days}`, {
                headers: { 'x-admin-password': pwd },
            });
            if (response.status === 401) {
                setError('비밀번호가 올바르지 않습니다');
                setIsAuthenticated(false);
                return;
            }
            const result = await response.json();
            setData(result);
            setIsAuthenticated(true);
            setLastUpdated(new Date());
            localStorage.setItem('mftel_admin_pwd', pwd);
        } catch {
            setError('데이터를 불러오지 못했습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedPwd = localStorage.getItem('mftel_admin_pwd');
        if (storedPwd) {
            setPassword(storedPwd);
            fetchAnalytics(storedPwd, period);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAnalytics(password, period);
    };

    const handleLogout = () => {
        localStorage.removeItem('mftel_admin_pwd');
        setIsAuthenticated(false);
        setPassword('');
        setData(null);
    };

    const handlePeriodChange = (days: number) => {
        setPeriod(days);
        fetchAnalytics(password, days);
    };

    const handleCountryClick = (country: string) => {
        if (selectedCountry === country) {
            setSelectedCountry(null);
        } else {
            setSelectedCountry(country);
            setTimeout(() => regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    };

    // ── Derivations (respect the active source filter across every panel) ──────
    const allVisits = useMemo<Visit[]>(() => data?.recentVisits || [], [data]);
    const sourceCounts = useMemo(() => {
        const c = { human: 0, vercel: 0, claude: 0 };
        allVisits.forEach(v => { c[classifyUA(v.userAgent)]++; });
        return c;
    }, [allVisits]);

    const filteredVisits = useMemo(
        () => (sourceFilter === 'all' ? allVisits : allVisits.filter(v => classifyUA(v.userAgent) === sourceFilter)),
        [allVisits, sourceFilter]
    );

    const filteredDailyStats = useMemo(() => {
        const out: Record<string, number> = {};
        if (sourceFilter === 'all' && data?.dailyStats) {
            Object.assign(out, data.dailyStats);
        } else {
            filteredVisits.forEach(v => {
                const day = v.timestamp.split('T')[0];
                out[day] = (out[day] || 0) + 1;
            });
            if (data?.dailyStats) for (const d of Object.keys(data.dailyStats)) if (!(d in out)) out[d] = 0;
        }
        return out;
    }, [sourceFilter, data, filteredVisits]);

    const chartData = useMemo(() => {
        const du = data?.dailyUnique || {};
        return Object.entries(filteredDailyStats)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date: date.slice(5), visits: count, unique: sourceFilter === 'all' ? (du[date] ?? null) : null }));
    }, [filteredDailyStats, data, sourceFilter]);
    const avgDaily = chartData.length ? chartData.reduce((s, d) => s + d.visits, 0) / chartData.length : 0;
    const showUnique = sourceFilter === 'all' && chartData.some(d => d.unique != null);

    const parsed = useMemo(() => filteredVisits.map(v => ({ v, ...parseUA(v.userAgent) })), [filteredVisits]);
    const deviceDist = useMemo(() => tally(parsed, p => p.device), [parsed]);
    const osDist = useMemo(() => tally(parsed, p => p.os), [parsed]);
    const browserDist = useMemo(() => tally(parsed, p => p.browser), [parsed]);
    const referrerDist = useMemo(() => tally(filteredVisits, v => (v.referrer && v.referrer.trim()) ? v.referrer : 'Direct / 직접'), [filteredVisits]);
    const referrerBuckets = useMemo(() => {
        const m: Record<string, number> = {};
        referrerDist.forEach(r => { const b = bucketReferrer(String(r.label)); m[b] = (m[b] || 0) + r.value; });
        return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    }, [referrerDist]);
    const pathDist = useMemo(() => tally(filteredVisits, v => v.path || '/'), [filteredVisits]);
    const langDist = useMemo(() => tally(filteredVisits, v => v.language || undefined), [filteredVisits]);

    const hourDist = useMemo(() => {
        const arr = Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, '0'), value: 0 }));
        filteredVisits.forEach(v => { const h = new Date(v.timestamp).getHours(); if (!isNaN(h)) arr[h].value++; });
        return arr;
    }, [filteredVisits]);
    const weekdayDist = useMemo(() => {
        const arr = WEEKDAYS.map(label => ({ label, value: 0 }));
        filteredVisits.forEach(v => { const d = new Date(v.timestamp).getDay(); if (!isNaN(d)) arr[d].value++; });
        return arr;
    }, [filteredVisits]);
    const busiestHour = hourDist.reduce((best, cur, i) => (cur.value > hourDist[best].value ? i : best), 0);
    const busiestWeekday = weekdayDist.reduce((best, cur, i) => (cur.value > weekdayDist[best].value ? i : best), 0);

    const countrySource = countryScope === 'all' ? (data?.allCountries || {}) : (
        sourceFilter === 'all' && data?.countries ? data.countries : filteredVisits.reduce((m, v) => { if (v.country) m[v.country] = (m[v.country] || 0) + 1; return m; }, {} as Record<string, number>)
    );
    const sortedCountries = useMemo(() => Object.entries(countrySource).map(([label, value]) => ({ label, value: Number(value) })).sort((a, b) => b.value - a.value), [countrySource]);
    const cityDist = useMemo(() => tally(filteredVisits.filter(v => v.city && v.city !== 'Unknown'), v => `${v.city}|${v.country}`).map(c => { const [city, country] = c.label.split('|'); return { label: city, sub: country, value: c.value }; }), [filteredVisits]);
    const screenDist = useMemo(() => tally(filteredVisits, v => v.screen || undefined), [filteredVisits]);
    const pageViewsList = useMemo(() => Object.entries(data?.pageViews || {}).map(([label, value]) => ({ label, value: Number(value) })).sort((a, b) => b.value - a.value), [data]);
    const domesticCount = useMemo(() => filteredVisits.filter(v => v.country === 'KR').length, [filteredVisits]);

    // Weekday (0=일) × hour (0-23) heatmap matrix.
    const heat = useMemo(() => {
        const m = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
        filteredVisits.forEach(v => { const d = new Date(v.timestamp); const wd = d.getDay(); const h = d.getHours(); if (!isNaN(wd) && !isNaN(h)) m[wd][h]++; });
        let max = 0; m.forEach(r => r.forEach(c => { if (c > max) max = c; }));
        return { m, max };
    }, [filteredVisits]);

    const uniqueVisitors = useMemo(() => new Set(filteredVisits.map(v => v.ip)).size, [filteredVisits]);
    const uniquePeriodVal = data?.uniquePeriod ?? uniqueVisitors;
    const todayCount = filteredDailyStats[new Date().toISOString().split('T')[0]] || 0;
    const filteredPeriodTotal = sourceFilter === 'all' ? (data?.periodTotal || 0) : Object.values(filteredDailyStats).reduce((a, b) => a + b, 0);
    const trend = sourceFilter === 'all' && data?.prevPeriodTotal ? ((filteredPeriodTotal - data.prevPeriodTotal) / data.prevPeriodTotal) * 100 : null;
    const periodLabel = period === 1 ? '오늘' : `최근 ${period}일`;

    // Recruiting goals + join click-through rate.
    const goals = data?.goals || {};
    const joinPageViews = Number(data?.pageViews?.['/join'] || data?.pageViews?.['/en/join'] || 0);
    const joinCtr = joinPageViews > 0 && goals.join ? Math.round((goals.join.total / joinPageViews) * 100) : null;

    // One plain-language "so what" line (magnitude-based, min-N gated, no spurious causality).
    const summary = useMemo(() => {
        if (!data) return '';
        if (filteredPeriodTotal < 5) return `${periodLabel} 방문 ${filteredPeriodTotal}건 — 표본이 적어 아직 뚜렷한 추세는 없습니다.`;
        const parts: string[] = [];
        if (trend != null && Math.abs(trend) >= 10) parts.push(`방문 이전 대비 ${trend >= 0 ? '▲' : '▼'}${Math.abs(Math.round(trend))}%`);
        const eng = data.engagement;
        if (eng && eng.totalN >= 5) parts.push(`참여율 ${eng.rate}%`);
        if (referrerBuckets.length && referrerBuckets[0].value) parts.push(`유입 1위 ${referrerBuckets[0].label}`);
        const pd = Object.entries(data.pageDwell || {}).sort((a, b) => b[1] - a[1])[0];
        if (pd && pd[1] >= 30) parts.push(`가장 오래 본 페이지 ${pd[0]} (${fmtDur(pd[1])})`);
        if (data.goals?.join && data.goals.join.period > 0) parts.push(`지원 클릭 ${data.goals.join.period}건`);
        return `${periodLabel}: ${parts.length ? parts.join(' · ') : '큰 변화 없음'}.`;
    }, [data, filteredPeriodTotal, trend, referrerBuckets, periodLabel]);

    const searchedVisits = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return filteredVisits;
        return filteredVisits.filter(v => `${v.country} ${v.region} ${v.city} ${v.userAgent} ${v.path || ''} ${v.referrer || ''}`.toLowerCase().includes(q));
    }, [filteredVisits, search]);

    const exportCsv = () => {
        const cols = ['timestamp', 'source', 'device', 'os', 'browser', 'country', 'region', 'city', 'ip', 'referrer', 'path', 'language', 'screen', 'userAgent'];
        const esc = (s: string | number) => `"${String(s ?? '').replace(/"/g, '""')}"`;
        const rows = searchedVisits.map(v => {
            const u = parseUA(v.userAgent);
            return [v.timestamp, classifyUA(v.userAgent), u.device, u.os, u.browser, v.country, v.region, v.city, v.ip, v.referrer || '', v.path || '', v.language || '', v.screen || '', v.userAgent];
        });
        const csv = [cols.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mftel-visits-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Login ──────────────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-well px-6">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coal">
                            <span className="text-base font-bold text-paper">M</span>
                        </div>
                        <p className="mt-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ember-700">Admin Access</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">MFTEL Analytics</h1>
                        <p className="mt-2 text-sm text-ink-3">관리자 비밀번호를 입력하세요</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                autoFocus
                                autoComplete="current-password"
                                className="h-12 w-full rounded-lg border border-hairline bg-white pl-4 pr-12 text-sm text-ink transition-colors duration-150 placeholder:text-ink-4 focus:border-ink-4 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((v) => !v)}
                                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                                className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-md text-ink-4 transition-colors duration-150 hover:bg-well hover:text-ink-2"
                            >
                                <EyeIcon off={showPw} />
                            </button>
                        </div>
                        {error && (
                            <p className="flex items-center gap-1.5 text-xs text-ember-700">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="h-12 w-full rounded-lg bg-ember-700 text-sm font-medium text-white transition-colors duration-150 hover:bg-ember-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading ? '확인 중…' : '로그인'}
                        </button>
                    </form>
                    <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-4">MFTEL · Inha University</p>
                </div>
            </main>
        );
    }

    // ── Console ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-well text-ink">
            <header className="sticky top-0 z-10 border-b border-hairline bg-paper/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coal">
                            <span className="text-xs font-bold text-paper">M</span>
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-ink">MFTEL Analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden items-center gap-1 rounded-lg border border-hairline bg-white p-1 sm:inline-flex">
                            {[{ d: 1, l: '1D' }, { d: 7, l: '7D' }, { d: 30, l: '30D' }, { d: 90, l: '90D' }].map(({ d, l }) => (
                                <button
                                    key={d}
                                    onClick={() => handlePeriodChange(d)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums transition-colors duration-150 ${period === d ? 'bg-coal text-paper' : 'text-ink-3 hover:text-ink'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => fetchAnalytics(password, period)}
                            disabled={loading}
                            aria-label="새로고침"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-white text-ink-2 transition-colors duration-150 hover:bg-well hover:text-ink disabled:opacity-40"
                        >
                            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="h-9 rounded-lg border border-hairline bg-white px-3 text-sm text-ink-2 transition-colors duration-150 hover:bg-well hover:text-ink"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-8">
                {/* Title + period (mobile) + source filter */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-ink">접속자 통계</h1>
                        <p className="mt-1 font-mono text-[11px] tabular-nums text-ink-4">
                            {periodLabel}{lastUpdated && ` · 갱신 ${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white p-1 sm:hidden">
                            {[{ d: 1, l: '1D' }, { d: 7, l: '7D' }, { d: 30, l: '30D' }, { d: 90, l: '90D' }].map(({ d, l }) => (
                                <button key={d} onClick={() => handlePeriodChange(d)} className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums ${period === d ? 'bg-coal text-paper' : 'text-ink-3'}`}>{l}</button>
                            ))}
                        </div>
                        {(['all', 'human', 'vercel', 'claude'] as VisitSource[]).map(src => {
                            const count = src === 'all' ? allVisits.length : sourceCounts[src as keyof typeof sourceCounts];
                            const active = sourceFilter === src;
                            return (
                                <button
                                    key={src}
                                    onClick={() => setSourceFilter(src)}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${active ? 'border-transparent bg-coal text-paper' : 'border-hairline bg-white text-ink-2 hover:bg-well'}`}
                                >
                                    {SOURCE_META[src].dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? '#FAFAF9' : SOURCE_META[src].dot }} />}
                                    {SOURCE_META[src].label}
                                    <span className={`tabular-nums ${active ? 'text-paper/70' : 'text-ink-4'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Row 0 — the 5-second "so what" */}
                {summary && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-white px-4 py-3">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-sm leading-relaxed text-ink-2">{summary}</p>
                    </div>
                )}

                {/* KPI row — meaningful first */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                    <Stat label="순 방문자" value={uniquePeriodVal.toLocaleString()} sub={`페이지뷰 ${(data?.totalPageViews || 0).toLocaleString()}`} />
                    <Stat label="참여율" value={data?.engagement ? `${data.engagement.rate}%` : '—'} sub={data?.engagement ? `참여 ${data.engagement.engagedN}/${data.engagement.totalN} 세션` : undefined} />
                    <Stat label={`방문 · ${periodLabel}`} value={filteredPeriodTotal.toLocaleString()} trend={trend} sub={trend != null ? '이전 기간 대비' : undefined} />
                    <Stat label="평균 체류" value={fmtDur(data?.avgDwellSec || 0)} sub="페이지당" />
                    <Stat label="지원 클릭" value={(goals.join?.period ?? 0).toLocaleString()} trend={goals.join && goals.join.prev ? ((goals.join.period - goals.join.prev) / goals.join.prev) * 100 : null} sub={joinCtr != null ? `전환 ${joinCtr}%` : '모집 신호'} />
                    <Stat label="국가" value={sortedCountries.length} sub={countryScope === 'all' ? '누적' : periodLabel} />
                    <Stat label="오늘" value={todayCount.toLocaleString()} />
                </div>

                {/* Recruiting signals — the actions a PI cares about */}
                <Panel title="모집 신호" sub="지원자가 실제로 하는 행동">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {(['join', 'pdf', 'contact'] as const).map(g => {
                            const gd = goals[g];
                            const t = gd && gd.prev ? ((gd.period - gd.prev) / gd.prev) * 100 : null;
                            return (
                                <div key={g} className="rounded-lg border border-hairline bg-white p-4">
                                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{GOAL_LABELS[g]}</p>
                                    <div className="mt-1.5 flex items-baseline gap-2">
                                        <p className="text-2xl font-semibold tabular-nums text-ink">{(gd?.period ?? 0).toLocaleString()}</p>
                                        {t != null && <span className="font-mono text-xs tabular-nums text-ink-3">{t >= 0 ? '▲' : '▼'}{Math.abs(Math.round(t))}%</span>}
                                    </div>
                                    <p className="mt-0.5 text-xs text-ink-4">{periodLabel} · 누적 {(gd?.total ?? 0).toLocaleString()}</p>
                                </div>
                            );
                        })}
                        <div className="rounded-lg border border-hairline bg-well p-4">
                            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">지원 전환율</p>
                            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ember-600">{joinCtr != null ? `${joinCtr}%` : '—'}</p>
                            <p className="mt-0.5 text-xs text-ink-4">/join 방문 중 지원 클릭</p>
                        </div>
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-ink-4">클릭 이벤트만 집계 (개인정보·경로 기록 없음) · 오늘 배포분부터 누적</p>
                </Panel>

                {/* Main trend chart */}
                <Panel title="일자별 방문" sub={avgDaily ? `평균 ${avgDaily.toFixed(1)}/일${showUnique ? ' · 방문(면) vs 순방문자(점선)' : ''}` : undefined}>
                    <div className="h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="emberFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={EMBER} stopOpacity={0.22} />
                                            <stop offset="100%" stopColor={EMBER} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={{ stroke: GRID }} stroke={INK_3} minTickGap={16} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} stroke={INK_3} width={40} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: GRID }} />
                                    {avgDaily > 0 && <ReferenceLine y={avgDaily} stroke={INK_3} strokeDasharray="4 4" strokeOpacity={0.5} />}
                                    <Area type="monotone" dataKey="visits" stroke={EMBER} strokeWidth={2} fill="url(#emberFill)" dot={{ r: 2, fill: EMBER }} activeDot={{ r: 4 }} />
                                    {showUnique && <Area type="monotone" dataKey="unique" stroke={INK_3} strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} activeDot={{ r: 3 }} />}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-ink-4">데이터 없음</div>
                        )}
                    </div>
                    {chartData.length > 0 && (
                        <p className="mt-2 text-xs text-ink-4">
                            {periodLabel} 하루 평균 {avgDaily.toFixed(1)}명{trend != null ? ` · 이전 기간 대비 ${trend >= 0 ? '증가' : '감소'} ${Math.abs(Math.round(trend))}%` : ''}.
                        </p>
                    )}
                </Panel>

                {/* Composition: source / device / os / browser */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Panel title="유입 유형">
                        <BarList
                            total={filteredVisits.length}
                            items={(['human', 'vercel', 'claude'] as const).map(s => ({
                                label: SOURCE_META[s].label,
                                value: sourceFilter === 'all' ? sourceCounts[s] : (sourceFilter === s ? filteredVisits.length : 0),
                                leading: <span className="h-2 w-2 rounded-full" style={{ background: SOURCE_META[s].dot }} />,
                            })).filter(i => i.value > 0)}
                        />
                    </Panel>
                    <Panel title="기기"><BarList total={filteredVisits.length} items={deviceDist} /></Panel>
                    <Panel title="OS"><BarList total={filteredVisits.length} items={osDist} /></Panel>
                    <Panel title="브라우저"><BarList total={filteredVisits.length} items={browserDist} /></Panel>
                </div>

                {/* Time heatmap (weekday × hour) */}
                <Panel title="요일 × 시간대" sub={filteredVisits.length ? `가장 붐빔 · ${WEEKDAYS[busiestWeekday]}요일 ${String(busiestHour).padStart(2, '0')}시` : undefined}>
                    {filteredVisits.length ? (
                        <div className="overflow-x-auto">
                            <div className="min-w-[560px]">
                                {heat.m.map((row, wd) => (
                                    <div key={wd} className="flex items-center gap-1">
                                        <span className="w-5 flex-shrink-0 font-mono text-[10px] text-ink-4">{WEEKDAYS[wd]}</span>
                                        <div className="flex flex-1 gap-[3px] py-[2px]">
                                            {row.map((c, h) => (
                                                <div
                                                    key={h}
                                                    title={`${WEEKDAYS[wd]}요일 ${String(h).padStart(2, '0')}시 · ${c}`}
                                                    className="h-4 flex-1 rounded-[2px]"
                                                    style={{ background: c ? `rgba(28,25,23,${(0.12 + 0.88 * (c / heat.max)).toFixed(3)})` : '#F5F5F4' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-1.5 flex items-center gap-1">
                                    <span className="w-5 flex-shrink-0" />
                                    <div className="flex flex-1 gap-[3px]">
                                        {Array.from({ length: 24 }, (_, h) => (
                                            <span key={h} className="flex-1 text-center font-mono text-[9px] tabular-nums text-ink-4">{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : <p className="py-6 text-center text-sm text-ink-4">데이터 없음</p>}
                </Panel>

                {/* Geography */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Panel
                        title="국가"
                        action={
                            <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white p-0.5">
                                {(['period', 'all'] as const).map(sc => (
                                    <button key={sc} onClick={() => setCountryScope(sc)} className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${countryScope === sc ? 'bg-coal text-paper' : 'text-ink-3 hover:text-ink'}`}>
                                        {sc === 'period' ? periodLabel : '누적'}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
                            <BarList
                                total={sortedCountries.reduce((s, c) => s + c.value, 0)}
                                items={sortedCountries.slice(0, 12).map(c => ({
                                    label: (
                                        <button onClick={() => handleCountryClick(c.label)} className={`text-left hover:text-ember-700 ${selectedCountry === c.label ? 'font-medium text-ember-700' : ''}`}>
                                            {c.label}
                                        </button>
                                    ),
                                    value: c.value,
                                }))}
                            />
                        </div>
                    </Panel>
                    <Panel title="도시">
                        <div className="max-h-[320px] overflow-y-auto pr-1">
                            <BarList total={cityDist.reduce((s, c) => s + c.value, 0)} items={cityDist.slice(0, 12)} empty="도시 데이터 없음" />
                        </div>
                    </Panel>
                </div>

                {/* Referrer + landing page + top pages */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Panel title="유입 채널" sub="학술·연구 = 스콜라/논문/대학">
                        <BarList total={filteredVisits.length} items={referrerBuckets} empty="경로 데이터 없음" />
                        {referrerDist.length > 0 && (
                            <div className="mt-3 space-y-1 border-t border-hairline pt-3">
                                {referrerDist.slice(0, 5).map((r, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                        <span className="truncate text-ink-3">{r.label}</span>
                                        <span className="flex-shrink-0 font-mono tabular-nums text-ink-4">{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                    <Panel title="랜딩 페이지" sub="세션 첫 진입"><BarList total={filteredVisits.length} items={pathDist.slice(0, 8)} empty="페이지 데이터 없음" /></Panel>
                    <Panel title="인기 페이지" sub="조회수 · 평균 체류">
                        <BarList
                            total={pageViewsList.reduce((s, p) => s + p.value, 0)}
                            items={pageViewsList.slice(0, 8).map(p => ({ ...p, sub: data?.pageDwell?.[p.label] ? fmtDur(data.pageDwell[p.label]) : undefined }))}
                            empty="조회 데이터 없음"
                        />
                    </Panel>
                </div>

                {/* Language + resolution + domestic split */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Panel title="언어"><BarList total={filteredVisits.length} items={langDist.slice(0, 8)} empty="언어 데이터 없음" /></Panel>
                    <Panel title="화면 해상도"><BarList total={filteredVisits.length} items={screenDist.slice(0, 8)} empty="해상도 데이터 없음" /></Panel>
                    <Panel title="국내 / 해외">
                        <BarList
                            total={filteredVisits.length}
                            items={[
                                { label: '국내 (KR)', value: domesticCount, leading: <span className="h-2 w-2 rounded-full" style={{ background: INK }} /> },
                                { label: '해외', value: filteredVisits.length - domesticCount, leading: <span className="h-2 w-2 rounded-full" style={{ background: '#A8A29E' }} /> },
                            ].filter(i => i.value > 0)}
                            empty="데이터 없음"
                        />
                    </Panel>
                </div>

                {/* Region drill-down */}
                {selectedCountry && (
                    <div ref={regionRef}>
                        <Panel
                            title={`지역 · ${selectedCountry}`}
                            action={<button onClick={() => setSelectedCountry(null)} className="rounded-md px-2 py-1 text-sm text-ink-3 transition-colors hover:bg-well hover:text-ink">닫기</button>}
                        >
                            {(() => {
                                const inCountry = filteredVisits.filter(v => v.country === selectedCountry);
                                const regions = tally(inCountry, v => v.region || 'Unknown');
                                const cities = tally(inCountry, v => v.city || 'Unknown');
                                return (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">지역</p><BarList total={inCountry.length} items={regions.slice(0, 10)} empty="지역 데이터 없음" /></div>
                                        <div><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">도시</p><BarList total={inCountry.length} items={cities.slice(0, 10)} empty="도시 데이터 없음" /></div>
                                    </div>
                                );
                            })()}
                        </Panel>
                    </div>
                )}

                {/* Session journeys — which menus a visitor browsed, in order */}
                {data?.sessions && data.sessions.length > 0 && (
                    <Panel title="세션 여정" sub={`최근 ${data.sessions.length} 세션 · 방문자가 본 메뉴 순서`}>
                        <div className="max-h-[440px] space-y-0 overflow-y-auto">
                            {data.sessions.map((sess, i) => (
                                <div key={i} className="flex items-start justify-between gap-3 border-b border-hairline py-2.5 last:border-0">
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                        <span className="mr-1 flex-shrink-0 whitespace-nowrap text-xs">
                                            <span className="font-medium text-ink-2">{sess.country}</span>
                                            {sess.device && <span className="text-ink-4"> · {sess.device}</span>}
                                        </span>
                                        {sess.paths.slice(0, 10).map((p, j) => (
                                            <Fragment key={j}>
                                                {j > 0 && <span className="text-ink-4">›</span>}
                                                <span className="rounded border border-hairline bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{p}</span>
                                            </Fragment>
                                        ))}
                                        {sess.paths.length > 10 && <span className="text-ink-4">+{sess.paths.length - 10}</span>}
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-3 pt-0.5 font-mono text-[11px] tabular-nums text-ink-3">
                                        <span>{sess.paths.length}p</span>
                                        <span className="min-w-[56px] text-right">{fmtDur(Math.round(sess.ms / 1000))}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                )}

                {/* Full detail table */}
                <Panel
                    title="방문 상세"
                    sub={`${searchedVisits.length.toLocaleString()}건${search ? ` / ${filteredVisits.length.toLocaleString()}` : ''}`}
                    action={
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                </svg>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="국가·도시·UA·경로 검색"
                                    className="h-9 w-40 rounded-lg border border-hairline bg-white pl-8 pr-3 text-sm text-ink transition-colors placeholder:text-ink-4 focus:border-ink-4 focus:outline-none sm:w-52"
                                />
                            </div>
                            <button
                                onClick={exportCsv}
                                disabled={!searchedVisits.length}
                                title="CSV 내보내기"
                                className="flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 text-sm text-ink-2 transition-colors hover:bg-well hover:text-ink disabled:opacity-40"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                        </div>
                    }
                >
                    <div className="max-h-[560px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-[1] bg-white">
                                <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                                    <th className="py-2 pr-3 font-medium">시각</th>
                                    <th className="py-2 pr-3 font-medium">유형</th>
                                    <th className="py-2 pr-3 font-medium">기기</th>
                                    <th className="hidden py-2 pr-3 font-medium md:table-cell">브라우저</th>
                                    <th className="py-2 pr-3 font-medium">위치</th>
                                    <th className="hidden py-2 pr-3 font-medium lg:table-cell">유입</th>
                                    <th className="hidden py-2 font-medium lg:table-cell">페이지</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchedVisits.map((visit, i) => {
                                    const src = classifyUA(visit.userAgent);
                                    const ua = parseUA(visit.userAgent);
                                    const open = expanded === i;
                                    return (
                                        <Fragment key={i}>
                                            <tr
                                                onClick={() => setExpanded(open ? null : i)}
                                                className={`cursor-pointer border-b border-hairline transition-colors hover:bg-well ${open ? 'bg-well' : ''}`}
                                            >
                                                <td className="whitespace-nowrap py-2 pr-3 font-mono text-[12px] tabular-nums text-ink-3">
                                                    {new Date(visit.timestamp).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-2" title={visit.userAgent}>
                                                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: SOURCE_META[src].dot }} />
                                                        {SOURCE_META[src].label}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap py-2 pr-3 text-ink-2">{ua.device} · {ua.os}</td>
                                                <td className="hidden whitespace-nowrap py-2 pr-3 text-ink-2 md:table-cell">{ua.browser}</td>
                                                <td className="py-2 pr-3 text-ink-2">
                                                    <span className="font-medium">{visit.country}</span>
                                                    {visit.city !== 'Unknown' && <span className="text-ink-4"> · {visit.city}</span>}
                                                </td>
                                                <td className="hidden max-w-[140px] truncate py-2 pr-3 text-ink-3 lg:table-cell">{visit.referrer || '직접'}</td>
                                                <td className="hidden max-w-[120px] truncate py-2 font-mono text-[12px] text-ink-3 lg:table-cell">{visit.path || '/'}</td>
                                            </tr>
                                            {open && (
                                                <tr className="border-b border-hairline bg-well/60">
                                                    <td colSpan={7} className="px-3 py-3">
                                                        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3 lg:grid-cols-4">
                                                            {[
                                                                ['시각', new Date(visit.timestamp).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })],
                                                                ['국가 / 지역 / 도시', `${visit.country} · ${visit.region} · ${visit.city}`],
                                                                ['IP', visit.ip],
                                                                ['기기 / OS / 브라우저', `${ua.device} · ${ua.os} · ${ua.browser}`],
                                                                ['언어', visit.language || '—'],
                                                                ['화면', visit.screen || '—'],
                                                                ['유입 경로', visit.referrer || '직접'],
                                                                ['방문 페이지', visit.path || '/'],
                                                            ].map(([k, v]) => (
                                                                <div key={k}>
                                                                    <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">{k}</dt>
                                                                    <dd className="mt-0.5 break-words text-ink-2">{v}</dd>
                                                                </div>
                                                            ))}
                                                            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                                                                <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">User-Agent</dt>
                                                                <dd className="mt-0.5 break-all font-mono text-[11px] text-ink-3">{visit.userAgent}</dd>
                                                            </div>
                                                        </dl>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                                {searchedVisits.length === 0 && (
                                    <tr><td colSpan={7} className="py-10 text-center text-ink-4">{search ? '검색 결과 없음' : '기록 없음'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 font-mono text-[10px] text-ink-4">기기·OS·브라우저는 User-Agent 기반 추정값입니다 (근사).</p>
                </Panel>
            </div>
        </div>
    );
}
