import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PhilosophyStory from "@/components/join/philosophy-story";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
    title: "우리가 믿는 것 | MFTEL",
    description: "MFTEL Common Vision — 정답 추구가 아닌, 실패와 몰입.",
};

export default function PhilosophyPage() {
    return (
        <main className="min-h-screen bg-coal">
            <Navbar />
            <div className="pt-16">
                <PhilosophyStory />
            </div>
            <Footer />
        </main>
    );
}
