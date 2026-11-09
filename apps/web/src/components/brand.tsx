import disponibles from "../../../../content/canon/03_identidad/disponibles.json";
import { t, type UiLocale } from "@audite/domain";

const logos = disponibles as { wordmark: string | null; mark: string | null };

export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  if (logos.mark) {
    // Real file from 03_identidad/logos, when the sync script has copied one.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logos.mark} alt="" className={className} />;
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="2" fill="currentColor" />
      <text x="16" y="22.5" textAnchor="middle" fill="var(--background)" fontFamily="var(--font-serif), Georgia, serif" fontSize="20">
        a
      </text>
    </svg>
  );
}

export function Wordmark({ locale, className = "" }: { locale: UiLocale; className?: string }) {
  if (logos.wordmark) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logos.wordmark} alt={t(locale, "wordmark")} className={`h-7 w-auto ${className}`} />;
  }
  return <span className={`font-sans text-[1.35rem] tracking-[-0.04em] lowercase ${className}`}>{t(locale, "wordmark")}</span>;
}
