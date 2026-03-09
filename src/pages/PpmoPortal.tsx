import { useEffect } from 'react';

export default function PpmoPortal() {
  useEffect(() => {
    window.open('https://bolpatra.gov.np/egp/', '_blank');
  }, []);

  return (
    <div className="max-w-3xl mx-auto text-center py-16 space-y-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">
        🏛️ PPMO / e-GP Portal
      </h1>
      <p className="text-muted-foreground">
        bolpatra.gov.np नयाँ ट्याबमा खुलिरहेको छ...
      </p>
      <p className="text-sm text-muted-foreground">
        If the site didn't open, click below:
      </p>
      <a
        href="https://bolpatra.gov.np/egp/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        Open bolpatra.gov.np →
      </a>
    </div>
  );
}
