import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Privacy from "@/components/privacy/Privacy";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
    title: "개인정보 처리방침 | MFTEL",
    description: "mftel.vercel.app(홈페이지 · 강의 자료 · 수업 게시판)과 광고(구글 애드센스)의 개인정보 처리방침.",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Privacy />
            </div>
            <Footer />
        </main>
    );
}
