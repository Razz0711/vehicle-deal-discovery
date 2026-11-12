import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

/** Plain page for account status messages (access refused, portal not open, signed-in details). */
export function StatusPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-lg px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
        <p className="eyebrow text-ember">{eyebrow}</p>
        <h1 className="display mt-4 text-4xl font-extrabold">{title}</h1>
        <div className="mt-6 flex flex-col gap-4 text-fog">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
