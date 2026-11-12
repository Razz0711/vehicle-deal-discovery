import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { Backdrop } from "@/components/chrome/Backdrop";
import { TopBar } from "@/components/chrome/TopBar";
import { Providers } from "@/components/Providers";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: SITE.name, template: "%s · " + SITE.name },
  description: SITE.description,
};

export const viewport: Viewport = { themeColor: "#0a0a0b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>
          <Backdrop />
          <Suspense fallback={<div className="h-[104px]" />}>
            <TopBar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
