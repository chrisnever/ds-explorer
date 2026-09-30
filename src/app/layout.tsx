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
      <head>
        {/*
          NBK's typography tokens name their face literally ("DM Sans"), and
          react-native-web passes that name straight to CSS. next/font renames
          the families it hosts, so NBK's fonts load from Google Fonts under
          their real names instead. Weights are the tokens' regular and bold.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- see above: next/font can't keep the family name */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap" />
      </head>
      <body>
        <NativeStyles>
          <Shell>{children}</Shell>
        </NativeStyles>
      </body>
    </html>
  );
}
