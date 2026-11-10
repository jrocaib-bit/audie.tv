import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Text } from "@react-email/components";
import React from "react";
import type { Borrador } from "./textos";

const noche = "#100E0C";
const marfil = "#F4ECE2";
const oro = "#C9A96E";

export function Carta({ borrador, texto }: { borrador: Borrador; texto: string }) {
  const parrafos = texto.split("\n\n");
  return (
    <Html lang="es">
      <Head />
      <Preview>{borrador.preheader}</Preview>
      <Body style={{ backgroundColor: noche, margin: 0, padding: "32px 16px" }}>
        <Container style={{ maxWidth: "560px" }}>
          <Img src="https://audite.tv/marca/audite_wordmark_blanco.png" alt="Audite" width="148" height="32" />
          {parrafos.map((parrafo) => (
            <Text key={parrafo.slice(0, 48)} style={{ color: marfil, fontFamily: "Georgia, serif", fontSize: "16px", lineHeight: "26px", whiteSpace: "pre-wrap" }}>
              {parrafo}
            </Text>
          ))}
          <Button href={borrador.ctaUrl} style={{ backgroundColor: oro, color: noche, borderRadius: "999px", padding: "12px 22px", fontFamily: "Georgia, serif", fontSize: "16px", textDecoration: "none" }}>
            {borrador.cta}
          </Button>
          {borrador.ctaSecundario ? (
            <Text style={{ color: marfil, fontFamily: "Georgia, serif", fontSize: "16px" }}>
              <Link href={borrador.ctaSecundario.url} style={{ color: oro }}>{borrador.ctaSecundario.etiqueta}</Link>
            </Text>
          ) : null}
          <Hr style={{ borderColor: "#2E2924", marginTop: "28px" }} />
        </Container>
      </Body>
    </Html>
  );
}
