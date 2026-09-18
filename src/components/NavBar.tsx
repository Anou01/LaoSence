import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, MapPin, BarChart3, GitCompareArrows, Bell } from 'lucide-react';

const links = [
  { to: '/map', label: 'Map', icon: MapPin },
  { to: '/analysis', label: 'Analytics', icon: BarChart3 },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-[1000] bg-primary px-4 py-1.5 text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <img
            src="/images/LaoSence_Logo.jpeg"
            alt="LaoSence"
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="text-lg font-bold tracking-wide">LaoSence</span>
        </Link>

        {/* Desktop Nav */}
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

        {/* Right */}
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Notifications" className="hidden h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white md:flex">
            <Bell className="h-4 w-4" />
          </button>
          <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white md:flex" title="User">
            TK
          </div>
          <button type="button" aria-label="Toggle menu" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 flex flex-col gap-1 border-t border-white/15 pt-3 pb-2 md:hidden">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
