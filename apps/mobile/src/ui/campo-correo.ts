import type { TextInputProps } from "react-native";

/** Para que iOS trate el campo como correo y sugiera la dirección. */
export const propsCampoCorreo: Pick<
  TextInputProps,
  | "keyboardType"
  | "textContentType"
  | "autoComplete"
  | "autoCapitalize"
  | "autoCorrect"
  | "spellCheck"
  | "inputMode"
> = {
  keyboardType: "email-address",
  textContentType: "emailAddress",
  autoComplete: "email",
  autoCapitalize: "none",
  autoCorrect: false,
  spellCheck: false,
  inputMode: "email",
};
