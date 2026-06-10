import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Analytics from "@/components/Analytics";

const Research = dynamic(() => import("@/components/sections/Research"));
const Publications = dynamic(() => import("@/components/sections/Publications"));
const Projects = dynamic(() => import("@/components/sections/Projects"));
const Team = dynamic(() => import("@/components/sections/Team"));
const News = dynamic(() => import("@/components/sections/News"));
const Gallery = dynamic(() => import("@/components/sections/Gallery"));
const Lecture = dynamic(() => import("@/components/sections/Lecture"));
const Contact = dynamic(() => import("@/components/sections/Contact"));
const Footer = dynamic(() => import("@/components/sections/Footer"));

/**
 * CALORIMETER section order — evidence-first recruiting arc:
 * what we study (About → Research) → proof (Publications → Projects/IP)
 * → who we are (Team → News → Gallery) → teach (Lecture)
 * → convert (Join Us right above Footer contact).
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <Analytics />
      <Navbar />
      <Hero />
      <About />
      <Research />
      <Publications />
      <Projects />
      <Team />
      <News />
      <Gallery />
      <Lecture />
      <Contact />
      <Footer />
    </main>
  );
}
