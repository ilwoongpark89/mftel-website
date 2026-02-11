import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
const ChatWidget = dynamic(() => import("@/components/ChatWidget"));
import { LanguageProvider } from "@/lib/LanguageContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MFTEL | Inha University",
  description: "Multiphase Flow and Thermal Engineering Laboratory at Inha University. Advancing thermal science through thermal energy storage, electronics cooling, and reactor safety research.",
  metadataBase: new URL('https://mftel.vercel.app'),
  keywords: [
    "MFTEL", "Inha University", "multiphase flow", "thermal engineering",
    "boiling heat transfer", "immersion cooling", "thermal energy storage",
    "Carnot battery", "SMR", "small modular reactor", "condensation",
    "two-phase flow", "Il Woong Park", "인하대학교", "다상유동열공학연구실",
  ],
  authors: [{ name: "Il Woong Park", url: "https://mftel.vercel.app" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://mftel.vercel.app",
  },
  openGraph: {
    title: "MFTEL - Engineering a Sustainable Energy Future",
    description: "Multiphase Flow and Thermal Engineering Laboratory at Inha University. Advancing thermal science through thermal energy storage, electronics cooling, and reactor safety research.",
    url: 'https://mftel.vercel.app',
    siteName: 'MFTEL',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MFTEL - Engineering a Sustainable Energy Future",
    description: "Multiphase Flow and Thermal Engineering Laboratory at Inha University.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ResearchOrganization",
  name: "MFTEL - Multiphase Flow and Thermal Engineering Laboratory",
  alternateName: "다상유동열공학연구실",
  url: "https://mftel.vercel.app",
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Inha University",
    alternateName: "인하대학교",
    url: "https://www.inha.ac.kr",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "100 Inha-ro, Michuhol-gu, Room 2N687",
    addressLocality: "Incheon",
    postalCode: "22212",
    addressCountry: "KR",
  },
  telephone: "+82-32-860-7335",
  email: "ilwoongpark@inha.ac.kr",
  foundingDate: "2022",
  member: {
    "@type": "Person",
    name: "Il Woong Park",
    jobTitle: "Assistant Professor",
    affiliation: "Inha University",
  },
  knowsAbout: [
    "Thermal Energy Storage",
    "Immersion Cooling",
    "Small Modular Reactors",
    "Boiling Heat Transfer",
    "Multiphase Flow",
    "Condensation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preload" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link rel="stylesheet" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased selection:bg-rose-500/20 selection:text-rose-600`}
      >
        <LanguageProvider>
          {children}
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
