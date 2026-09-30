import { Suspense } from "react";
import { components } from "@/explorer/registry";
import { ScreenBuilder } from "@/explorer/ScreenBuilder";
import { loadSources } from "@/explorer/source";

// One static route for every draft: they live in the browser, so their ids
// are only known at runtime and ride in `?id=` rather than the path. Any
// component could end up in a draft, so every component's source comes along.
export default async function DraftPage() {
  const sources = await loadSources(Object.values(components).map((c) => c.file));
  return (
    <Suspense>
      <ScreenBuilder sources={sources} />
    </Suspense>
  );
}
