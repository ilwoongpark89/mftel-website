import Navbar from "@/components/Navbar";
import Team from "@/components/sections/Team";
import Footer from "@/components/sections/Footer";

// The PI profile lives inside the single-source Team section.
export default function ProfessorPage() {
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
