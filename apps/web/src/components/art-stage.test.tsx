/** @vitest-environment jsdom */
import { frameAt, type Artwork, type CaptionCue, type ImageCue } from "@audite/domain";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ArtStage } from "./art-stage";

afterEach(() => cleanup());

const cues: ImageCue[] = [
  {
    startSeconds: 0,
    endSeconds: 200,
    artworkId: "geometra",
    sectionLabel: "Apertura",
    editorialNote: "Nota de prueba",
  },
];

const captions: CaptionCue[] = [
  { startSeconds: 0, endSeconds: 20, text: "Génesis, rótulo de prueba", provenance: "automatic" },
  {
    startSeconds: 100,
    endSeconds: 140,
    text: "Rótulo revisado de prueba",
    provenance: "reviewed_correction",
    reviewNote: "Corrección de prueba",
  },
];

const artworks: Artwork[] = [
  {
    id: "geometra",
    workId: "geometra",
    title: { es: "Dios arquitecto del universo", en: "God the geometer" },
    artist: { es: "Anónimo", en: "Anonymous" },
    date: "c. 1220",
    location: { es: "Viena", en: "Vienna" },
    license: "PD-Art",
    credit: "Prueba",
    creditRequirement: "Ninguno",
    sourcePage: "https://example.com/obra",
    sourceFile: "https://example.com/obra.jpg",
    publicPath: "/media/art/geometra.jpg",
    kitPath: "content/pilot/assets/geometra.jpg",
    sha256: "a".repeat(64),
    bytes: 4,
    width: 10,
    height: 10,
    crop: null,
    editorialRole: "Prueba",
    displayable: true,
  },
];

describe("ArtStage", () => {
  it("keeps the caption outside the image and fully opaque", () => {
    const frame = frameAt(cues, captions, 4, false);
    render(<ArtStage frame={frame} artworks={artworks} showCaption reduceMotion={false} locale="es" />);
    const caption = screen.getByTestId("caption");
    expect(caption.closest("[data-testid='art-crossfade']")).toBeNull();
    expect(caption.getAttribute("data-opacity")).toBe("1");
    expect(caption.className).not.toMatch(/art-in|art-out|opacity-0/);
    expect(caption.textContent).toContain("Génesis");
    expect(screen.getByRole("img", { name: /Dios arquitecto/ })).toBeTruthy();
  });

  it("does not fade the caption when motion is reduced", () => {
    const moving = frameAt(cues, captions, 116, false);
    const still = frameAt(cues, captions, 116, true);
    const { rerender } = render(
      <ArtStage frame={moving} artworks={artworks} showCaption reduceMotion={false} locale="es" />,
    );
    expect(screen.getByTestId("caption").textContent).toContain("revisado");
    rerender(<ArtStage frame={still} artworks={artworks} showCaption reduceMotion locale="es" />);
    const caption = screen.getByTestId("caption");
    expect(caption.textContent).toContain("revisado");
    expect(caption.getAttribute("data-opacity")).toBe("1");
    expect(document.querySelector(".art-out")).toBeNull();
  });
});
