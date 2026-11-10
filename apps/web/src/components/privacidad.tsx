import Link from "next/link";

export function Privacidad({ inicio = "/es" }: { inicio?: string }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <p className="text-sm tracking-[0.16em] text-[#C9A96E] uppercase">Borrador</p>
      <h1 className="font-display mt-3 text-5xl leading-none">Privacidad</h1>
      <p className="mt-4 text-[#C9A96E]">BORRADOR. Pendiente de revisión legal.</p>
      <p className="mt-8 text-[#B7AB9C]">[TITULAR] · [NIF] · [DIRECCIÓN]</p>
      <h2 className="font-display mt-10 text-3xl">Qué guardamos</h2>
      <ul className="mt-4 grid gap-3 text-[#F4ECE2]">
        <li>El identificador de la cuenta y el correo, si llegan de Apple, de Google o del enlace mágico.</li>
        <li>El progreso de escucha, los favoritos, las notas y el progreso de los retos.</li>
        <li>Eventos de uso anónimos, sin cookies.</li>
        <li>La medición agregada de Plausible, también sin cookies.</li>
      </ul>
      <h2 className="font-display mt-10 text-3xl">Quién los trata</h2>
      <ul className="mt-4 grid gap-3">
        <li>Supabase, en Irlanda, dentro de la Unión Europea.</li>
        <li>Resend, para el correo del enlace mágico.</li>
        <li>Apple y Google, para el pago de la suscripción en sus tiendas.</li>
        <li>Plausible, en la Unión Europea.</li>
      </ul>
      <h2 className="font-display mt-10 text-3xl">Qué no hacemos</h2>
      <p className="mt-4">No vendemos datos.</p>
      <p className="mt-3">En la web no hay cobro. La suscripción se contrata en la App Store o en Google Play, una por cuenta.</p>
      <h2 className="font-display mt-10 text-3xl">Borrar la cuenta</h2>
      <p className="mt-4">En la app, Ajustes incluye «Eliminar cuenta». Al confirmarlo se borra la cuenta y los datos asociados. Los eventos anónimos dejan de llevar el identificador.</p>
      <h2 className="font-display mt-10 text-3xl">Contacto</h2>
      <p className="mt-4"><a className="underline" href="mailto:soporte@audite.tv">soporte@audite.tv</a></p>
      <p className="mt-10"><Link href={inicio} className="inline-flex min-h-11 items-center text-[#C9A96E]">Audite</Link></p>
    </main>
  );
}
