export type IconName =
  | 'Dumbbell'
  | 'Brain'
  | 'CalendarCheck2'
  | 'CreditCard'
  | 'ShieldCheck'
  | 'Smartphone'
  | 'Sun'
  | 'Moon'
  | 'MapPin'
  | 'Users'
  | 'Clock3'
  | 'Activity'
  | 'TrendingUp'
  | 'TimerReset'
  | 'Wallet'
  | 'FileDigit'
  | 'Banknote'
  | 'MessageSquare'
  | 'Brackets'
  | 'GraduationCap'
  | 'Building2'
  | 'Check'
  | 'Edit'
  | 'Trash'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'Plus'
  | 'Search'
  | 'Upload'
  | 'X'
  | 'AlertCircle'
  | 'CheckCircle';

type SvgProps = React.SVGProps<SVGSVGElement> & { title?: string };

const Svg = (p: SvgProps & { children: React.ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden={p.title ? undefined : true} {...p}>
    {p.title ? <title>{p.title}</title> : null}
    {p.children}
  </svg>
);

export const Icons: Record<IconName, (props: SvgProps) => JSX.Element> = {
  Sun: (props) => (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </Svg>
  ),
  Moon: (props) => (
    <Svg {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Svg>
  ),
  Dumbbell: (props) => (
    <Svg {...props}>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
      <path d="m21.5 21.5-1.4-1.4" />
      <path d="M3.9 3.9 2.5 2.5" />
      <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
    </Svg>
  ),
  Check: (props) => (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  ),
  Brain: (props) => (
    <Svg {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </Svg>
  ),
  CreditCard: (props) => (
    <Svg {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </Svg>
  ),
  ShieldCheck: (props) => (
    <Svg {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  MapPin: (props) => (
    <Svg {...props}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  ),
  Users: (props) => (
    <Svg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  ),
  Clock3: (props) => (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16.5 12" />
    </Svg>
  ),
  Activity: (props) => (
    <Svg {...props}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </Svg>
  ),
  TrendingUp: (props) => (
    <Svg {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </Svg>
  ),
  TimerReset: (props) => (
    <Svg {...props}>
      <path d="M10 2h4" />
      <path d="M12 14v-4" />
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </Svg>
  ),
  Wallet: (props) => (
    <Svg {...props}>
      <path d="M20 12v4a2 2 0 0 1-2 2H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h12a2 2 0 0 1 2 2Z" />
      <path d="M18 12h2v4h-2a2 2 0 1 1 0-4Z" />
    </Svg>
  ),
  FileDigit: (props) => (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M10 13h1v3" />
      <path d="M10 17h2" />
    </Svg>
  ),
  Banknote: (props) => (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  ),
  MessageSquare: (props) => (
    <Svg {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </Svg>
  ),
  Brackets: (props) => (
    <Svg {...props}>
      <path d="M6 4H4v16h2" />
      <path d="M18 4h2v16h-2" />
    </Svg>
  ),
  GraduationCap: (props) => (
    <Svg {...props}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0Z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </Svg>
  ),
  Smartphone: (props) => (
    <Svg {...props}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 18h.01" />
    </Svg>
  ),
  CalendarCheck2: (props) => (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </Svg>
  ),
  Building2: (props) => (
    <Svg {...props}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </Svg>
  ),
  Edit: (props) => (
    <Svg {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  ),
  Trash: (props) => (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </Svg>
  ),
  ChevronLeft: (props) => (
    <Svg {...props}>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  ),
  ChevronRight: (props) => (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  ),
  Plus: (props) => (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m12 5v14" />
    </Svg>
  ),
  Search: (props) => (
    <Svg {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </Svg>
  ),
  Upload: (props) => (
    <Svg {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,5 17,10" />
      <line x1="12" x2="12" y1="5" y2="15" />
    </Svg>
  ),
  X: (props) => (
    <Svg {...props}>
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </Svg>
  ),
  AlertCircle: (props) => (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </Svg>
  ),
  CheckCircle: (props) => (
    <Svg {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </Svg>
  )
};

export function getIcon(name: IconName) {
  return Icons[name];
}


