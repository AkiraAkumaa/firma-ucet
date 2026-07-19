import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </Icon>
  )
}

export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 8.5a3 3 0 1 1 3.2 3M15 12.5a5 5 0 0 1 5.5 7" />
    </Icon>
  )
}

export function BrigadeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <path d="M2.8 19.5a5.2 5.2 0 0 1 10.4 0M10.8 19.5a5.2 5.2 0 0 1 10.4 0" />
    </Icon>
  )
}

export function SiteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V9l6-4 6 4v11" />
      <path d="M4 20h16M9 20v-5h4v5M9 12h.01M13 12h.01M9 9h.01M13 9h.01" />
    </Icon>
  )
}

export function PlusCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </Icon>
  )
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </Icon>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </Icon>
  )
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19V13M10 19V8M15 19v-4" />
      <circle cx="17.5" cy="6.5" r="3" />
      <path d="m19.8 8.8 2 2" />
    </Icon>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.6a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.7 7.7 0 0 0-2.6 1.5l-2.3-.6-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.6a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.7 7.7 0 0 0 2.6-1.5l2.3.6 2-3.4Z" />
    </Icon>
  )
}
