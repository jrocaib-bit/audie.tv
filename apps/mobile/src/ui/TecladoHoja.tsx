import { type ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Desplazamiento extra en iOS (modales suelen ir a 0). */
  offset?: number;
};

/** Sube el contenido cuando aparece el teclado y lo cierra al tocar fuera. */
export function TecladoHoja({ children, style, contentContainerStyle, offset = 0 }: Props) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={[{ flexGrow: 1 }, contentContainerStyle]} onPress={Keyboard.dismiss} accessible={false}>
          {children}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
