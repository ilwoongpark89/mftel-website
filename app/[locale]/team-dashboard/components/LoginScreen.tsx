"use client";

import { useState, memo } from "react";

const LoginScreen = memo(function LoginScreen({ onLogin, members }: { onLogin: (name: string, password: string, rememberMe: boolean) => Promise<string | null>; members: Record<string, { team: string; role: string; emoji: string }> }) {
    const [pw, setPw] = useState(""); const [name, setName] = useState(""); const [custom, setCustom] = useState(""); const [err, setErr] = useState("");
    const [remember, setRemember] = useState(false); const [loading, setLoading] = useState(false);
    const submit = async () => {
        const n = name === "__custom" ? custom.trim() : name;
        if (!n) { setErr("이름을 선택하세요"); return; }
        if (!pw) { setErr("비밀번호를 입력하세요"); return; }
        setLoading(true); setErr("");
        const error = await onLogin(n, pw, remember);
        if (error) { setErr(error); setLoading(false); }
    };
    const focusStyle = "w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none transition-all min-h-[48px]";
    const handleFocus = (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; };
    const handleBlur = (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; };
    return (
        <div className="min-h-screen flex items-center justify-center px-5" style={{background:"radial-gradient(ellipse at top, #1E293B, #0F172A)"}}>
            <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm" style={{boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>M</div>
                    <h1 className="text-xl font-bold text-slate-800">MFTEL Dashboard</h1>
                    <p className="text-[13px] text-slate-400 mt-1">Team members only</p>
                </div>
                <div className="space-y-3">
                    <div><label className="text-[13px] font-medium text-slate-600 block mb-1">이름</label><select value={name} onChange={e => { setName(e.target.value); setErr(""); }} className={`${focusStyle} bg-white`} onFocus={handleFocus} onBlur={handleBlur}><option value="">이름 선택...</option>{Object.keys(members).map(n => <option key={n} value={n}>{members[n]?.emoji || "👤"} {n}</option>)}<option value="__custom">직접 입력</option></select></div>
                    {name === "__custom" && <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="이름 입력" className={focusStyle} onFocus={handleFocus} onBlur={handleBlur} />}
                    <div><label className="text-[13px] font-medium text-slate-600 block mb-1">비밀번호</label><input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} placeholder="비밀번호 입력" className={focusStyle} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={e => e.key === "Enter" && !loading && submit()} /></div>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-blue-500" /><span className="text-[13px] text-slate-500">자동 로그인</span></label>
                    {err && <p className="text-[13px] text-red-500">{err}</p>}
                    <button onClick={submit} disabled={loading} className="w-full py-3 min-h-[48px] rounded-lg text-[14px] font-semibold text-white disabled:opacity-60 transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}>{loading ? "로그인 중..." : "입장"}</button>
                    <p className="text-[11px] text-center" style={{color:"#CBD5E1"}}>초기 비밀번호: 0000</p>
                </div>
            </div>
        </div>
    );
});

export { LoginScreen };
