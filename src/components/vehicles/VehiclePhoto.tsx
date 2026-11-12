"use client";

import Image from "next/image";
import { useState } from "react";
import { commonsThumb } from "@/data/remotePhotos";
import { PHOTO_SLOTS, findPhoto, type PhotoKind } from "@/data/vehiclePhotos";

/**
 * The only component that puts a vehicle on screen. It fills its parent,
 * which must be `relative` with a set size and `overflow-hidden`.
 * Photographs are cropped with object-fit: cover, never stretched.
 *
 * With no photograph, or if a photograph fails to load, it renders an empty
 * lit studio frame (no vehicle is drawn) instead of a broken image.
 */
export function VehiclePhoto({
  kind,
  modelKey,
  sizes,
  priority = false,
  showNote = true,
  decorative = false,
  className = "",
}: {
  kind: PhotoKind;
  modelKey?: string;
  sizes: string;
  priority?: boolean;
  /** Show the photo credit (or, with no photo, the slot name). */
  showNote?: boolean;
  /** Inside a labelled button or link the photo adds no information, so hide it from screen readers. */
  decorative?: boolean;
  /** Extra classes for the image, for hover zoom. */
  className?: string;
}) {
  const { photo } = findPhoto(kind, modelKey);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!photo && failedSrc === photo.src;

  if (!photo || failed) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#1b1b1f,#0e0e10)]" data-photo="empty">
        <div
          aria-hidden
          className={`absolute inset-0 bg-[radial-gradient(55%_38%_at_50%_80%,rgb(242_118_50/0.34),transparent_72%),radial-gradient(45%_70%_at_50%_0%,rgb(255_255_255/0.13),transparent_70%)] ${className}`}
        />
        <div aria-hidden className="absolute inset-x-[10%] bottom-[20%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        {showNote && (
          <span className="absolute right-3 top-3 rounded-full bg-void/60 px-2.5 py-1 text-[11px] text-ash">
            {failed ? "Photo unavailable" : `Photo slot · ${PHOTO_SLOTS[kind].file}`}
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
        <span className="absolute right-3 top-3 z-[1] max-w-[80%] truncate rounded-full bg-void/65 px-2.5 py-1 text-[11px] text-fog backdrop-blur">
          Photo: {photo.credit}
          {remote ? ` · ${remote.licence}` : ""}
        </span>
      )}
    </>
  );
}

export function hasPhoto(kind: PhotoKind, modelKey?: string): boolean {
  return !!findPhoto(kind, modelKey).photo;
}
