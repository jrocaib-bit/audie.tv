import type { Metadata } from "next";
import { obrasVisibles } from "@audite/content/obras";

export const metadata: Metadata = { title: "Créditos" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const ui = lang === "en" ? "en" : "es";
  return (
    <main className="mx-auto min-h-full w-full max-w-lg bg-background px-5 py-8 text-foreground">
      <h1 className="font-display text-4xl">{ui === "en" ? "Credits" : "Créditos"}</h1>
      <p className="mt-4 text-sm">OpenBible.info · CC BY 4.0</p>
      <ul className="mt-6 space-y-2 text-sm text-muted">
        {obrasVisibles().slice(0, 16).map((obra) => <li key={obra.id}>{obra.placa[ui]}</li>)}
      </ul>
    </main>
  );
}
