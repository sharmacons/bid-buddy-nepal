import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FilePlus,
  FileText,
  ClipboardList,
  FolderArchive,
  FileSearch,
  Upload,
  Calculator,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', labelNe: 'ड्यासबोर्ड', icon: LayoutDashboard },
  { to: '/company', label: 'Company Profile', labelNe: 'कम्पनी प्रोफाइल', icon: Building2 },
  { to: '/bid/new', label: 'New Bid', labelNe: 'नयाँ बोलपत्र', icon: FilePlus },
  { to: '/analyze', label: 'Analyze Document', labelNe: 'कागजात विश्लेषण', icon: FileSearch },
  { to: '/boq-wizard', label: 'BoQ Wizard', labelNe: 'BoQ विजार्ड', icon: Upload },
  { to: '/rate-analysis', label: 'Rate Analysis', labelNe: 'दर विश्लेषण', icon: Calculator },
  { to: '/cash-flow', label: 'Cash Flow', labelNe: 'नगद प्रवाह', icon: TrendingUp },
  { to: '/ppmo', label: 'PPMO / e-GP', labelNe: 'PPMO / ई-जीपी', icon: Globe },
  { to: '/templates', label: 'Templates', labelNe: 'नमुनाहरू', icon: FileText },
  { to: '/tracker', label: 'Bid Tracker', labelNe: 'बोलपत्र ट्र्याकर', icon: ClipboardList },
  { to: '/documents', label: 'Documents', labelNe: 'कागजातहरू', icon: FolderArchive },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold font-heading tracking-tight">
          🏗️ BidReady Nepal
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">बोलपत्र तयारी सहायक</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/40">
        PPMO Standard Bidding Documents
      </div>
    </aside>
  );
}
