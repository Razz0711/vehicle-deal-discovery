"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-soft text-ember">
        <TriangleAlert size={26} aria-hidden />
      </span>
      <h1 className="display mt-6 text-4xl font-extrabold sm:text-5xl">Something went wrong</h1>
      <p className="mt-4 text-lg text-fog">This step couldn’t load. Your choices are saved in the address bar, so trying again won’t lose them.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className="flex min-h-12 items-center gap-2 rounded-full bg-ember px-6 font-semibold text-void hover:bg-[#ff8a4a]">
          <RotateCw size={18} aria-hidden />
          Try again
        </button>
        <Link href="/" className="flex min-h-12 items-center rounded-full px-6 font-medium text-fog ring-1 ring-hairline-strong hover:bg-white/5 hover:text-bright">
          Start over
        </Link>
      </div>
    </main>
  );
}
