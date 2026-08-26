import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JoinStory from "@/components/join/join-story";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
    title: "Join Us | MFTEL",
    description:
        "Openings for MS and PhD students, undergraduate researchers, and postdocs at MFTEL, Inha University. Applying starts with one email.",
};

export default function JoinPage() {
    return (
        <main className="min-h-screen bg-coal">
            <Navbar />
            <div className="pt-16">
                <JoinStory />
            </div>
            <Footer />
        </main>
    );
}
