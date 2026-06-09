const PATHS: Record<string, string> = {
  dashboard: "M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  building: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v0M9 12v0M9 15v0M9 18v0",
  cycle: "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6",
  form: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h6",
  history: "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2",
  plus: "M12 5v14M5 12h14",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  chevron: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  arrowRight: "M5 12h14M13 5l7 7-7 7",
  star: "M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 16v-4M12 8h.01",
  trend: "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 13.9 7 22l5-3 5 3-1.2-8.1",
  warning: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M9.9 4.2A9.5 9.5 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.2 2.9M6.6 6.6A13 13 0 0 0 2 11s3.5 7 10 7a9.5 9.5 0 0 0 3.9-.8M3 3l18 18M9.5 9.5a3 3 0 0 0 4 4",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6",
  menu: "M3 6h18M3 12h18M3 18h18",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  shield: "M12 2l8 3v6c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V5z",
  shieldCheck: "M12 2l8 3v6c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V5zM9 12l2 2 4-4",
}

export type IconName = keyof typeof PATHS

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 18, className = '', style }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d={PATHS[name] || ''} />
    </svg>
  )
}
