import Navbar from "@/components/Navbar";
import Team from "@/components/sections/Team";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source Team section (no duplicated content).
export default function TeamPage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Team />
            </div>
            <Footer />
        </main>
    );
}
