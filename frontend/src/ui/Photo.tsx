import { useState } from "react";
import type { ArtKey, Tone } from "../data/types";
import { cn } from "../lib/format";
import HairArt from "./HairArt";

/**
 * Photography slot. Tries, in order: an explicit `src` (e.g. an uploaded
 * image), then `/images/<path>.jpg` from /public, and fades the photo in once
 * it loads. Until real photography exists, the illustration shows through.
 */
export default function Photo({
  path,
  src,
  art,
  tone,
  alt,
  className,
  imgClassName,
  zoom,
}: {
  path?: string;
  src?: string;
  art: ArtKey;
  tone: Tone;
  alt: string;
  className?: string;
  imgClassName?: string;
  zoom?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = src ?? (path ? `/images/${path}.jpg` : undefined);
  return (
    <div role="img" aria-label={alt} className={cn("relative overflow-hidden bg-sand", className)}>
      <div className={cn("absolute inset-0 transition-transform duration-[1.2s] ease-out", zoom && "group-hover:scale-[1.04]")}>
        <HairArt art={art} tone={tone} className="h-full w-full" />
        {url && !failed ? (
          <img
            src={url}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              loaded ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
