import type { SVGProps } from "react";

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const InteractIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M7 7.2 13 9.4l-2.6 1.1L9.3 13Z" fill="currentColor" />
    <path d="M5.2 2v1.6M2 5.2h1.6M2.9 2.9 4 4M7.5 2.9 6.4 4M2.9 7.5 4 6.4" />
  </svg>
);

export const InspectIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M2.5 5.5v-2a1 1 0 0 1 1-1h2M10.5 2.5h2a1 1 0 0 1 1 1v2M13.5 10.5v2a1 1 0 0 1-1 1h-2M5.5 13.5h-2a1 1 0 0 1-1-1v-2" />
    <rect x="5.5" y="5.5" width="5" height="5" rx="1" />
  </svg>
);

export const CodeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 5 3 8l3 3M10 5l3 3-3 3" />
  </svg>
);

export const CommentIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M8 2.5c3.1 0 5.5 2.1 5.5 4.8S11.1 12 8 12c-.6 0-1.2-.1-1.7-.2L3 13.3l.9-2.6C3 9.8 2.5 8.6 2.5 7.3 2.5 4.6 4.9 2.5 8 2.5Z" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const BackIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M10 3 5 8l5 5" />
  </svg>
);

export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M9 2H5a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 5 14h6a1.5 1.5 0 0 0 1.5-1.5V5.5Z" />
    <path d="M8 7v4.5m-1.8-1.8L8 11.5l1.8-1.8" />
  </svg>
);

export const DuplicateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
    <path d="M10.5 3.2A1.8 1.8 0 0 0 8.8 2H4.3A2.3 2.3 0 0 0 2 4.3v4.5a1.8 1.8 0 0 0 1.2 1.7" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </svg>
);
