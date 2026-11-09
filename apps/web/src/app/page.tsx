import type { Metadata } from "next";
import { TodayScreen } from "@/components/views";

export const metadata: Metadata = { title: "Hoy" };

export default function Page() {
  return <TodayScreen />;
}
