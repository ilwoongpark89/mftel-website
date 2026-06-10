import Navbar from "@/components/Navbar";
import News from "@/components/sections/News";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source News section (no duplicated content).
export default function NewsPage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <News />
            </div>
            <Footer />
        </main>
    );
}
