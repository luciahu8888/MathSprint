import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const headingFont = Baloo_2({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MathQuest",
  description: "Kid-friendly daily multiplication fluency practice with streaks and parent insights.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MathQuest",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full app-background">
        <ServiceWorkerRegistration />
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-20">
          <header className="sticky top-0 z-20 border-b border-sky-200/80 bg-white/90 px-4 py-3 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Daily Math Adventure</p>
            <h1 className="text-2xl font-black text-sky-900">MathQuest</h1>
          </header>
          <div className="flex-1">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
