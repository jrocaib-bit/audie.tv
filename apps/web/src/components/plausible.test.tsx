/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Plausible } from "./plausible";

describe("Plausible", () => {
  it("no carga el script si el dominio no está", () => {
    const { container } = render(<Plausible dominio="" />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("carga el script sin cookies cuando hay dominio", () => {
    render(<Plausible dominio="audite.tv" />);
    const script = document.querySelector("script[data-domain='audite.tv']");
    expect(script?.getAttribute("src")).toBe("https://plausible.io/js/script.js");
    expect(script?.getAttribute("data-domain")).toBe("audite.tv");
  });
});
