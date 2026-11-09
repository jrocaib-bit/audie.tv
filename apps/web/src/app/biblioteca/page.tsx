import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";

export const metadata: Metadata = { title: "Biblioteca" };

export default function Page() {
  return <LibraryClient />;
}
