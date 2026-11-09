import type { Metadata } from "next";
import { NeoToday as TodayScreen } from "@/components/neo-app";

export const metadata: Metadata = { title: "Hoy" };

export default function Page() {
  return <TodayScreen />;
}
