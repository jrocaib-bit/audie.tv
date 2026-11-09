"use client";

import { artworkScale, t, type Artwork, type PresentationFrame, type UiLocale } from "@audite/domain";
import { useEffect, useRef, useState } from "react";

export function ArtStage({
  frame,
  artworks,
  showCaption,
  reduceMotion,
  locale,
  immersive = false,
}: {
  frame: PresentationFrame;
  artworks: readonly Artwork[];
  showCaption: boolean;
  reduceMotion: boolean;
  locale: UiLocale;
  immersive?: boolean;
}) {
  const artwork = artworks.find((item) => item.id === frame.artworkId) ?? null;
  const [previous, setPrevious] = useState<Artwork | null>(null);
  const currentId = useRef<string | null>(frame.artworkId);

  useEffect(() => {
    if (frame.artworkId === currentId.current) return;
    const prior = artworks.find((item) => item.id === currentId.current) ?? null;
    currentId.current = frame.artworkId;
    if (reduceMotion || !prior || prior.id === frame.artworkId) {
      setPrevious(null);
      return;
    }
    setPrevious(prior);
    const timer = window.setTimeout(() => setPrevious(null), 900);
    return () => window.clearTimeout(timer);
  }, [artworks, frame.artworkId, reduceMotion]);

  const scale = artworkScale(frame.spanProgress, reduceMotion || !artwork);
  const caption = showCaption ? frame.captionText : t(locale, "episodeCaptionsOff");

  return (
    <figure className={immersive ? "flex min-h-0 flex-1 flex-col" : "overflow-hidden border border-border bg-card"}>
      <div
        data-testid="art-crossfade"
        className={
          immersive
            ? "relative min-h-0 flex-1 bg-[#0c0b09]"
            : "relative h-[min(46vh,520px)] min-h-64 bg-[#141210]"
        }
      >
        {previous ? (
          <div className="art-out absolute inset-0 grid place-items-center p-3">
            {/* Original reproduction, not a resized derivative. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previous.publicPath} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
          </div>
        ) : null}
        {artwork ? (
          <div className={`absolute inset-0 grid place-items-center p-3 ${previous && !reduceMotion ? "art-in" : ""}`}>
            {/* Original reproduction, not a resized derivative. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.publicPath}
              alt={`${artwork.title[locale]}. ${artwork.artist[locale]}`}
              className={`max-h-full max-w-full object-contain ${reduceMotion ? "" : "ken-burns"}`}
              style={{ transform: `scale(${scale})` }}
            />
          </div>
        ) : (
          <p className="grid h-full place-items-center px-6 text-center text-muted">{t(locale, "episodeNoImage")}</p>
        )}
      </div>
      <figcaption className={immersive ? "shrink-0 bg-[#171512] text-[#f4ece2]" : undefined}>
        <p
          data-testid="caption"
          data-opacity={caption ? "1" : "0"}
          className={
            immersive
              ? "caption-band max-h-24 overflow-hidden bg-[#171512] px-4 py-3 font-serif text-xl leading-snug text-[#f4ece2]"
              : "caption-band min-h-20 px-4 py-3 font-serif text-xl leading-snug md:text-2xl"
          }
        >
          {caption || "\u00a0"}
        </p>
        {frame.captionReviewNote && showCaption ? (
          <p className={`border-t px-4 py-2 text-sm ${immersive ? "border-white/10 text-[#b7ab9c]" : "border-border text-muted"}`}>
            {frame.captionReviewNote}
          </p>
        ) : null}
        {artwork && immersive ? (
          <div className="space-y-1 px-4 pb-3 text-xs leading-relaxed text-[#d9d0c4]">
            <p>
              {artwork.title.es} · {artwork.artist.es} · {artwork.date}
              {artwork.crop ? ` · ${t(locale, "episodeDetail")}` : ""}
            </p>
            <p>
              {artwork.title.en} · {artwork.artist.en} · {artwork.location.en}
            </p>
            <p className="line-clamp-2">{artwork.credit}</p>
            <p>
              {artwork.license} ·{" "}
              <a className="underline" href={artwork.sourcePage} target="_blank" rel="noreferrer">
                {t(locale, "episodeSource")}
              </a>
            </p>
          </div>
        ) : null}
        {artwork && !immersive ? (
          <div className="space-y-3 border-t border-border px-4 py-4 text-sm leading-relaxed">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {frame.sectionLabel ? (
                <p className="text-muted">
                  {t(locale, "episodeSection")}: {frame.sectionLabel}
                </p>
              ) : null}
              {artwork.crop ? (
                <p className="border border-border px-2 py-0.5 text-xs tracking-wide uppercase">{t(locale, "episodeDetail")}</p>
              ) : null}
            </div>
            <div>
              <p className="font-serif text-lg">{artwork.title.es}</p>
              <p>
                {artwork.artist.es} · {artwork.date}
              </p>
              <p className="text-muted">{artwork.location.es}</p>
            </div>
            <div>
              <p className="font-serif text-lg">{artwork.title.en}</p>
              <p>
                {artwork.artist.en} · {artwork.date}
              </p>
              <p className="text-muted">{artwork.location.en}</p>
            </div>
            {artwork.dateNote ? <p className="text-muted">{artwork.dateNote}</p> : null}
            {artwork.photographer ? (
              <p className="text-muted">
                {artwork.photographer}
                {artwork.photographDate ? ` · ${artwork.photographDate}` : ""}
              </p>
            ) : null}
            <p>{artwork.credit}</p>
            <p className="text-muted">{artwork.creditRequirement}</p>
            <p className="text-muted">{artwork.license}</p>
            <p className="text-muted">{frame.editorialNote}</p>
            <p>
              <a className="underline decoration-border underline-offset-4" href={artwork.sourcePage} target="_blank" rel="noreferrer">
                {t(locale, "episodeSource")}
              </a>
            </p>
          </div>
        ) : null}
      </figcaption>
    </figure>
  );
}
