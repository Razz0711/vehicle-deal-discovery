import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { ALL_REMOTE_PHOTOS, commonsPage } from "@/data/remotePhotos";

export const metadata: Metadata = { title: "Photo credits" };

/** Attribution for every third-party photograph, as its licence requires. */
export default function CreditsPage() {
  const photos = ALL_REMOTE_PHOTOS;
  return (
    <>
    <SiteNav />
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <p className="eyebrow text-ember">Attribution</p>
      <h1 className="display mt-4 text-4xl font-extrabold sm:text-5xl">Photo credits</h1>
      <p className="mt-5 text-lg text-fog">
        The vehicle photographs on this site come from Wikimedia Commons and are used under the Creative Commons licences listed below. They are shown cropped to fit, and in
        places darkened or desaturated. Each one illustrates a vehicle type or a named model, or sets the scene on the home page. None is a photograph of a vehicle offered for sale.
      </p>
      <ul className="mt-10 flex flex-col gap-3">
        {photos.map((p) => (
          <li key={p.title} className="surface rounded-2xl p-5">
            <p className="font-semibold">{p.shows}</p>
            <p className="mt-1 text-sm text-fog">
              Photograph by {p.author}, licensed under{" "}
              <a href={p.licenceUrl} className="text-ember underline-offset-4 hover:underline">
                {p.licence}
              </a>
              .
            </p>
            <a href={commonsPage(p)} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-fog hover:text-bright">
              Original on Wikimedia Commons
              <ExternalLink size={14} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <Link href="/" className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-medium text-fog ring-1 ring-hairline-strong hover:bg-white/5 hover:text-bright">
        <ArrowLeft size={18} aria-hidden />
        Back to the start
      </Link>
    </main>
    <SiteFooter />
    </>
  );
}
