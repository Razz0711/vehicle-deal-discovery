import { SHOWCASE, type ShowcaseItem } from "@/data/showcase";
import { RemoteImage } from "../site/RemoteImage";

function Card({ item, hidden }: { item: ShowcaseItem; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden} className="surface relative h-44 w-72 flex-none overflow-hidden rounded-2xl sm:h-52 sm:w-80">
      <RemoteImage photo={item.photo} sizes="320px" decorative={hidden} className="[filter:saturate(0.85)_brightness(0.82)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/10 to-transparent" />
      <p className="absolute inset-x-4 bottom-3">
        <span className="eyebrow block text-ember" style={{ fontSize: 10.5 }}>
          {item.segment}
        </span>
        <span className="display block text-lg font-bold">{item.name}</span>
      </p>
    </li>
  );
}

function Row({ items, reverse = false, dur }: { items: ShowcaseItem[]; reverse?: boolean; dur: number }) {
  return (
    <ul className={`marquee flex w-max gap-4 ${reverse ? "marquee-reverse" : ""}`} style={{ ["--dur" as string]: dur + "s" }}>
      {items.map((i) => (
        <Card key={i.id} item={i} />
      ))}
      {/* Second copy makes the loop seamless; hidden from assistive technology. */}
      {items.map((i) => (
        <Card key={i.id + "-b"} item={i} hidden />
      ))}
    </ul>
  );
}

/** Two rows of vehicles moving slowly in opposite directions. Pauses on hover or focus. */
export function Marquee() {
  const half = Math.ceil(SHOWCASE.length / 2);
  return (
    <div className="marquee-wrap no-scrollbar flex flex-col gap-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <Row items={SHOWCASE.slice(0, half)} dur={70} />
      <Row items={SHOWCASE.slice(half)} dur={84} reverse />
    </div>
  );
}
