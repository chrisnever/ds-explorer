import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
    <path d="M10.5 3.2A1.8 1.8 0 0 0 8.8 2H4.3A2.3 2.3 0 0 0 2 4.3v4.5a1.8 1.8 0 0 0 1.2 1.7" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8Z" />
    <circle cx="8" cy="8" r="1.9" />
  </Icon>
);

export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.4 4a6 6 0 0 1 1.6-.2c4 0 6.2 4.2 6.2 4.2a10 10 0 0 1-1.6 2.1M4.3 5.1A10 10 0 0 0 1.8 8S4 12.2 8 12.2a6 6 0 0 0 3-.8" />
    <path d="M6.7 6.7a1.9 1.9 0 0 0 2.6 2.6M2.5 2.5l11 11" />
  </Icon>
);

export const InfoIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 7.3v3.6" />
    <circle cx="8" cy="5.1" r=".45" fill="currentColor" stroke="none" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.2 11.5H4.6a3 3 0 0 1-.4-6 4 4 0 0 1 7.6 0 3 3 0 0 1-.4 6h-.6" />
    <path d="M8 13.5V8m-2 2 2-2 2 2" />
  </Icon>
);

export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 2.8h4.2V7M13 3 7.5 8.5M11.5 9.8v2A1.7 1.7 0 0 1 9.8 13.5H4.2a1.7 1.7 0 0 1-1.7-1.7V6.2a1.7 1.7 0 0 1 1.7-1.7h2" />
  </Icon>
);

export const PanelIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="3" width="12" height="10" rx="2.2" />
    <path d="M10 3.3v9.4" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 3 5 8l5 5" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 3 5 5-5 5" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
);

export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="10" height="7" rx="1.8" />
    <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" />
  </Icon>
);

export const BackspaceIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.3 3.5h7.4A1.8 1.8 0 0 1 14.5 5.3v5.4a1.8 1.8 0 0 1-1.8 1.8H5.3L1.5 8Z" />
    <path d="m7.5 6.2 3.6 3.6m0-3.6-3.6 3.6" />
  </Icon>
);

export const ArrowDownLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4 4.5 11.5M4.5 5.5v6h6" />
  </Icon>
);

export const ArrowUpRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12 11.5 4.5M5.5 4.5h6v6" />
  </Icon>
);

export const ContactlessIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5.2a4 4 0 0 1 0 5.6M7.6 3.6a6.3 6.3 0 0 1 0 8.8M10.2 2a8.6 8.6 0 0 1 0 12" />
  </Icon>
);
