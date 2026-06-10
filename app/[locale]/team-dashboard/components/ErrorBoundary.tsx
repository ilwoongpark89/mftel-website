"use client";

import React from "react";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
    componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("ErrorBoundary caught:", error, info); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 text-center w-full" style={{ maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
                        <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: "#FEE2E2" }}>!</div>
                        <h2 className="text-[18px] font-bold text-slate-800 mb-2">오류가 발생했습니다</h2>
                        <p className="text-[13px] text-slate-400 mb-6">문제가 지속되면 캐시를 삭제하고 다시 시도해주세요.</p>
                        <div className="flex gap-3">
                            <button onClick={() => { try { localStorage.removeItem('mftel-dc'); } catch {} window.location.reload(); }}
                                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">캐시 삭제 + 새로고침</button>
                            <button onClick={() => window.location.reload()}
                                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-white transition-colors" style={{ background: "#3b82f6" }}>새로고침</button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
