"use client";

import { useRef, type ReactNode } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleSheet } from "react-native";

type WebStyleSheet = typeof StyleSheet & { getSheet(): { id: string; textContent: string } };

/**
 * Flushes the styles react-native-web generated during server rendering into
 * the HTML, so React Native components don't flash unstyled before hydration.
 */
export function NativeStyles({ children }: { children: ReactNode }) {
  // Called once per streamed chunk; skip chunks that added no new styles.
  const flushed = useRef("");
  useServerInsertedHTML(() => {
    const sheet = (StyleSheet as WebStyleSheet).getSheet();
    if (sheet.textContent === flushed.current) return null;
    flushed.current = sheet.textContent;
    return <style id={sheet.id} dangerouslySetInnerHTML={{ __html: sheet.textContent }} />;
  });
  return children;
}
