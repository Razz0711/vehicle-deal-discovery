import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-soft text-ember">
        <Compass size={26} aria-hidden />
      </span>
      <p className="eyebrow mt-6 text-ember">Page not found</p>
      <h1 className="display mt-3 text-4xl font-extrabold sm:text-5xl">This road doesn’t go anywhere</h1>
      <p className="mt-4 text-lg text-fog">The page you asked for doesn’t exist or has moved. Start again from the first step.</p>
      <Link href="/" className="group mt-8 flex min-h-12 items-center gap-2 rounded-full bg-ember pl-6 pr-5 font-semibold text-void hover:bg-[#ff8a4a]">
        Choose a vehicle
        <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
      </Link>
    </main>
  );
}
