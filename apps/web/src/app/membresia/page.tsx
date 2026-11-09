import type { Metadata } from "next";
import { MembershipScreen } from "@/components/views";

export const metadata: Metadata = { title: "Membresía" };

export default function Page() {
  return <MembershipScreen />;
}
