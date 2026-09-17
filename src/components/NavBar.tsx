import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { to: '/map', label: 'Map' },
  { to: '/analysis', label: 'Analytics' },
  { to: '/compare', label: 'Compare' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  return <nav className="sticky top-0 z-[1000] border-b border-teal-900/20 bg-primary px-6 py-3 text-primary-foreground shadow-sm">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <Link to="/" className="font-bold tracking-wide" onClick={() => setOpen(false)}>
        <span className="block text-xl">LaoSence</span>
        <span className="block text-xs font-normal opacity-90">Urban Wireless Intelligence Platform</span>
      </Link>
      <div className="hidden gap-8 font-medium md:flex">
        {links.map(link => <Link key={link.to} to={link.to} className="hover:underline">{link.label}</Link>)}
      </div>
      <button type="button" aria-label="Toggle menu" className="md:hidden" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
    </div>
    {open && <div className="mt-3 flex flex-col gap-3 border-t border-white/20 pt-3 md:hidden">
      {links.map(link => <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>)}
    </div>}
  </nav>;
}
