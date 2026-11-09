import type { Metadata } from "next";
import { NeoSettings as SettingsScreen } from "@/components/neo-app";

export const metadata: Metadata = { title: "Ajustes" };

export default function Page() {
  return <SettingsScreen />;
}
