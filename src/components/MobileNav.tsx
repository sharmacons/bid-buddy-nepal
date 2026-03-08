import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FilePlus,
  ClipboardList,
  FolderArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/company', icon: Building2, label: 'Company' },
  { to: '/bid/new', icon: FilePlus, label: 'New Bid' },
  { to: '/tracker', icon: ClipboardList, label: 'Tracker' },
  { to: '/documents', icon: FolderArchive, label: 'Docs' },
];

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-2">
      {ITEMS.map((item) => {
        const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded-md transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
