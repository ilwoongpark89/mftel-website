import Navbar from "@/components/Navbar";
import Gallery from "@/components/sections/Gallery";
import Footer from "@/components/sections/Footer";

// Thin wrapper over the single-source Gallery section (no duplicated content).
export default function GalleryPage() {
    return (
        <main className="min-h-screen bg-coal">
            <Navbar />
            <div className="pt-16">
                <Gallery />
            </div>
            <Footer />
        </main>
    );
}
