import Image from "next/image";
import { ImageOff } from "lucide-react";
import { PHOTO_SLOTS, findPhoto, type PhotoKind } from "@/data/vehiclePhotos";

/**
 * The only component that puts a vehicle on screen. It fills its parent,
 * which must be `relative` with a set size and `overflow-hidden`.
 * Photographs are cropped with object-fit: cover, never stretched.
 */
export function VehiclePhoto({
  kind,
  modelKey,
  sizes,
  priority = false,
  compact = false,
}: {
  kind: PhotoKind;
  modelKey?: string;
  sizes: string;
  priority?: boolean;
  /** Small slots show a shorter placeholder message. */
  compact?: boolean;
}) {
  const { photo } = findPhoto(kind, modelKey);

  if (!photo) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-edge bg-ink-2 p-3 text-center text-mist">
        <ImageOff size={compact ? 18 : 26} aria-hidden />
        <span className={compact ? "text-xs" : "text-sm"}>Photograph to be added</span>
        {!compact && <span className="font-mono text-xs text-mist/80">{PHOTO_SLOTS[kind].shows}</span>}
      </div>
    );
  }

  return (
    <>
      <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" style={{ objectPosition: photo.focus ?? "center" }} />
      {photo.credit && !compact && (
        <span className="absolute bottom-1.5 right-2 rounded bg-ink-3/70 px-1.5 py-0.5 text-[11px] text-soft">Photo: {photo.credit}</span>
      )}
    </>
  );
}

export function hasPhoto(kind: PhotoKind, modelKey?: string): boolean {
  return !!findPhoto(kind, modelKey).photo;
}
