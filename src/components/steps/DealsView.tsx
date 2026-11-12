"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Info, MapPin, Scale, X } from "lucide-react";
import type { Deal, SellerType } from "@/data/sampleDeals";
import type { PhotoKind } from "@/data/vehiclePhotos";
import { formatINR } from "@/lib/slug";
import { VehiclePhoto, hasPhoto } from "../vehicles/VehiclePhoto";
import { findPhoto } from "@/data/vehiclePhotos";

type Vehicle = { title: string; variant: string; place: string; kind: PhotoKind; modelKey?: string; condition: "new" | "used" };
const MAX_COMPARE = 3;
const total = (d: Deal) => d.onRoad ?? d.price;

function SampleTag() {
  return <span className="eyebrow rounded border border-dashed border-slate px-2 py-1 text-slate" style={{ fontSize: 11 }}>Sample data</span>;
}

function Breakdown({ deal }: { deal: Deal }) {
  return (
    <dl className="font-mono text-sm tabular-nums">
      {deal.breakdown.map((row) => (
        <div key={row.label} className={`flex justify-between gap-4 border-t border-[#d5dbe7] py-2 ${row.amount < 0 ? "text-blue-deep" : ""}`}>
          <dt>{row.label}</dt>
          <dd>{row.amount < 0 ? "− " + formatINR(-row.amount) : formatINR(row.amount)}</dd>
        </div>
      ))}
      {deal.onRoad !== undefined && (
        <div className="flex justify-between gap-4 border-t-2 border-ink pt-3 text-base font-medium">
          <dt>On-road price</dt>
          <dd>{formatINR(deal.onRoad)}</dd>
        </div>
      )}
    </dl>
  );
}

export function DealsView({ deals, vehicle }: { deals: Deal[]; vehicle: Vehicle }) {
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
  const compared = deals.filter((d) => compare.includes(d.id));
  const lowest = compared.length ? Math.min(...compared.map(total)) : 0;

  // A type-level photograph on a specific listing must say what it is.
  const photoNote = !hasPhoto(vehicle.kind, vehicle.modelKey)
    ? null
    : findPhoto(vehicle.kind, vehicle.modelKey).exact
      ? "Photograph of this model, not this exact vehicle"
      : "Representative photograph, not this model";

  function toggleCompare(id: string) {
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 rounded-md border border-dashed border-sky bg-ink-2 p-4" role="note">
        <Info size={20} aria-hidden className="mt-0.5 flex-none text-sky" />
        <p className="text-soft">
          <strong className="text-white">These are sample listings, not real offers.</strong> The sellers are fictional and the prices are placeholder numbers, not the
          real price of this model. They show how verified offers will appear once sellers and price evidence are connected.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by seller type">
          {(["all", ...types] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              aria-pressed={filter === t}
              className={`min-h-11 rounded border px-4 text-sm font-medium ${filter === t ? "border-paper bg-paper text-ink" : "border-edge text-soft hover:border-sky"}`}
            >
              {t === "all" ? "All sellers" : t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-soft">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as "low" | "high")} className="h-11 rounded border border-edge bg-ink px-3 text-white">
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-md border border-dashed border-edge p-10 text-center">
          <p className="display text-2xl font-bold">No listings for this seller type</p>
          <p className="mt-2 text-soft">Try another seller type, or go back and change your vehicle or city.</p>
          <button type="button" onClick={() => setFilter("all")} className="mt-5 min-h-12 rounded bg-blue px-5 font-semibold text-white hover:bg-blue-deep">
            Show all sellers
          </button>
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          <AnimatePresence initial>
            {shown.map((deal, i) => {
              const selected = compare.includes(deal.id);
              const expanded = open === deal.id;
              return (
                <motion.li
                  key={deal.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className={`flex flex-col rounded-md bg-paper text-ink ${selected ? "outline outline-2 outline-offset-2 outline-sky" : ""}`}
                >
                  <div className="group relative h-44 overflow-hidden rounded-t-md bg-ink-2">
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                      <VehiclePhoto kind={vehicle.kind} modelKey={vehicle.modelKey} sizes="(min-width: 1024px) 560px, 100vw" />
                    </div>
                    {photoNote && <span className="absolute left-3 top-3 rounded bg-ink-3/80 px-2 py-1 text-xs text-soft">{photoNote}</span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="display text-xl font-bold" style={{ fontStretch: "112%" }}>{vehicle.title}</h2>
                        <p className="text-slate">{vehicle.variant}{deal.used ? ` · ${deal.used.year} · ${deal.used.km.toLocaleString("en-IN")} km · ${deal.used.owners === 1 ? "1st owner" : "2nd owner"}` : ""}</p>
                      </div>
                      <SampleTag />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate">Seller</p>
                        <p className="font-medium">{deal.seller}</p>
                        <p className="text-slate">{deal.sellerType}</p>
                      </div>
                      <div>
                        <p className="text-slate">Location</p>
                        <p className="flex items-center gap-1 font-medium"><MapPin size={14} aria-hidden />{vehicle.place}</p>
                        <p className="text-slate">{deal.availability}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#d5dbe7] pt-4">
                      <div>
                        <p className="text-sm text-slate">{deal.priceLabel}</p>
                        <p className="font-mono text-lg tabular-nums">{formatINR(deal.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate">On-road price</p>
                        <p className="font-mono text-2xl font-medium tabular-nums">{deal.onRoad !== undefined ? formatINR(deal.onRoad) : "Not available"}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setOpen(expanded ? null : deal.id)} aria-expanded={expanded} className="flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-blue-deep">
                      Price breakdown
                      <ChevronDown size={16} aria-hidden className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <Breakdown deal={deal} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="mt-auto flex flex-wrap gap-3">
                      <button type="button" onClick={() => setEnquiry(deal)} className="min-h-12 flex-1 rounded bg-blue px-5 font-semibold text-white hover:bg-blue-deep">
                        Enquire
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompare(deal.id)}
                        aria-pressed={selected}
                        disabled={!selected && compare.length >= MAX_COMPARE}
                        className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded border px-5 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-ink bg-ink text-white" : "border-slate hover:border-ink"}`}
                      >
                        <Scale size={18} aria-hidden />
                        {selected ? "Added to compare" : "Compare"}
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <div ref={compareRef} className="scroll-mt-6" aria-live="polite">
        {compared.length >= 2 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-md bg-paper p-5 text-ink">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="display text-2xl font-bold">Side by side</h2>
              <SampleTag />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-medium text-slate">Line item</th>
                    {compared.map((d) => (
                      <th key={d.id} className="p-2 text-right font-semibold">{d.seller}<span className="block font-normal text-slate">{d.sellerType}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {compared[0].breakdown.map((row, r) => (
                    <tr key={row.label} className="border-t border-[#d5dbe7]">
                      <th className="p-2 text-left font-sans font-normal">{row.label}</th>
                      {compared.map((d) => {
                        const amount = d.breakdown[r]?.amount ?? 0;
                        return <td key={d.id} className="p-2 text-right">{amount < 0 ? "− " + formatINR(-amount) : formatINR(amount)}</td>;
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-ink text-base font-medium">
                    <th className="p-2 text-left font-sans">{compared[0].onRoad !== undefined ? "On-road price" : "Asking price"}</th>
                    {compared.map((d) => (
                      <td key={d.id} className={`p-2 text-right ${total(d) === lowest ? "bg-ink text-white" : ""}`}>{formatINR(total(d))}</td>
                    ))}
                  </tr>
                  <tr>
                    <th className="p-2 text-left font-sans font-normal">Above the lowest</th>
                    {compared.map((d) => (
                      <td key={d.id} className="p-2 text-right">{total(d) === lowest ? "Lowest" : "+ " + formatINR(total(d) - lowest)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </div>

      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="sticky bottom-20 z-10 mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-md border border-sky bg-ink-3 px-4 py-3 shadow-2xl">
            <span className="text-sm">
              {compare.length} of {MAX_COMPARE} selected{compare.length < 2 ? ". Add one more to compare." : ""}
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={() => setCompare([])} className="min-h-11 rounded border border-edge px-3 text-sm hover:border-sky">Clear</button>
              <button type="button" disabled={compare.length < 2} onClick={() => compareRef.current?.scrollIntoView({ block: "start" })} className="min-h-11 rounded bg-blue px-4 text-sm font-semibold text-white disabled:opacity-50">
                View comparison
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

  // Open or close the native dialog whenever the chosen deal changes.
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

  return (
    <dialog ref={ref} onClose={close} aria-labelledby="enq-title" className="m-auto w-[min(92vw,460px)] rounded-md bg-paper p-0 text-ink">
      {deal && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="enq-title" className="display text-2xl font-bold">Enquire about this listing</h2>
              <p className="mt-1 text-slate">{vehicle.title} {vehicle.variant} · {deal.seller}</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="flex h-11 w-11 flex-none items-center justify-center rounded border border-slate">
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className="rounded border border-dashed border-slate p-3 text-sm text-slate">
            <strong className="text-ink">Demo mode.</strong> This is a sample listing and there is no server yet. Nothing you type is saved or sent to anyone.
          </p>
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoComplete="name" className="h-12 rounded border border-slate bg-white px-3 text-base text-ink" />
            {errors.name && <span role="alert" className="text-[#b42318]">{errors.name}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Mobile number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} inputMode="tel" autoComplete="tel" className="h-12 rounded border border-slate bg-white px-3 text-base text-ink" />
            {errors.phone && <span role="alert" className="text-[#b42318]">{errors.phone}</span>}
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-blue" />
            <span>I agree that my name and number may be shared with this seller so they can contact me about this vehicle.</span>
          </label>
          {errors.consent && <span role="alert" className="text-sm text-[#b42318]">{errors.consent}</span>}
          <button type="submit" disabled={status === "checking"} className="min-h-12 rounded bg-blue px-5 font-semibold text-white hover:bg-blue-deep disabled:opacity-60">
            {status === "checking" ? "Checking your details…" : "Send enquiry"}
          </button>
          <div aria-live="polite">
            {status === "demo" && (
              <p className="rounded border border-dashed border-slate p-3 text-sm">
                Your details are valid. Because this is a demo, the enquiry was <strong>not sent or saved</strong>.
              </p>
            )}
          </div>
        </form>
      )}
    </dialog>
  );
}
