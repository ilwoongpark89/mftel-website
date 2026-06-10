import Navbar from "@/components/Navbar";
import Research from "@/components/sections/Research";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source Research section (no duplicated content).
export default function ResearchPage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Research />
            </div>
            <Footer />
        </main>
    );
}
