import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, ExternalLink, ArrowLeft, ArrowRight, RotateCw, Home } from 'lucide-react';

const DEFAULT_URL = 'https://bolpatra.gov.np/egp/';
const USEFUL_LINKS = [
  { label: 'e-GP Home', url: 'https://bolpatra.gov.np/egp/' },
  { label: 'Tender Notices', url: 'https://bolpatra.gov.np/egp/searchOpportunity' },
  { label: 'PPMO', url: 'https://ppmo.gov.np/' },
  { label: 'DoR Norms', url: 'https://dor.gov.np/' },
];

export default function PpmoPortal() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [key, setKey] = useState(0);

  const navigate = (url: string) => {
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    setCurrentUrl(formatted);
    setInputUrl(formatted);
    setKey(k => k + 1);
  };

  const refresh = () => setKey(k => k + 1);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Browser toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.history.back()} title="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.history.forward()} title="Forward">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={refresh} title="Refresh">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(DEFAULT_URL)} title="Home">
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center gap-1.5 bg-background border border-border rounded-md px-2 h-8">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            className="border-0 h-7 text-xs bg-transparent focus-visible:ring-0 px-0"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(inputUrl); }}
            placeholder="Enter URL..."
          />
        </div>

        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => window.open(currentUrl, '_blank')}>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b border-border shrink-0 overflow-x-auto">
        {USEFUL_LINKS.map((link) => (
          <Button
            key={link.url}
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 shrink-0"
            onClick={() => navigate(link.url)}
          >
            {link.label}
          </Button>
        ))}
      </div>

      {/* Iframe */}
      <div className="flex-1 relative bg-background">
        <iframe
          key={key}
          src={currentUrl}
          className="w-full h-full border-0"
          title="PPMO / e-GP Portal"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          referrerPolicy="no-referrer"
        />
        {/* Fallback message if iframe blocked */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/95 border border-border rounded-xl p-8 text-center shadow-lg pointer-events-auto hidden" id="iframe-fallback">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-2">Site may not load in embedded view</p>
            <p className="text-xs text-muted-foreground mb-4">Some government sites block embedding. Click below to open directly.</p>
            <Button onClick={() => window.open(currentUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
