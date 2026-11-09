import type { Metadata } from "next";
import { NowPlayingScreen } from "@/components/views";

export const metadata: Metadata = { title: "Ahora" };

export default function Page() {
  return <NowPlayingScreen />;
}
