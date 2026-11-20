import { describe, expect, it } from "vitest";
import { HORAS_RECORDATORIO, horaTexto, planDiario } from "./recordatorio-plan";

describe("recordatorio diario", () => {
  it("avisa los siete días a la hora elegida", () => {
    expect(planDiario(21, true)).toEqual({ activo: true, hora: 21, minuto: 0, dias: [0, 1, 2, 3, 4, 5, 6] });
    expect(planDiario(99, false).hora).toBe(8);
    expect(HORAS_RECORDATORIO.map(horaTexto)).toEqual(["7:00", "8:00", "13:00", "21:00", "22:00"]);
  });
});
