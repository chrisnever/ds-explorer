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

const c = (slug: string, name: string, description: string, deps?: string[]): ComponentMeta => ({
  slug,
  name,
  file: `src/ds/components/${name}.tsx`,
  description,
  deps,
});

// React Native components from the linked @nbk/ui package. Their demos come
// from the package's own `<Name>.stories.tsx` files (see ./renderers.tsx).
const nbk = (slug: string, name: string, description: string): ComponentMeta => ({
  slug,
  name,
  file: `node_modules/@nbk/ui/src/${name}/${name}.tsx`,
  description,
  deps: [`node_modules/@nbk/ui/src/${name}/${name}.stories.tsx`],
});

export const components: Record<string, ComponentMeta> = Object.fromEntries(
  [
    c("sheet-header", "SheetHeader", "Top row of a drawer or sheet with a pressable title and an icon action."),
    c("wallet-card", "WalletCard", "Card that flips to reveal details and freezes over when locked.", [
      "src/ds/components/FrostOverlay.tsx",
    ]),
    c("frost-overlay", "FrostOverlay", "WebGL shader that freezes a surface from the edges in, thinning toward the centre."),
    c("section-label", "SectionLabel", "Muted heading above a group, with an optional info affordance."),
    c("row-group", "RowGroup", "Rounded container for list rows, separated by inset hairlines."),
    c("copy-row", "CopyRow", "Label and value with a copy button; secret values stay masked until revealed."),
    c("action-row", "ActionRow", "Whole-row button leading to another destination."),
    c("toggle", "Toggle", "Switch whose knob stretches as it travels."),
    c("toggle-row", "ToggleRow", "Row with a trailing Toggle.", ["src/ds/components/Toggle.tsx"]),
    c("footnote", "Footnote", "Centred helper copy that explains the group above it."),
    c("avatar", "Avatar", "Initials on a tint that stays stable for each name."),
    c("amount-display", "AmountDisplay", "Large entry amount with springing digits and a rejection shake."),
    c("segmented-control", "SegmentedControl", "Pill switcher with a gliding thumb."),
    c("keypad", "Keypad", "Numeric entry pad with a press ripple."),
    c("button", "Button", "Full-width pill button with an elastic press."),
    c("transaction-row", "TransactionRow", "One line of account activity.", ["src/ds/components/Avatar.tsx"]),
    nbk("nbk-button", "Button", "Primary or secondary action, with disabled and loading states."),
    nbk("nbk-placeholder", "Placeholder", "Labelled block on the secondary background."),
  ].map((m) => [m.slug, m]),
);

export const screens: ScreenMeta[] = [
  {
    slug: "account-details",
    title: "Account details drawer",
    file: "src/ds/screens/AccountDetails.tsx",
    description: "Card, direct deposit and wire details with copy-to-clipboard.",
    components: [
      "sheet-header",
      "wallet-card",
      "frost-overlay",
      "toggle-row",
      "toggle",
      "action-row",
      "footnote",
      "section-label",
      "row-group",
      "copy-row",
    ],
  },
  {
    slug: "send-money",
    title: "Send money",
    file: "src/ds/screens/SendMoney.tsx",
    description: "Amount entry with a keypad, delivery speed and review.",
    components: ["sheet-header", "avatar", "amount-display", "segmented-control", "keypad", "button"],
  },
  {
    slug: "activity",
    title: "Activity",
    file: "src/ds/screens/Activity.tsx",
    description: "Filtered account activity, grouped by day.",
    components: ["sheet-header", "segmented-control", "section-label", "row-group", "transaction-row", "avatar"],
  },
  {
    slug: "nbk",
    title: "NBK components",
    description: "Every story from the linked @nbk/ui React Native library.",
    components: ["nbk-button", "nbk-placeholder"],
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
