"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, BadgeIndianRupee, ChevronDown, FileText, FlaskConical, Info, MapPin, Scale, SearchX, X } from "lucide-react";
import type { Deal, SellerType } from "@/data/sampleDeals";
import { formatINR } from "@/lib/slug";
import { VehiclePhoto, hasModelPhoto } from "../vehicles/VehiclePhoto";

type Vehicle = { title: string; variant: string; place: string; modelKey: string; condition: "new" | "used" };

const MAX_COMPARE = 3;
const EASE = [0.2, 0.7, 0.2, 1] as const;
const total = (d: Deal) => d.onRoad ?? d.price;
const signed = (n: number) => (n < 0 ? "− " + formatINR(-n) : formatINR(n));

/**
 * How a price is evidenced. Sample listings only ever show "Sample". The
 * other two labels exist for real offers and are never simulated.
 */
const BASIS = {
  sample: { label: "Sample price", Icon: FlaskConical, tone: "bg-white/[0.06] text-fog", meaning: "Made-up figure for layout only. Not an offer." },
  estimated: { label: "Estimated", Icon: BadgeIndianRupee, tone: "bg-white/[0.06] text-fog", meaning: "Worked out from published prices and charges. A guide, not a quote." },
  "seller-submitted": { label: "Seller-submitted", Icon: FileText, tone: "bg-white/[0.06] text-bright", meaning: "Quoted by the seller. Not yet checked by us." },
  verified: { label: "Verified price", Icon: BadgeCheck, tone: "bg-verify/10 text-verify", meaning: "Backed by an invoice or booking record we have checked." },
} as const;

function Basis({ basis }: { basis: Deal["basis"] }) {
  const { label, Icon, tone } = BASIS[basis];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "ember" }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${tone === "ember" ? "bg-ember text-void" : "bg-void/65 text-fog backdrop-blur"}`}>
      {children}
    </span>
  );
}

function Breakdown({ deal }: { deal: Deal }) {
  return (
    <dl className="tnum text-sm">
      {deal.breakdown.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 border-t border-hairline py-2.5">
          <dt className="text-fog">{row.label}</dt>
          <dd className={row.amount < 0 ? "text-ember" : ""}>{signed(row.amount)}</dd>
        </div>
      ))}
      {deal.onRoad !== undefined && (
        <div className="flex justify-between gap-4 border-t border-hairline-strong pt-3 text-base font-semibold">
          <dt>On-road price</dt>
          <dd>{formatINR(deal.onRoad)}</dd>
        </div>
      )}
    </dl>
  );
}

export function DealsView({ deals, vehicle, editHref }: { deals: Deal[]; vehicle: Vehicle; editHref: string }) {
  const types = useMemo(() => [...new Set(deals.map((d) => d.sellerType))], [deals]);
  const [filter, setFilter] = useState<SellerType | "all">("all");
  const [sort, setSort] = useState<"low" | "high">("low");
  const [open, setOpen] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [enquiry, setEnquiry] = useState<Deal | null>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => {
    const list = filter === "all" ? deals : deals.filter((d) => d.sellerType === filter);
    return [...list].sort((a, b) => (sort === "low" ? total(a) - total(b) : total(b) - total(a)));
  }, [deals, filter, sort]);

  if (deals.length === 0) {
    return (
      <div className="surface flex flex-col items-center rounded-3xl px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-soft text-ember">
          <SearchX size={24} aria-hidden />
        </span>
        <p className="display mt-5 text-3xl font-bold">No offers here yet</p>
        <p className="mt-2 max-w-md text-fog">
          We have no listings for the {vehicle.title} {vehicle.variant} in {vehicle.place}. Try a nearby city or another variant.
        </p>
        <Link href={editHref} className="mt-6 flex min-h-12 items-center rounded-full bg-ember px-6 font-semibold text-void hover:bg-[#ff8a4a]">
          Change city
        </Link>
      </div>
    );
  }

  const low = Math.min(...deals.map(total));
  const high = Math.max(...deals.map(total));
  const spread = high - low;
  const compared = deals.filter((d) => compare.includes(d.id));
  const comparedLow = compared.length ? Math.min(...compared.map(total)) : 0;
  const withPhoto = hasModelPhoto(vehicle.modelKey);
  const priceWord = deals[0].onRoad !== undefined ? "on-road price" : "asking price";

  const toggleCompare = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c));

  return (
    <div className="flex flex-col gap-6">
      {/* Honesty banner */}
      <div className="flex gap-3 rounded-2xl bg-ember-soft px-4 py-3.5 ring-1 ring-ember/30" role="note">
        <Info size={18} aria-hidden className="mt-0.5 flex-none text-ember" />
        <p className="text-sm text-bright/90">
          <strong>Sample listings, not real offers.</strong> The sellers are fictional and the prices are made-up figures, not the price of this vehicle anywhere.
          <span className="hidden sm:inline"> They show how offers will be compared once real sellers are connected.</span>
        </p>
      </div>

      {/* A photograph only when it shows this exact model; otherwise the page heading stands alone. */}
      {withPhoto && (
        <figure className="surface m-0 grid overflow-hidden rounded-3xl sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="relative h-40 overflow-hidden sm:h-full sm:min-h-40">
            <VehiclePhoto modelKey={vehicle.modelKey} sizes="(min-width: 640px) 320px, 100vw" priority />
          </div>
          <figcaption className="flex min-w-0 flex-col justify-center gap-1.5 p-5 sm:p-6">
            <span className="eyebrow text-ash">Reference photo</span>
            <span className="display break-words text-2xl font-bold">{vehicle.title}</span>
            <span className="text-sm text-fog">Shows the model, not a vehicle on offer. Real listings will carry the seller&rsquo;s own photographs.</span>
          </figcaption>
        </figure>
      )}

      {/* At-a-glance price range */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="surface rounded-3xl p-4 sm:p-7" aria-label="Price range">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
          <div className="order-2 sm:order-1">
            <p className="eyebrow text-ash">Sample listings</p>
            <p className="display tnum mt-1 text-2xl font-extrabold sm:mt-2 sm:text-4xl">{deals.length}</p>
          </div>
          <div className="order-1 col-span-2 sm:order-2 sm:col-span-1">
            <p className="eyebrow text-ash">Lowest sample {priceWord}</p>
            <p className="display tnum mt-1 text-4xl font-extrabold text-ember sm:mt-2">{formatINR(low)}</p>
          </div>
          <div className="order-3">
            <p className="eyebrow text-ash">Gap, low to high</p>
            <p className="display tnum mt-1 text-2xl font-extrabold sm:mt-2 sm:text-4xl">{formatINR(spread)}</p>
          </div>
        </div>
        <div className="mt-7 hidden sm:block" aria-hidden>
          <div className="relative h-1.5 rounded-full bg-white/[0.08]">
            {deals.map((d, i) => (
              <motion.span
                key={d.id}
                className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-coal ${total(d) === low ? "bg-ember" : "bg-fog"}`}
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: (spread ? ((total(d) - low) / spread) * 100 : 0) + "%", opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.9, ease: EASE }}
              />
            ))}
          </div>
          <div className="tnum mt-3 flex justify-between text-xs text-ash">
            <span>{formatINR(low)}</span>
            <span>{formatINR(high)}</span>
          </div>
        </div>
      </motion.section>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by seller type">
          {(["all", ...types] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              aria-pressed={filter === t}
              className={`min-h-11 flex-none rounded-full px-4 text-sm font-medium transition-colors ${filter === t ? "bg-bright text-void" : "bg-white/[0.06] text-fog ring-1 ring-hairline hover:text-bright"}`}
            >
              {t === "all" ? "All sellers" : t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-fog">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as "low" | "high")} className="h-11 rounded-full bg-graphite px-4 text-bright ring-1 ring-hairline">
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      <dl className="order-last grid gap-2 text-xs sm:order-none sm:-mt-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="What the price labels mean">
        {(Object.keys(BASIS) as Deal["basis"][]).map((key) => (
          <div key={key} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-hairline">
            <dt>
              <Basis basis={key} />
            </dt>
            <dd className="mt-2 text-ash">
              {BASIS[key].meaning}
              {key !== "sample" && " None on this page yet."}
            </dd>
          </div>
        ))}
      </dl>

      {/* Offers */}
      {shown.length === 0 ? (
        <div className="surface rounded-3xl px-6 py-12 text-center">
          <p className="display text-2xl font-bold">No listings for this seller type</p>
          <button type="button" onClick={() => setFilter("all")} className="mt-5 min-h-12 rounded-full bg-ember px-6 font-semibold text-void hover:bg-[#ff8a4a]">
            Show all sellers
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {shown.map((deal, i) => {
              const selected = compare.includes(deal.id);
              const expanded = open === deal.id;
              const isLow = total(deal) === low;
              const pct = spread ? Math.max(4, ((total(deal) - low) / spread) * 100) : 4;
              return (
                <motion.li
                  key={deal.id}
                  layout
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: Math.min(i * 0.07, 0.3), duration: 0.6, ease: EASE }}
                  className={`group surface overflow-hidden rounded-3xl transition-shadow duration-500 ${selected ? "is-selected" : ""}`}
                >
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {isLow && <Chip tone="ember">Lowest sample price</Chip>}
                        <Basis basis={deal.basis} />
                        {deal.availability && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-fog">{deal.availability}</span>}
                      </div>
                      <div className="min-w-0">
                        <h3 className="display break-words text-2xl font-bold">{deal.seller}</h3>
                        <p className="mt-1 text-fog">{deal.sellerType} · fictional seller</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fog">
                        <span className="break-words">
                          {vehicle.title} {vehicle.variant}
                          {deal.used ? ` · ${deal.used.year} · ${deal.used.km.toLocaleString("en-IN")} km · ${deal.used.owners === 1 ? "1st owner" : "2nd owner"}` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} aria-hidden />
                          {vehicle.place}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : deal.id)}
                        aria-expanded={expanded}
                        className="mt-auto flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-fog transition-colors hover:text-ember"
                      >
                        Price breakdown
                        <ChevronDown size={16} aria-hidden className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    <div className="flex flex-col justify-between gap-5 border-t border-hairline p-5 sm:p-6 lg:border-l lg:border-t-0">
                      <div>
                        <p className="text-sm text-ash">{deal.onRoad !== undefined ? "On-road price" : deal.priceLabel}</p>
                        <p className="display tnum mt-1 text-[2rem] font-extrabold leading-none">{formatINR(total(deal))}</p>
                        {deal.onRoad !== undefined && (
                          <p className="tnum mt-1.5 text-sm text-ash">
                            {deal.priceLabel} {formatINR(deal.price)}
                          </p>
                        )}
                        <div aria-hidden className="mt-4 h-1 rounded-full bg-white/[0.08]">
                          <div className={`h-full rounded-full ${isLow ? "bg-ember" : "bg-fog/60"}`} style={{ width: pct + "%" }} />
                        </div>
                        <p className={`tnum mt-2 text-sm font-medium ${isLow ? "text-ember" : "text-fog"}`}>
                          {isLow ? `Lowest of ${deals.length} sample listings` : `+ ${formatINR(total(deal) - low)} above the lowest`}
                        </p>
                      </div>
                      <div className="flex gap-2.5">
                        <button type="button" onClick={() => setEnquiry(deal)} className="min-h-12 flex-1 rounded-full bg-ember px-5 font-semibold text-void transition hover:bg-[#ff8a4a] active:scale-[0.98]">
                          Enquire
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompare(deal.id)}
                          aria-pressed={selected}
                          disabled={!selected && compare.length >= MAX_COMPARE}
                          className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                            selected ? "bg-bright text-void" : "text-bright ring-1 ring-hairline-strong hover:bg-white/5"
                          }`}
                        >
                          <Scale size={17} aria-hidden />
                          {selected ? "Added" : "Compare"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                        <div className="mx-auto max-w-xl px-5 pb-6 sm:px-6">
                          <Breakdown deal={deal} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Side-by-side comparison */}
      <div ref={compareRef} className="scroll-mt-32" aria-live="polite">
        {compared.length >= 2 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="surface rounded-3xl p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="display text-3xl font-bold">Side by side</h2>
              <Chip>Sample</Chip>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="tnum w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-medium text-ash">Line item</th>
                    {compared.map((d) => (
                      <th key={d.id} className="p-3 text-right font-semibold">
                        {d.seller}
                        <span className="block font-normal text-ash">{BASIS[d.basis].label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compared[0].breakdown.map((row, r) => (
                    <tr key={row.label} className="border-t border-hairline">
                      <th className="p-3 text-left font-normal text-fog">{row.label}</th>
                      {compared.map((d) => {
                        const amount = d.breakdown[r]?.amount ?? 0;
                        return (
                          <td key={d.id} className={`p-3 text-right ${amount < 0 ? "text-ember" : ""}`}>
                            {signed(amount)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t border-hairline-strong text-base font-semibold">
                    <th className="p-3 text-left">{compared[0].onRoad !== undefined ? "On-road price" : "Asking price"}</th>
                    {compared.map((d) => (
                      <td key={d.id} className={`p-3 text-right ${total(d) === comparedLow ? "rounded-lg bg-ember text-void" : ""}`}>
                        {formatINR(total(d))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="p-3 text-left font-normal text-fog">Above the lowest</th>
                    {compared.map((d) => (
                      <td key={d.id} className="p-3 text-right text-fog">
                        {total(d) === comparedLow ? "Lowest" : "+ " + formatINR(total(d) - comparedLow)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </div>

      {/* Compare tray */}
      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="bar sticky bottom-24 z-10 mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 shadow-2xl ring-1 ring-ember/50"
          >
            <span className="text-sm">
              {compare.length} of {MAX_COMPARE} selected{compare.length < 2 ? " · add one more" : ""}
            </span>
            <span className="flex gap-1.5">
              <button type="button" onClick={() => setCompare([])} className="min-h-11 rounded-full px-4 text-sm text-fog hover:bg-white/5 hover:text-bright">
                Clear
              </button>
              <button
                type="button"
                disabled={compare.length < 2}
                onClick={() => compareRef.current?.scrollIntoView({ block: "start" })}
                className="min-h-11 rounded-full bg-ember px-5 text-sm font-semibold text-void disabled:opacity-40"
              >
                Compare
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <EnquiryDialog deal={enquiry} vehicle={vehicle} onClose={() => setEnquiry(null)} />
    </div>
  );
}

function EnquiryDialog({ deal, vehicle, onClose }: { deal: Deal | null; vehicle: Vehicle; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "checking" | "demo">("idle");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (deal && !el.open) el.showModal();
    if (!deal && el.open) el.close();
  }, [deal]);

  function close() {
    setStatus("idle");
    setErrors({});
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) found.phone = "Enter a 10-digit Indian mobile number.";
    if (!consent) found.consent = "Tick the box so the seller is allowed to contact you.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus("checking");
    setTimeout(() => setStatus("demo"), 700);
  }

  const field = "h-12 rounded-xl bg-void px-4 text-base text-bright ring-1 ring-hairline-strong outline-none focus:ring-2 focus:ring-ember";

  return (
    <dialog ref={ref} onClose={close} aria-labelledby="enq-title" className="m-auto w-[min(92vw,480px)] rounded-3xl border-0 bg-coal p-0 text-bright shadow-2xl ring-1 ring-hairline-strong">
      {deal && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="enq-title" className="display text-2xl font-bold">Enquire about this offer</h2>
              <p className="mt-1.5 text-sm text-fog">
                {vehicle.title} {vehicle.variant} · {deal.seller}
              </p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-fog ring-1 ring-hairline hover:bg-white/5 hover:text-bright">
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className="rounded-xl bg-ember-soft p-3 text-sm ring-1 ring-ember/30">
            <strong>Demo mode.</strong> This is a sample listing and there is no server yet. Nothing you type is saved or sent to anyone.
          </p>
          <label className="flex flex-col gap-1.5 text-sm text-fog">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoComplete="name" className={field} />
            {errors.name && <span role="alert" className="text-danger">{errors.name}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-fog">
            Mobile number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} inputMode="tel" autoComplete="tel" className={field} />
            {errors.phone && <span role="alert" className="text-danger">{errors.phone}</span>}
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-fog">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-ember" />
            <span>I agree that my name and number may be shared with this seller so they can contact me about this vehicle.</span>
          </label>
          {errors.consent && <span role="alert" className="text-sm text-danger">{errors.consent}</span>}
          <button type="submit" disabled={status === "checking"} className="min-h-12 rounded-full bg-ember px-5 font-semibold text-void transition hover:bg-[#ff8a4a] disabled:opacity-60">
            {status === "checking" ? "Checking your details…" : "Send enquiry"}
          </button>
          <div aria-live="polite">
            {status === "demo" && (
              <p className="rounded-xl bg-white/[0.05] p-3 text-sm">
                Your details are valid. Because this is a demo, the enquiry was <strong>not sent or saved</strong>.
              </p>
            )}
          </div>
        </form>
      )}
    </dialog>
  );
}
