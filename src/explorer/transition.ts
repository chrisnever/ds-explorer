// Hand-off between routes for the drill-in animation. Lives at module
// scope so it survives client-side navigation.

export type DrillFrom = { slug: string; rect: { x: number; y: number; width: number; height: number } };

let pending: DrillFrom | null = null;

export function setDrillFrom(from: DrillFrom) {
  pending = from;
}

/** Returns and clears the pending drill origin if it matches this slug. */
export function takeDrillFrom(slug: string): DrillFrom | null {
  const from = pending;
  pending = null;
  return from?.slug === slug ? from : null;
}
