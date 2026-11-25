import { PESTANAS } from "../../ui/pestanas";
import { SegmentosLayout } from "../../ui/SegmentosLayout";

/** Pestaña La sala: La sala y Libros. */
export default function SalaLayout() {
  return <SegmentosLayout pestana={PESTANAS[3]} />;
}
