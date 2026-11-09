import type { Metadata } from "next";
import { NeoMembership as MembershipScreen } from "@/components/neo-app";

export const metadata: Metadata = { title: "Membresía" };

export default function Page() {
  return <MembershipScreen />;
}
