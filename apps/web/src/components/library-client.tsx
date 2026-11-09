"use client";

import dynamic from "next/dynamic";

const LibraryScreen = dynamic(() => import("@/components/views").then((mod) => mod.LibraryScreen), { ssr: false });

export function LibraryClient() {
  return (
    <div className="min-h-[75vh]">
      <LibraryScreen bare />
    </div>
  );
}
