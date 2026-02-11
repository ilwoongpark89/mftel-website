import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import News from "@/components/sections/News";
import Analytics from "@/components/Analytics";

const Team = dynamic(() => import("@/components/sections/Team"));
const Contact = dynamic(() => import("@/components/sections/Contact"));
const Research = dynamic(() => import("@/components/sections/Research"));
const Publications = dynamic(() => import("@/components/sections/Publications"));
const Projects = dynamic(() => import("@/components/sections/Projects"));
const Gallery = dynamic(() => import("@/components/sections/Gallery"));
const Lecture = dynamic(() => import("@/components/sections/Lecture"));
const Footer = dynamic(() => import("@/components/sections/Footer"));

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Analytics />
      <Navbar />
      <Hero />
      <About />
      <News />
      <Team />
      <Contact />
      <Research />
      <Publications />
      <Projects />
      <Gallery />
      <Lecture />
      <Footer />
    </main>
  );
}
