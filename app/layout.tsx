import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Schibsted_Grotesk, DM_Sans } from "next/font/google";
import { Sidebar } from "@/components/shared/Sidebar";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { PomodoroSetup } from "@/components/shared/pomodoro/PomodoroSetup";
import { GlobalSearchModal } from "@/components/shared/GlobalSearchModal";
import { createClient } from "@/lib/supabase/server";
import { getSidebarData } from "@/lib/personal/sidebar-queries";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const displayName = data.user ? (data.user.user_metadata?.name as string | undefined) ?? "Alex" : null;

  const sidebarData = data.user
    ? await getSidebarData().catch(() => ({ sections: [], subsections: [], items: [] }))
    : { sections: [], subsections: [], items: [] };

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
        <AuthProvider>
          <PomodoroSetup>
            <ServiceWorkerRegister />
            <Sidebar name={displayName} email={data.user?.email ?? null} sidebarData={sidebarData} />
            <main className="flex-1 overflow-y-auto">{children}</main>
            {data.user && <GlobalSearchModal />}
          </PomodoroSetup>
        </AuthProvider>
      </body>
    </html>
  );
}
