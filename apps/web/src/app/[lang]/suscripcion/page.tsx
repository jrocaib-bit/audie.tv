import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaywallWeb } from "@/components/paywall-web";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Audite Premium" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  return (
    <main className="min-h-dvh bg-[#100E0C]">
      <PaywallWeb lang={lang} />
    </main>
  );
}
