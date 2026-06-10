import Navbar from "@/components/Navbar";
import Lecture from "@/components/sections/Lecture";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source Lecture section (no duplicated content).
export default function LecturePage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Lecture />
            </div>
            <Footer />
        </main>
    );
}
