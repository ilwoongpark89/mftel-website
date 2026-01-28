import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="format-detection" content="telephone=no" />
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
