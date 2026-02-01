"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Analytics from "@/components/Analytics";
import About from "@/components/sections/About";
import News from "@/components/sections/News";
import Team from "@/components/sections/Team";
import Research from "@/components/sections/Research";
import Publications from "@/components/sections/Publications";
import Projects from "@/components/sections/Projects";
import Gallery from "@/components/sections/Gallery";
import Lecture from "@/components/sections/Lecture";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

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
