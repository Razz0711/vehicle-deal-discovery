import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/** Shell for plain reading pages: About, Contact, Privacy, Terms. */
export function InfoPage({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
        <p className="eyebrow text-ember">{eyebrow}</p>
        <h1 className="display mt-4 text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {lead && <p className="mt-5 text-lg text-fog">{lead}</p>}
        <div className="prose-info mt-10 flex flex-col gap-8">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="display text-2xl font-bold">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-fog [&_a]:text-ember [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-bright">{children}</div>
    </section>
  );
}

export function DraftNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="note" className="rounded-2xl bg-ember-soft px-4 py-3.5 text-sm text-bright/90 ring-1 ring-ember/30">
      {children}
    </p>
  );
}
