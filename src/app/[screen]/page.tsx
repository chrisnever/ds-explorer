import { notFound } from "next/navigation";
import { components, screenBySlug, screens } from "@/explorer/registry";
import { loadSources } from "@/explorer/source";
import { Viewer } from "@/explorer/Viewer";

export function generateStaticParams() {
  return screens.map((s) => ({ screen: s.slug }));
}

export default async function ScreenPage(props: PageProps<"/[screen]">) {
  const { screen: slug } = await props.params;
  const screen = screenBySlug(slug);
  if (!screen) notFound();

  const files = await loadSources([screen.file, ...screen.components.map((c) => components[c].file)]);
  return <Viewer files={files} screen={screen.slug} />;
}
