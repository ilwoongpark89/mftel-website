import Navbar from "@/components/Navbar";
import Publications from "@/components/sections/Publications";
import Footer from "@/components/sections/Footer";
import { getCitations } from "@/lib/citations";

// Citation counts refresh daily via ISR — page stays static otherwise.
export const revalidate = 86400;

// Thin wrapper over the single-source Publications section (no duplicated content).
export default async function PublicationsPage() {
    const citations = await getCitations();
    return (
        <main className="min-h-screen bg-paper">
            <Navbar />
            <div className="pt-16">
                <Publications citations={citations} />
            </div>
            <Footer />
        </main>
    );
}
