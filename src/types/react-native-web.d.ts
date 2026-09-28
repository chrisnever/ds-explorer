// Web-only props that react-native-web accepts but React Native's types omit.
import "react-native";

declare module "react-native" {
  interface ViewProps {
    /** Rendered as `data-*` attributes, e.g. `dataSet={{ ds: "button" }}` → `data-ds="button"`. */
    dataSet?: Record<string, string>;
  }
}
