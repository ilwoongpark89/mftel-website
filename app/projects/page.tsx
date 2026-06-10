import Navbar from "@/components/Navbar";
import Projects from "@/components/sections/Projects";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source Projects section (no duplicated content).
export default function ProjectsPage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Projects />
            </div>
            <Footer />
        </main>
    );
}
