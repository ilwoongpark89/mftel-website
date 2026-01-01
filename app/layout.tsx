import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MFTEL - Multiphase Flow and Thermal Engineering Laboratory",
  description: "Inha University Multiphase Flow and Thermal Engineering Laboratory - Engineering a safer, more efficient, and sustainable energy future",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
