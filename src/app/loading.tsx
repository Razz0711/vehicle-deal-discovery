/** Shown while the next step loads. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" role="status" aria-label="Loading the next step">
      <div className="skeleton h-4 w-28 rounded bg-ink-2" />
      <div className="skeleton mt-4 h-12 w-2/3 max-w-lg rounded bg-ink-2" />
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="skeleton h-14 rounded border border-line bg-ink-2" />
        ))}
      </div>
    </div>
  );
}
