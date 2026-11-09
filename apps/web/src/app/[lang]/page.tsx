import { SitioHome } from "@/components/sitio";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SitioHome lang={lang} />;
}
