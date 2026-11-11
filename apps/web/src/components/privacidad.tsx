import Link from "next/link";
import { BloqueTitular } from "@/components/titular";

export function Privacidad({ inicio = "/es" }: { inicio?: string }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl leading-none">Privacidad</h1>
      <p className="mt-4 text-[#B7AB9C]">Última actualización: 11 de noviembre de 2026.</p>
      <BloqueTitular />

      <h2 className="font-display mt-10 text-3xl">Para qué</h2>
      <ul className="mt-4 grid gap-3">
        <li>Crear la cuenta con Apple, con Google o con el enlace mágico. Se guarda el identificador y el correo que entrega ese medio.</li>
        <li>Guardar, ligados a la cuenta, el progreso de escucha, los favoritos, las notas y el progreso de los retos.</li>
        <li>Anotar eventos de uso. El código retira las claves que parecen datos personales. Si hay sesión, el evento puede llevar el identificador de la cuenta. Esta medición no usa cookies.</li>
        <li>Cargar Plausible, sin cookies, solo si el dominio está definido en el entorno.</li>
        <li>Enviar el enlace mágico. El correo sale por Resend, como SMTP de Supabase.</li>
        <li>En la app, la suscripción se contrata en el App Store. La web no cobra. También se puede entrar con Google.</li>
        <li>Los correos que no son el enlace de acceso solo se preparan si marcas la casilla, que nace desmarcada.</li>
      </ul>

      <h2 className="font-display mt-10 text-3xl">Bases</h2>
      <ul className="mt-4 grid gap-3">
        <li>La cuenta, la escucha, las notas, los favoritos, los retos y el estado de la suscripción: para prestar el servicio pedido.</li>
        <li>Los correos que no son el enlace de acceso: solo con la casilla marcada.</li>
        <li>Los eventos de uso y Plausible: interés en saber si el servicio se usa, sin cookies y sin vender datos.</li>
      </ul>

      <h2 className="font-display mt-10 text-3xl">Destinatarios</h2>
      <ul className="mt-4 grid gap-3">
        <li>Supabase, en la Unión Europea (región eu-west-1): cuenta, escucha, notas, favoritos, retos, eventos y la preferencia de correo.</li>
        <li>Vercel: alojamiento de la web.</li>
        <li>Resend: el enlace mágico. El módulo de otros correos no está disparado.</li>
        <li>Plausible, en la Unión Europea, solo si su dominio está configurado.</li>
        <li>Apple: el inicio de sesión y la suscripción de la app.</li>
        <li>Google: el inicio de sesión, cuando se usa.</li>
      </ul>
      <p className="mt-4">No vendemos datos.</p>

      <h2 className="font-display mt-10 text-3xl">Conservación</h2>
      <p className="mt-4">El código no fija un plazo. Los datos de la cuenta siguen mientras la cuenta existe.</p>

      <h2 className="font-display mt-10 text-3xl">Derechos</h2>
      <p className="mt-4">Puedes pedir acceso, rectificación, supresión, limitación, oposición y portabilidad escribiendo a <a className="underline" href="mailto:soporte@audite.tv">soporte@audite.tv</a>.</p>
      <p className="mt-3">También puedes reclamar ante la Agencia Española de Protección de Datos, en aepd.es.</p>

      <h2 className="font-display mt-10 text-3xl">Borrar la cuenta</h2>
      <p className="mt-4">En la app, Ajustes incluye «Eliminar cuenta». En la web, la página Cuenta también. Al confirmarlo se borra el usuario. Lo que cuelga del perfil se va en cascada. En los eventos, el identificador de la cuenta queda vacío.</p>
      <p className="mt-10"><Link href={inicio} className="inline-flex min-h-11 items-center text-[#C9A96E]">Audite</Link></p>
    </main>
  );
}
