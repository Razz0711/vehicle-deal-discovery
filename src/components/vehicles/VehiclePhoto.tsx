"use client";

import Image from "next/image";
import { useState } from "react";
import { commonsThumb } from "@/data/remotePhotos";
import { PHOTO_SLOTS, modelPhoto, typePhoto, type PhotoKind } from "@/data/vehiclePhotos";

/**
 * The only component that puts a vehicle on screen. It fills its parent,
 * which must be `relative` with a set size and `overflow-hidden`.
 *
 * Pass `kind` for a vehicle-type photo (step 1), or `modelKey` for a photo
 * of one exact model. In model mode it renders nothing unless a photograph
 * of that model exists: callers check `hasModelPhoto()` and lay out
 * accordingly. See data/vehiclePhotos.ts for the rules.
 */
type Props = {
  sizes: string;
  priority?: boolean;
  /** Show the photo credit. */
  showNote?: boolean;
  /** Inside a labelled button or link the photo adds no information, so hide it from screen readers. */
  decorative?: boolean;
  /** Extra classes for the image, for hover zoom. */
  className?: string;
} & ({ kind: PhotoKind; modelKey?: undefined } | { modelKey: string; kind?: undefined });

export function VehiclePhoto({ kind, modelKey, sizes, priority = false, showNote = true, decorative = false, className = "" }: Props) {
  const photo = modelKey ? modelPhoto(modelKey) : typePhoto(kind!);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!photo && failedSrc === photo.src;

  if (!photo || failed) {
    // A model without its own photograph shows nothing at all.
    if (modelKey) return null;
    // A vehicle type without one shows an empty lit frame; no vehicle is drawn.
    return (
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#1b1b1f,#0e0e10)]" data-photo="empty">
        <div aria-hidden className={`absolute inset-0 bg-[radial-gradient(45%_70%_at_50%_0%,rgb(255_255_255/0.10),transparent_70%)] ${className}`} />
        {showNote && (
          <span className="absolute right-3 top-3 rounded-full bg-void/60 px-2.5 py-1 text-[11px] text-ash">
            {failed ? "Photo unavailable" : `Photo slot · ${PHOTO_SLOTS[kind!].file}`}
          </span>
        )}
      </div>
    );
  }

  const remote = photo.remote;
  return (
    <>
      <Image
        src={photo.src}
        alt={decorative ? "" : photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        // Wikimedia photos are fetched straight from its servers at one of
        // the thumbnail widths it supports; local files use Next's optimiser.
        loader={remote ? ({ width }) => commonsThumb(remote, width) : undefined}
        onError={() => setFailedSrc(photo.src)}
        className={`object-cover ${className}`}
        style={{ objectPosition: photo.focus ?? "center" }}
      />
      {showNote && photo.credit && (
        <span className="absolute right-3 top-3 z-[1] max-w-[80%] truncate rounded-full bg-void/70 px-2.5 py-1 text-[11px] text-fog">
          Photo: {photo.credit}
          {remote ? ` · ${remote.licence}` : ""}
        </span>
      )}
    </>
  );
}

export function hasModelPhoto(modelKey: string | undefined): boolean {
  return !!modelPhoto(modelKey);
}
