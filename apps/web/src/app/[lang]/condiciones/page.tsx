import { PRECIO, textosAlta } from "@audite/domain";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BloqueTitular } from "@/components/titular";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Condiciones" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const copy = textosAlta(lang);
  return (
    <>
      <main className="mx-auto min-h-dvh w-full max-w-2xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
        <p className="text-sm tracking-[0.16em] text-[#C9A96E] uppercase">Borrador</p>
        <h1 className="font-display text-5xl">{copy.condiciones}</h1>
        <p className="mt-4 text-[#C9A96E]">BORRADOR. Pendiente de revisión legal.</p>
        <p className="mt-2 text-[#B7AB9C]">Última actualización: 10 de noviembre de 2026.</p>
        <BloqueTitular />
        <p className="mt-8 text-lg">{copy.titulo}</p>
        <p className="mt-3 text-[#B7AB9C]">{PRECIO.mes} · {PRECIO.anio}</p>
        <h2 className="font-display mt-10 text-3xl">Audite Premium</h2>
        <p className="mt-4">Incluye la escucha de la Biblia en la app, con la misma cuenta en la web. La voz y la música están generadas con IA.</p>
        <p className="mt-3">El precio es 1,99 € al mes. Quien se suscriba al anual antes del 6 de enero de 2027 mantiene 8,00 € al año mientras siga suscrito. Desde esa fecha, el anual para suscripciones nuevas es 12,99 € al año. IVA incluido según la tienda. Hay 7 días gratis. Si no cancelas antes de que acaben, la suscripción se renueva sola en el App Store o en Google Play. El reto Adviento con Isaías es gratis y no hace falta suscripción. En la app hace falta una cuenta: regístrate o inicia sesión. No se pide suscripción ni prueba.</p>
        <p className="mt-3">Se cancela en los ajustes de suscripciones de Apple o de Google, no en la web. Borrar la app no cancela el cobro.</p>
        <p className="mt-3">Borrador para revisión: el desistimiento de 14 días del derecho de consumo europeo puede no aplicar al contenido digital cuando la persona ha empezado a usarlo con su consentimiento. Los reembolsos de un pago de la tienda los gestiona Apple o Google.</p>
        <p className="mt-3">La web solo sirve para escuchar. En ella no se vende nada.</p>
        <p className="mt-3">El texto bíblico, cuando se publique con licencia, se acredita como en los créditos. Hoy el repositorio no incluye el texto de la CEE.</p>
        <p className="mt-3">Usa Audite con respeto. Podemos actualizar estas condiciones. La ley aplicable es la de España.</p>
        <p className="mt-3">Contacto: <a className="underline" href="mailto:soporte@audite.tv">soporte@audite.tv</a>.</p>
      </main>
    </>
  );
}
