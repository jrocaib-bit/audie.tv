import { scriptPlausible } from "@audite/domain";
import Script from "next/script";

export function Plausible({ dominio = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN }: { dominio?: string }) {
  const script = scriptPlausible(dominio);
  if (!script) return null;
  return <Script src={script.src} strategy="afterInteractive" data-domain={script.domain} />;
}
