import { Link, useLocation } from 'react-router-dom';
import { MapPin, BarChart3, GitCompareArrows } from 'lucide-react';

const links = [
  { to: '/map', label: 'Map', icon: MapPin },
  { to: '/analysis', label: 'Analytics', icon: BarChart3 },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
];

export default function NavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ─── Top Bar ─── */}
      <nav className="sticky top-0 z-[1000] bg-primary text-primary-foreground shadow-md">
        {/* Mobile: logo only | Desktop: logo + pill nav */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <img
              src="/images/LaoSence_Logo.jpeg"
              alt="LaoSence"
              className="h-8 w-8 rounded-lg object-cover md:h-9 md:w-9"
            />
            <span className="text-base font-bold tracking-wide md:text-lg">LaoSence</span>
          </Link>

          {/* Desktop pill nav */}
          <div className="hidden items-center gap-1 rounded-full bg-white/10 p-1 md:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop user avatar */}
          <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white md:flex" title="User">
            TK
          </div>

          {/* Mobile: empty spacer to keep logo left-aligned */}
          <div className="w-8 md:hidden" />
        </div>
      </nav>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <div className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                  active
                    ? 'text-teal-700'
                    : 'text-slate-400 active:text-slate-600'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-teal-600' : ''}`} />
                {link.label}
                {active && (
                  <span className="mt-0.5 h-1 w-5 rounded-full bg-teal-600" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
