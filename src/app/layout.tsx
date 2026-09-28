import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { NativeStyles } from "@/explorer/NativeStyles";
import { Shell } from "@/explorer/Shell";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-instrument-serif", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Component Explorer",
  description: "Explore design system components in the context of real mobile screens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}>
      <body>
        <NativeStyles>
          <Shell>{children}</Shell>
        </NativeStyles>
      </body>
    </html>
  );
}
