import type { Metadata } from "next";
import { WidgetV2 } from "@/components/v2/widget";

export const metadata: Metadata = { title: "Widget" };

export default function Page() {
  return <WidgetV2 />;
}
