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
  openGraph: { title: SITE.name, description: SITE.description, type: "website", siteName: SITE.name },
  // Pre-launch: the deals shown are sample data, so keep the site out of
  // search results. Remove this line when real offers are connected.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0a0a0b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>
          <Backdrop />
          <Suspense fallback={null}>
            <TopBar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
