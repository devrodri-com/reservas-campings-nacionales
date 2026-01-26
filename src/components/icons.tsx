import React from "react";

type IconProps = {
  size?: number;
  className?: string;
  title?: string;
};

function baseProps(props: IconProps) {
  const size = props.size ?? 18;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": props.title ? undefined : true,
    role: props.title ? ("img" as const) : undefined,
  };
}

export function UsersIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M17 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M23 21v-1a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-2h8l2 2h3a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a6.5 6.5 0 1 0 9.8 9.8z" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v7H3V3h7" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  const p = baseProps(props);
  return (
    <svg {...p} className={props.className}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
