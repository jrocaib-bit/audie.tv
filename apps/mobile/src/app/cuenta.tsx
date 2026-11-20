import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obraDeEpisodio, obraWebp } from "../../../../packages/content/src/obras-visibles";
import { dark, fonts } from "../theme";
import { subCuenta, tituloCuenta, tx } from "../textos";
import { Pulsable } from "../ui/Pulsable";
import { CuentaForm } from "../ui/CuentaForm";
import { ObraMarco } from "../ui/ObraMarco";
import { useTema } from "../ui/tema";

const c = dark;
const obra = obraDeEpisodio("gn-01");
const PORTADA = obra ? obraWebp(obra) : "";

/** Hoja para crear la cuenta o entrar. Al aparecer la sesión, el layout la cierra y arranca lo pendiente. */
export default function Cuenta() {
  const { lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.gallery }} contentContainerStyle={{ padding: 20, paddingTop: 20, paddingBottom: insets.bottom + 20, gap: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ObraMarco src={PORTADA} style={{ height: 200, borderRadius: 24 }} />
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 32, lineHeight: 36 }}>{tituloCuenta(lang)}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 16 }}>{subCuenta(lang)}</Text>
      </View>
      <CuentaForm lang={lang} ubicacion="cuenta" />
      <Pulsable
        onPress={() => {
          library.setPendiente(null);
          router.back();
        }}
        label={t.ahoraNo}
        style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 16 }}>{t.ahoraNo}</Text>
      </Pulsable>
    </ScrollView>
  );
}
