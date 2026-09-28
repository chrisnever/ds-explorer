import { notFound } from "next/navigation";
import { components, screenBySlug, screens } from "@/explorer/registry";
import { loadSources } from "@/explorer/source";
import { Viewer } from "@/explorer/Viewer";

export function generateStaticParams() {
  return screens.flatMap((s) => s.components.map((c) => ({ screen: s.slug, component: c })));
}

export default async function ComponentPage(props: PageProps<"/[screen]/[component]">) {
  const { screen: screenSlug, component: slug } = await props.params;
  const screen = screenBySlug(screenSlug);
  const component = components[slug];
  if (!screen || !component || !screen.components.includes(slug)) notFound();

  const files = await loadSources([component.file, ...(component.deps ?? [])]);
  return <Viewer files={files} screen={screen.slug} component={component.slug} />;
}
