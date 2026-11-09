import { t, type UiLocale } from "@audite/domain";

const wordmarks = {
  blanco: "/marca/audite_wordmark_blanco.svg",
  negro: "/marca/audite_wordmark_negro.svg",
  oro: "/marca/audite_wordmark_oro.svg",
  ocre: "/marca/audite_wordmark_ocre.svg",
} as const;

export function Mark({ className = "h-9 w-9", tono = "oscuro" }: { className?: string; tono?: "oscuro" | "oro" }) {
  const src = tono === "oro" ? "/marca/audite_marca_oro_180.png" : "/marca/audite_marca_oscuro_180.png";
  // SVG/PNG de marca, no un derivado. El componente Image de Next no aporta aquí.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={180} height={180} className={className} />;
}

export function Wordmark({
  locale,
  tono = "auto",
  className = "h-7 w-auto",
}: {
  locale: UiLocale;
  tono?: "auto" | "blanco" | "negro" | "oro" | "ocre";
  className?: string;
}) {
  const alt = t(locale, "wordmark");
  if (tono !== "auto") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={wordmarks[tono]} alt={alt} className={className} />;
  }
  return (
    <span className="inline-flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wordmarks.negro} alt={alt} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wordmarks.blanco} alt="" className={`${className} hidden dark:block`} />
    </span>
  );
}
