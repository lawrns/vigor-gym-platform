import Link from 'next/link';
import Image from 'next/image';

type Role = 'owner' | 'manager' | 'trainer' | 'staff' | 'member' | 'superadmin';

type NavLink = { href: string; label: string; roles?: Role[] };

export function Navbar({ logo = '/images/gogym.png', links = [], cta, userRole }: { logo?: string; links?: NavLink[]; cta?: { label: string; href: string }; userRole?: Role }) {
  const visibleLinks = links.filter((l) => !l.roles || (userRole && l.roles.includes(userRole)));
  return (
    <nav className="sticky top-0 z-40 bg-[var(--surface)]/80 supports-[backdrop-filter]:bg-[color:var(--surface)_/_70%] backdrop-blur-md text-text border-b border-[var(--outline)] shadow-[var(--shadow-card)]">
      <div className="max-w-6xl mx-auto h-[72px] flex items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image src={logo} alt="GoGym" width={120} height={40} className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 text-sm text-text/80">
            {visibleLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-text transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          {cta && (
            <Link data-cta="nav-cta" data-variant="primary" href={cta.href}>
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}


