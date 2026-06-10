import Navbar from "@/components/Navbar";
import Publications from "@/components/sections/Publications";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source Publications section (no duplicated content).
export default function PublicationsPage() {
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Publications />
            </div>
            <Footer />
        </main>
    );
}
