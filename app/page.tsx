import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HomeStory from "@/components/home/scenes";
import Analytics from "@/components/Analytics";

const Footer = dynamic(() => import("@/components/sections/Footer"));

/**
 * v3 DEEP FIELD — the home page is one immersive dark story (7 scenes).
 * Archives (publications/projects/team/news/gallery/lecture) live on routes.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-coal">
      <Analytics />
      <Navbar />
      <HomeStory />
      <Footer />
    </main>
  );
}
