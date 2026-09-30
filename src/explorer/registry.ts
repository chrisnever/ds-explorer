// Plain data describing every screen and component. Safe to import from
// both server and client code — renderers live in ./renderers.tsx.

export type ComponentMeta = {
  slug: string;
  name: string;
  file: string;
  description: string;
  /** Other DS files whose source is worth showing alongside this one. */
  deps?: string[];
};

export type ScreenMeta = {
  slug: string;
  title: string;
  /** Omitted for library galleries, which only show their components' source. */
  file?: string;
  description: string;
  components: string[];
};

export const c = (slug: string, name: string, description: string, deps?: string[]): ComponentMeta => ({
  slug,
  name,
  file: `src/ds/components/${name}.tsx`,
  description,
  deps,
});

// React Native components from the linked @nbk/ui package. Their demos come
// from the package's own `<Name>.stories.tsx` files (see ./renderers.tsx).
// `dir` is the component's folder, when it shares one (ListItem lives in List).
const nbk = (slug: string, name: string, description: string, dir = name): ComponentMeta => ({
  slug,
  name,
  file: `node_modules/@nbk/ui/src/${dir}/${name}.tsx`,
  description,
  deps: [`node_modules/@nbk/ui/src/${dir}/${name}.stories.tsx`],
});

// The local DS files under src/ds are still on disk, just not registered in
// this version. Add entries with c(...) to bring them back.
export const components: Record<string, ComponentMeta> = Object.fromEntries(
  [
    nbk("nbk-list", "List", "Vertical list of rows that sets density and dividers for its items."),
    nbk("nbk-list-item", "ListItem", "One row: leading visual, title and subtitle, trailing amount.", "List"),
  ].map((m) => [m.slug, m]),
);

export const screens: ScreenMeta[] = [
  {
    slug: "nbk",
    title: "NBK components",
    description: "Every story from the linked @nbk/ui React Native library.",
    components: ["nbk-list", "nbk-list-item"],
  },
];

export const screenBySlug = (slug: string) => screens.find((s) => s.slug === slug);

export type Crumb = { label: string; href: string };

/** Breadcrumb trail for a pathname: Explorer / Screen / Component. */
export function crumbsFor(pathname: string): Crumb[] {
  const [screenSlug, componentSlug] = pathname.split("/").filter(Boolean);
  const trail: Crumb[] = [{ label: "Explorer", href: "/" }];
  const screen = screenSlug ? screenBySlug(screenSlug) : undefined;
  if (!screen) return trail;
  trail.push({ label: screen.title, href: `/${screen.slug}` });
  const component = componentSlug ? components[componentSlug] : undefined;
  if (component) trail.push({ label: component.name, href: `/${screen.slug}/${component.slug}` });
  return trail;
}
