"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface AnalyticsData {
    totalVisits: number;
    periodTotal: number;
    countries: Record<string, number>;
    allCountries: Record<string, number>;
    recentVisits: Array<{
        ip: string;
        country: string;
        city: string;
        region: string;
        timestamp: string;
        userAgent: string;
    }>;
    dailyStats: Record<string, number>;
    period: number;
}

interface Message {
    id: string;
    name: string;
    email: string;
    message: string;
    timestamp: string;
    read: boolean;
}

interface MessagesData {
    messages: Message[];
    totalMessages: number;
    unreadMessages: number;
}

const COLORS = ['#e11d48', '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#4f46e5', '#0891b2'];

type VisitSource = 'all' | 'human' | 'vercel' | 'claude';

function classifyUA(ua: string): 'vercel' | 'claude' | 'human' {
    const lower = ua.toLowerCase();
    if (lower.includes('vercel') || lower.includes('next.js') || lower.includes('node-fetch') || lower.includes('undici')) return 'vercel';
    if (lower.includes('claude') || lower.includes('anthropic') || lower.includes('chatgpt') || lower.includes('openai') || lower.includes('gptbot')) return 'claude';
    if (lower.includes('bot') || lower.includes('crawler') || lower.includes('spider') || lower.includes('headless')) return 'claude';
    return 'human';
}

const SOURCE_LABELS: Record<VisitSource, string> = { all: 'All', human: 'Visitors', vercel: 'Vercel / Build', claude: 'Bot / AI' };
const SOURCE_COLORS: Record<VisitSource, string> = { all: 'slate', human: 'emerald', vercel: 'indigo', claude: 'amber' };

export default function AdminDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [messagesData, setMessagesData] = useState<MessagesData | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState(7);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'analytics' | 'messages'>('analytics');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [sourceFilter, setSourceFilter] = useState<VisitSource>('all');
    const regionRef = useRef<HTMLDivElement>(null);

    const handleCountryClick = (country: string) => {
        if (selectedCountry === country) {
            setSelectedCountry(null);
        } else {
            setSelectedCountry(country);
            setTimeout(() => {
                regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    const fetchAnalytics = async (pwd: string, days: number = 7) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/analytics?period=${days}`, {
                headers: {
                    'x-admin-password': pwd
                }
            });

            if (response.status === 401) {
                setError('Invalid password');
                setIsAuthenticated(false);
                return;
            }

            const result = await response.json();
            setData(result);
            setIsAuthenticated(true);
            localStorage.setItem('mftel_admin_pwd', pwd);
        } catch {
            setError('Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (pwd: string) => {
        try {
            const response = await fetch('/api/messages', {
                headers: {
                    'x-admin-password': pwd
                }
            });

            if (response.status === 401) {
                return;
            }

            const result = await response.json();
            setMessagesData(result);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const markAsRead = async (messageId: string) => {
        try {
            await fetch('/api/messages', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password
                },
                body: JSON.stringify({ messageId })
            });

            // 메시지 목록 새로고침
            fetchMessages(password);
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    useEffect(() => {
        const storedPwd = localStorage.getItem('mftel_admin_pwd');
        if (storedPwd) {
            setPassword(storedPwd);
            fetchAnalytics(storedPwd, period);
            fetchMessages(storedPwd);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && activeTab === 'messages') {
            fetchMessages(password);
        }
    }, [activeTab, isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAnalytics(password, period);
        fetchMessages(password);
    };

    const handleLogout = () => {
        localStorage.removeItem('mftel_admin_pwd');
        setIsAuthenticated(false);
        setPassword('');
        setData(null);
        setMessagesData(null);
    };

    const handlePeriodChange = (days: number) => {
        setPeriod(days);
        fetchAnalytics(password, days);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">MFTEL Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Loading...' : 'Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Classify & filter visits by source
    const allVisits = data?.recentVisits || [];
    const filteredVisits = sourceFilter === 'all' ? allVisits : allVisits.filter(v => classifyUA(v.userAgent) === sourceFilter);

    // Source counts for badges
    const sourceCounts = { human: 0, vercel: 0, claude: 0 };
    allVisits.forEach(v => { sourceCounts[classifyUA(v.userAgent)]++; });

    // Build daily stats from filtered visits
    const filteredDailyStats: Record<string, number> = {};
    if (sourceFilter === 'all' && data?.dailyStats) {
        Object.assign(filteredDailyStats, data.dailyStats);
    } else {
        filteredVisits.forEach(v => {
            const day = v.timestamp.split('T')[0];
            filteredDailyStats[day] = (filteredDailyStats[day] || 0) + 1;
        });
        // Ensure all days in period are present
        if (data?.dailyStats) {
            for (const d of Object.keys(data.dailyStats)) {
                if (!(d in filteredDailyStats)) filteredDailyStats[d] = 0;
            }
        }
    }

    // Build country stats from filtered visits
    const filteredCountries: Record<string, number> = {};
    if (sourceFilter === 'all' && data?.countries) {
        Object.assign(filteredCountries, data.countries);
    } else {
        filteredVisits.forEach(v => {
            if (v.country) filteredCountries[v.country] = (filteredCountries[v.country] || 0) + 1;
        });
    }

    // Prepare chart data
    const chartData = Object.entries(filteredDailyStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({
            date: date.slice(5),
            visits: count
        }));

    const countryData = Object.entries(filteredCountries)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 8)
        .map(([country, count]) => ({
            name: country,
            value: Number(count)
        }));

    const sortedCountries = Object.entries(filteredCountries)
        .sort((a, b) => Number(b[1]) - Number(a[1]));

    const filteredPeriodTotal = sourceFilter === 'all'
        ? (data?.periodTotal || 0)
        : Object.values(filteredDailyStats).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* 상단 탭 메뉴 */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                    activeTab === 'analytics'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Analytics
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('messages')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all relative ${
                                    activeTab === 'messages'
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Messages
                                    {messagesData && messagesData.unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {messagesData.unreadMessages}
                                        </span>
                                    )}
                                </span>
                            </button>
                        </div>
                        <Button onClick={handleLogout} variant="outline" size="sm">
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        onClick={() => handlePeriodChange(1)}
                                        variant={period === 1 ? "default" : "outline"}
                                        size="sm"
                                    >
                                        1 Day
                                    </Button>
                                    <Button
                                        onClick={() => handlePeriodChange(7)}
                                        variant={period === 7 ? "default" : "outline"}
                                        size="sm"
                                    >
                                        7 Days
                                    </Button>
                                    <Button
                                        onClick={() => handlePeriodChange(30)}
                                        variant={period === 30 ? "default" : "outline"}
                                        size="sm"
                                    >
                                        30 Days
                                    </Button>
                                    <Button onClick={() => fetchAnalytics(password, period)} variant="outline" size="sm">
                                        Refresh
                                    </Button>
                                </div>
                            </div>

                            {/* Source Filter */}
                            <div className="flex gap-2 mb-8 flex-wrap">
                                {(['all', 'human', 'vercel', 'claude'] as VisitSource[]).map(src => {
                                    const count = src === 'all' ? allVisits.length : sourceCounts[src as keyof typeof sourceCounts];
                                    const active = sourceFilter === src;
                                    const colorMap: Record<string, string> = {
                                        all: active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
                                        human: active ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50',
                                        vercel: active ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50',
                                        claude: active ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50',
                                    };
                                    const icons: Record<string, string> = { all: '', human: '👤 ', vercel: '▲ ', claude: '🤖 ' };
                                    return (
                                        <button
                                            key={src}
                                            onClick={() => setSourceFilter(src)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${colorMap[src]}`}
                                        >
                                            {icons[src]}{SOURCE_LABELS[src]}
                                            <span className={`ml-2 text-xs ${active ? 'opacity-80' : 'opacity-60'}`}>({count})</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Summary Cards */}
                            <div className="grid md:grid-cols-4 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Total Visits (All Time)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-rose-600">{data?.totalVisits || 0}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">
                                            {SOURCE_LABELS[sourceFilter]} ({period === 1 ? 'Today' : `Last ${period} Days`})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-indigo-600">{filteredPeriodTotal}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Countries</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-emerald-600">{sortedCountries.length}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Today</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-amber-600">
                                            {filteredDailyStats[new Date().toISOString().split('T')[0]] || 0}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts */}
                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Daily Visitors</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            {chartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="date"
                                                            fontSize={12}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            fontSize={12}
                                                            tickLine={false}
                                                            allowDecimals={false}
                                                        />
                                                        <Tooltip />
                                                        <Bar
                                                            dataKey="visits"
                                                            fill="#e11d48"
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400">
                                                    No data available
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Visitors by Country</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            {countryData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={countryData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                            outerRadius={100}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {countryData.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400">
                                                    No data available
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Country List & Recent Visits */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Visitors by Country ({period === 1 ? 'Today' : `Last ${period} Days`})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {sortedCountries.map(([country, count]) => (
                                                <div
                                                    key={country}
                                                    className={`flex justify-between items-center py-2 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors rounded px-2 -mx-2 ${selectedCountry === country ? 'bg-rose-50' : ''}`}
                                                    onClick={() => handleCountryClick(country)}
                                                >
                                                    <span className={`${selectedCountry === country ? 'text-rose-600 font-medium' : 'text-gray-600'}`}>{country}</span>
                                                    <span className="font-semibold bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                            {sortedCountries.length === 0 && (
                                                <p className="text-gray-400 text-center py-4">No data yet</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Visits ({period === 1 ? 'Today' : `Last ${period} Days`})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-white">
                                                    <tr className="border-b">
                                                        <th className="text-left py-2 px-2">Time</th>
                                                        <th className="text-left py-2 px-2">Source</th>
                                                        <th className="text-left py-2 px-2">Location</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredVisits.map((visit, i) => {
                                                        const src = classifyUA(visit.userAgent);
                                                        const badgeStyle: Record<string, string> = {
                                                            human: 'bg-emerald-100 text-emerald-700',
                                                            vercel: 'bg-indigo-100 text-indigo-700',
                                                            claude: 'bg-amber-100 text-amber-700',
                                                        };
                                                        const badgeLabel: Record<string, string> = { human: '👤', vercel: '▲', claude: '🤖' };
                                                        return (
                                                        <tr key={i} className="border-b hover:bg-gray-50">
                                                            <td className="py-2 px-2 text-gray-600 whitespace-nowrap">
                                                                {new Date(visit.timestamp).toLocaleString('ko-KR', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyle[src]}`} title={visit.userAgent}>
                                                                    {badgeLabel[src]}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <span className="font-medium">{visit.country}</span>
                                                                <span className="text-gray-400 ml-1">
                                                                    {visit.city !== 'Unknown' && `, ${visit.city}`}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                    })}
                                                    {filteredVisits.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="py-4 text-center text-gray-400">
                                                                No visits recorded yet
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Region Breakdown (when country selected) */}
                            {selectedCountry && (
                                <div ref={regionRef} className="mt-8">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>Visitors by Region - {selectedCountry}</CardTitle>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedCountry(null)}
                                            >
                                                Close
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {/* Region/City List */}
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {(() => {
                                                        const regionCounts: Record<string, { count: number; cities: Record<string, number> }> = {};
                                                        filteredVisits
                                                            .filter(v => v.country === selectedCountry)
                                                            .forEach(visit => {
                                                                const region = visit.region || 'Unknown';
                                                                const city = visit.city || 'Unknown';
                                                                if (!regionCounts[region]) {
                                                                    regionCounts[region] = { count: 0, cities: {} };
                                                                }
                                                                regionCounts[region].count++;
                                                                regionCounts[region].cities[city] = (regionCounts[region].cities[city] || 0) + 1;
                                                            });

                                                        const sortedRegions = Object.entries(regionCounts)
                                                            .sort((a, b) => b[1].count - a[1].count);

                                                        if (sortedRegions.length === 0) {
                                                            return <p className="text-gray-400 text-center py-4">No region data available</p>;
                                                        }

                                                        return sortedRegions.map(([region, regionData]) => (
                                                            <div key={region} className="border-b last:border-0 pb-2">
                                                                <div className="flex justify-between items-center py-1">
                                                                    <span className="font-medium text-gray-700">{region}</span>
                                                                    <span className="font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                                                                        {regionData.count}
                                                                    </span>
                                                                </div>
                                                                <div className="pl-4 space-y-1">
                                                                    {Object.entries(regionData.cities)
                                                                        .sort((a, b) => b[1] - a[1])
                                                                        .map(([city, count]) => (
                                                                            <div key={city} className="flex justify-between items-center text-sm">
                                                                                <span className="text-gray-500">{city}</span>
                                                                                <span className="text-gray-400">{count}</span>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>

                                                {/* Region Pie Chart */}
                                                <div className="h-[250px]">
                                                    {(() => {
                                                        const regionCounts: Record<string, number> = {};
                                                        filteredVisits
                                                            .filter(v => v.country === selectedCountry)
                                                            .forEach(visit => {
                                                                const region = visit.region || 'Unknown';
                                                                regionCounts[region] = (regionCounts[region] || 0) + 1;
                                                            });

                                                        const regionData = Object.entries(regionCounts)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .slice(0, 8)
                                                            .map(([name, value]) => ({ name, value }));

                                                        if (regionData.length === 0) {
                                                            return (
                                                                <div className="h-full flex items-center justify-center text-gray-400">
                                                                    No data available
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={regionData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                                        outerRadius={80}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                    >
                                                                        {regionData.map((_, index) => (
                                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}

                    {/* Messages Tab */}
                    {activeTab === 'messages' && (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                                <Button onClick={() => fetchMessages(password)} variant="outline" size="sm">
                                    Refresh
                                </Button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Total Messages</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-slate-700">{messagesData?.totalMessages || 0}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Unread</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-rose-600">{messagesData?.unreadMessages || 0}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Read</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold text-emerald-600">
                                            {(messagesData?.totalMessages || 0) - (messagesData?.unreadMessages || 0)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Messages List & Detail */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>All Messages</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                            {messagesData?.messages?.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    onClick={() => {
                                                        setSelectedMessage(msg);
                                                        if (!msg.read) {
                                                            markAsRead(msg.id);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-lg cursor-pointer transition-all border ${
                                                        selectedMessage?.id === msg.id
                                                            ? 'bg-slate-100 border-slate-300'
                                                            : msg.read
                                                            ? 'bg-white border-slate-200 hover:bg-slate-50'
                                                            : 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                {!msg.read && (
                                                                    <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0"></span>
                                                                )}
                                                                <p className="font-medium text-slate-900 truncate">{msg.name}</p>
                                                            </div>
                                                            <p className="text-sm text-slate-500 truncate">{msg.email}</p>
                                                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{msg.message}</p>
                                                        </div>
                                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                                            {new Date(msg.timestamp).toLocaleString('ko-KR', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!messagesData?.messages || messagesData.messages.length === 0) && (
                                                <div className="text-center py-12 text-slate-400">
                                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <p>No messages yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Message Detail</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedMessage ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                        {selectedMessage.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{selectedMessage.name}</p>
                                                        <a href={`mailto:${selectedMessage.email}`} className="text-sm text-slate-500 hover:text-slate-700">
                                                            {selectedMessage.email}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 mb-2">
                                                        {new Date(selectedMessage.timestamp).toLocaleString('ko-KR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                                                </div>
                                                <div className="pt-4 border-t border-slate-200">
                                                    <a
                                                        href={`mailto:${selectedMessage.email}?subject=Re: MFTEL 문의&body=%0A%0A---%0A원본 메시지:%0A${encodeURIComponent(selectedMessage.message)}`}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        Reply via Email
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-400">
                                                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                                </svg>
                                                <p>Select a message to view details</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
