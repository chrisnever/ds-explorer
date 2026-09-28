// What `import … from "react-native"` resolves to (see next.config.ts):
// react-native-web, with the colour scheme owned by the explorer instead of
// the OS. Following the OS would render light on the server and dark in a
// dark-mode browser, and the explorer's surfaces are light either way.

export * from "react-native-web";

export function useColorScheme(): "light" | "dark" {
  return "light";
}
