import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Globe, Loader2, ExternalLink, FileText, Users, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { firecrawlApi } from '@/lib/api/firecrawl';

interface TenderResult {
  title: string;
  url: string;
  description: string;
  markdown?: string;
}

export default function PpmoPortal() {
  const [activeTab, setActiveTab] = useState('tenders');

  // Tender state
  const [tenderQuery, setTenderQuery] = useState('');
  const [tenderResults, setTenderResults] = useState<TenderResult[]>([]);
  const [tenderLoading, setTenderLoading] = useState(false);

  // District rates state
  const [districtQuery, setDistrictQuery] = useState('');
  const [districtResults, setDistrictResults] = useState<TenderResult[]>([]);
  const [districtLoading, setDistrictLoading] = useState(false);

  // Contractor state
  const [contractorQuery, setContractorQuery] = useState('');
  const [contractorResults, setContractorResults] = useState<TenderResult[]>([]);
  const [contractorLoading, setContractorLoading] = useState(false);

  // Scraped detail
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);

  const searchTenders = async () => {
    if (!tenderQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    setTenderLoading(true);
    setTenderResults([]);
    try {
      const res = await firecrawlApi.search(
        `site:bolpatra.gov.np tender notice ${tenderQuery}`,
        { limit: 10, lang: 'en', country: 'np', scrapeOptions: { formats: ['markdown'] } }
      );
      if (res.success && res.data) {
        const results = (Array.isArray(res.data) ? res.data : []).map((r: any) => ({
          title: r.title || 'Untitled',
          url: r.url || '',
          description: r.description || '',
          markdown: r.markdown || '',
        }));
        setTenderResults(results);
        if (results.length === 0) toast.info('No tender notices found. Try a different query.');
      } else {
        toast.error(res.error || 'Failed to search tenders');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to search. Check Firecrawl connector.');
    } finally {
      setTenderLoading(false);
    }
  };

  const searchDistrictRates = async () => {
    if (!districtQuery.trim()) {
      toast.error('Please enter a district name');
      return;
    }
    setDistrictLoading(true);
    setDistrictResults([]);
    try {
      const res = await firecrawlApi.search(
        `site:bolpatra.gov.np district rate ${districtQuery} Nepal PPMO material rate`,
        { limit: 10, lang: 'en', country: 'np', scrapeOptions: { formats: ['markdown'] } }
      );
      if (res.success && res.data) {
        const results = (Array.isArray(res.data) ? res.data : []).map((r: any) => ({
          title: r.title || 'Untitled',
          url: r.url || '',
          description: r.description || '',
          markdown: r.markdown || '',
        }));
        setDistrictResults(results);
        if (results.length === 0) toast.info('No district rates found. Try different keywords.');
      } else {
        toast.error(res.error || 'Failed to search district rates');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to search. Check Firecrawl connector.');
    } finally {
      setDistrictLoading(false);
    }
  };

  const searchContractors = async () => {
    if (!contractorQuery.trim()) {
      toast.error('Please enter contractor name or category');
      return;
    }
    setContractorLoading(true);
    setContractorResults([]);
    try {
      const res = await firecrawlApi.search(
        `site:bolpatra.gov.np contractor ${contractorQuery} registered Nepal`,
        { limit: 10, lang: 'en', country: 'np', scrapeOptions: { formats: ['markdown'] } }
      );
      if (res.success && res.data) {
        const results = (Array.isArray(res.data) ? res.data : []).map((r: any) => ({
          title: r.title || 'Untitled',
          url: r.url || '',
          description: r.description || '',
          markdown: r.markdown || '',
        }));
        setContractorResults(results);
        if (results.length === 0) toast.info('No contractor info found. Try different keywords.');
      } else {
        toast.error(res.error || 'Failed to search contractors');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to search. Check Firecrawl connector.');
    } finally {
      setContractorLoading(false);
    }
  };

  const scrapeDetail = async (url: string) => {
    setScrapeLoading(true);
    setScrapedContent(null);
    try {
      const res = await firecrawlApi.scrape(url, {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      });
      const md = res?.data?.markdown || (res as any)?.markdown || '';
      if (md) {
        setScrapedContent(md);
      } else {
        toast.error('Could not extract content from this page');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to scrape page detail');
    } finally {
      setScrapeLoading(false);
    }
  };

  const ResultCard = ({ result, onScrape }: { result: TenderResult; onScrape: (url: string) => void }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2">{result.title}</h3>
            {result.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
            )}
            {result.url && (
              <p className="text-xs text-primary/70 mt-1 truncate">{result.url}</p>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {result.url && (
              <>
                <Button size="sm" variant="outline" onClick={() => onScrape(result.url)} className="text-xs">
                  <FileText className="h-3 w-3 mr-1" /> View
                </Button>
                <Button size="sm" variant="ghost" asChild className="text-xs">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
        {result.markdown && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs max-h-32 overflow-auto whitespace-pre-wrap">
            {result.markdown.slice(0, 500)}
            {result.markdown.length > 500 && '...'}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          🏛️ PPMO / e-GP Portal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          बोलपत्र सूचना, जिल्ला दररेट, र ठेकेदार जानकारी — bolpatra.gov.np बाट
        </p>
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-3 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-warning shrink-0" />
          <span>
            Data is scraped live from bolpatra.gov.np. Results depend on current site availability and content structure.
            For official submissions, always verify from the original source.
          </span>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tenders" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Tender Notices
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> District Rates
          </TabsTrigger>
          <TabsTrigger value="contractors" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Contractors
          </TabsTrigger>
        </TabsList>

        {/* ─── TENDER NOTICES ─── */}
        <TabsContent value="tenders" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Search Tender Notices</CardTitle>
              <CardDescription>Search published tender notices from e-GP / bolpatra.gov.np</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. road construction Kathmandu, bridge Pokhara..."
                  value={tenderQuery}
                  onChange={(e) => setTenderQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTenders()}
                />
                <Button onClick={searchTenders} disabled={tenderLoading}>
                  {tenderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-1.5">Search</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {tenderResults.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Found {tenderResults.length} result(s)
              </p>
              {tenderResults.map((r, i) => (
                <ResultCard key={i} result={r} onScrape={scrapeDetail} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── DISTRICT RATES ─── */}
        <TabsContent value="rates" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">District Material Rates</CardTitle>
              <CardDescription>Search PPMO/DoR published district-wise material and labor rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Kathmandu, Lalitpur, Chitwan..."
                  value={districtQuery}
                  onChange={(e) => setDistrictQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchDistrictRates()}
                />
                <Button onClick={searchDistrictRates} disabled={districtLoading}>
                  {districtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-1.5">Search</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {districtResults.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Found {districtResults.length} result(s)
              </p>
              {districtResults.map((r, i) => (
                <ResultCard key={i} result={r} onScrape={scrapeDetail} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── CONTRACTORS ─── */}
        <TabsContent value="contractors" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contractor Lookup</CardTitle>
              <CardDescription>Search registered contractor details, categories, and capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Class A road, ABC Construction..."
                  value={contractorQuery}
                  onChange={(e) => setContractorQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchContractors()}
                />
                <Button onClick={searchContractors} disabled={contractorLoading}>
                  {contractorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-1.5">Search</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {contractorResults.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Found {contractorResults.length} result(s)
              </p>
              {contractorResults.map((r, i) => (
                <ResultCard key={i} result={r} onScrape={scrapeDetail} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── SCRAPED DETAIL PANEL ─── */}
      {(scrapeLoading || scrapedContent) && (
        <>
          <Separator />
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Page Detail</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setScrapedContent(null)}>Close</Button>
            </CardHeader>
            <CardContent>
              {scrapeLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Extracting page content...</span>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {scrapedContent}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
