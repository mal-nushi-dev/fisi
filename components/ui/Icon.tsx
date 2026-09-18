import type { ReactNode } from "react";

const paths = {
  "arrow-right": <path d="M4 12h16m-7-7 7 7-7 7" />,
  "arrow-left": <path d="M20 12H4m7 7-7-7 7-7" />,
  search: <><circle cx="10.75" cy="10.75" r="7.25" /><path d="m16 16 5 5" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  expand: <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />,
  tree: <><path d="M12 8v4M5 16v-4h14v4" /><rect x="9" y="3" width="6" height="5" /><rect x="2" y="16" width="6" height="5" /><rect x="16" y="16" width="6" height="5" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
