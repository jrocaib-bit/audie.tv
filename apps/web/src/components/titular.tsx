import { datosTitular } from "@/lib/titular";

export function BloqueTitular() {
  const datos = datosTitular();
  return (
    <div className="mt-8 grid gap-3">
      <p>El responsable es {datos.nombre}, persona física.</p>
      <p className="text-[#B7AB9C]">{datos.nif}</p>
      <p className="text-[#B7AB9C]">{datos.direccion}</p>
      <p>
        Contacto: <a className="underline" href={`mailto:${datos.contacto}`}>{datos.contacto}</a>
      </p>
    </div>
  );
}
