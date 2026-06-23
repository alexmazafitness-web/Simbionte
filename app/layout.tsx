import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Schibsted_Grotesk, DM_Sans } from "next/font/google";
import { Sidebar } from "@/components/shared/Sidebar";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simbionte",
  description: "Sistema operativo personal de Alex Maza",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-512.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      style={{ colorScheme: "dark" }}
      className={`${bebasNeue.variable} ${schibstedGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body
        style={{ colorScheme: "dark" }}
        className="flex h-full min-h-screen bg-[#141414] text-neutral-100"
      >
        <ServiceWorkerRegister />
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
