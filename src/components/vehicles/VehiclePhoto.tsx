import Image from "next/image";
import { PHOTO_SLOTS, findPhoto, type PhotoKind } from "@/data/vehiclePhotos";

/**
 * The only component that puts a vehicle on screen. It fills its parent,
 * which must be `relative` with a set size and `overflow-hidden`.
 * Photographs are cropped with object-fit: cover, never stretched.
 *
 * With no photograph yet, it renders a lit studio frame (no vehicle drawn)
 * and a small note naming the file to add.
 */
export function VehiclePhoto({
  kind,
  modelKey,
  sizes,
  priority = false,
  showNote = true,
  className = "",
}: {
  kind: PhotoKind;
  modelKey?: string;
  sizes: string;
  priority?: boolean;
  showNote?: boolean;
  /** Extra classes for the image, for hover zoom. */
  className?: string;
}) {
  const { photo } = findPhoto(kind, modelKey);

  if (!photo) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#1b1b1f,#0e0e10)]">
        {/* An empty, lit studio floor. No vehicle is drawn. */}
        <div
          aria-hidden
          className={`absolute inset-0 bg-[radial-gradient(55%_38%_at_50%_80%,rgb(242_118_50/0.34),transparent_72%),radial-gradient(45%_70%_at_50%_0%,rgb(255_255_255/0.13),transparent_70%)] ${className}`}
        />
        <div aria-hidden className="absolute inset-x-[10%] bottom-[20%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        {showNote && (
          <span className="absolute right-3 top-3 rounded-full bg-void/60 px-2.5 py-1 text-[11px] text-ash">
            Photo slot · {PHOTO_SLOTS[kind].file}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
        style={{ objectPosition: photo.focus ?? "center" }}
      />
      {photo.credit && (
        <span className="absolute bottom-2 right-2 z-[1] rounded-full bg-void/60 px-2 py-0.5 text-[11px] text-fog">Photo: {photo.credit}</span>
      )}
    </>
  );
}

export function hasPhoto(kind: PhotoKind, modelKey?: string): boolean {
  return !!findPhoto(kind, modelKey).photo;
}
