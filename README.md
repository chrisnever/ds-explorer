# Component Explorer

Explore design system components in the context of real mobile screens.

- **Explorer:** every screen as a live, scaled-down phone.
- **Screen:** use it live, switch to **Inspect** to outline and pick any component, or flip to **Code** to read the source of the screen and every component it uses.
- **Component:** the component on its own as a working demo, with its code, reached through breadcrumbs (Explorer / Screen / Component).

Built with Next.js, React, Tailwind and GSAP. The code view reads the real `.tsx` files at build time and highlights them with Shiki. The locked-card frost is a WebGL shader ([FrostOverlay.tsx](src/ds/components/FrostOverlay.tsx)).

## Run it

```bash
npm install
npm run dev
```

Shortcuts: `1` interact, `2` inspect, `3` code, `Esc` up one level.

## Layout

- `src/ds/components/` — design system components. Each root carries `data-ds="<slug>"`, which is how Inspect finds them.
- `src/ds/screens/` — screens composed from those components.
- `src/explorer/registry.ts` — screen and component metadata.
- `src/explorer/renderers.tsx` — maps slugs to screens and isolated demos.

To add a component: create it in `src/ds/components/`, add an entry in `registry.ts`, and add a demo in `renderers.tsx`.

## Static export

`npm run build:sites` exports a static build to `out/` with a base path of `/chris-robinson/ds-explorer` for sites.metalab.com. Change `SITES_BASE_PATH` in `package.json` to host it elsewhere.
