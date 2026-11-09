"use client";

import dynamic from "next/dynamic";

const LibraryScreen = dynamic(() => import("@/components/neo-app").then((mod) => mod.NeoLibrary), { ssr: false });

export function LibraryClient() {
  return (
    <LibraryScreen />
  );
}
