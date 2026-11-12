/** Shown while the next step loads. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-16" role="status" aria-label="Loading the next step">
      <div className="relative h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
        <div className="loadbar absolute inset-y-0 left-0 w-2/5 rounded-full bg-ember shadow-[0_0_12px_rgb(242_118_50/0.7)]" />
      </div>
      <div className="skeleton mt-6 h-14 w-3/4 max-w-xl rounded-2xl bg-white/[0.06]" />
      <div className="skeleton mt-4 h-5 w-1/2 max-w-sm rounded-full bg-white/[0.05]" />
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="skeleton h-16 rounded-2xl bg-white/[0.04]" style={{ animationDelay: i * 80 + "ms" }} />
        ))}
      </div>
    </div>
  );
}
