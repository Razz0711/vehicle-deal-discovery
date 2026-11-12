"use client";

import Image from "next/image";
import { useState } from "react";
import { commonsThumb, type RemotePhoto } from "@/data/remotePhotos";

/**
 * A Wikimedia Commons photograph that fills its parent (which must be
 * `relative` with a set size). Requests one of Wikimedia's own thumbnail
 * widths, so no image is larger than its slot needs. If it cannot load, it
 * disappears instead of showing a broken image.
 */
export function RemoteImage({ photo, sizes, priority = false, decorative = false, className = "" }: { photo: RemotePhoto; sizes: string; priority?: boolean; decorative?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={commonsThumb(photo, 960)}
      alt={decorative ? "" : photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      loader={({ width }) => commonsThumb(photo, width)}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      style={{ objectPosition: photo.focus ?? "50% 58%" }}
    />
  );
}
