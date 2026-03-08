import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBids } from '@/lib/storage';
import { BID_TYPE_LABELS, BID_STATUS_LABELS } from '@/lib/types';
import { ClipboardList, AlertTriangle, Clock } from 'lucide-react';

export default function BidTracker() {
  const bids = useMemo(() => getBids(), []);

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function bidProgress(checklist: { completed: boolean }[]) {
    if (!checklist.length) return 0;
    return Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 100);
  }

  const statusColor: Record<string, string> = {
    preparing: 'bg-warning/15 text-warning border-warning/30',
    submitted: 'bg-info/15 text-info border-info/30',
    won: 'bg-success/15 text-success border-success/30',
    lost: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Bid Tracker</h1>
          <p className="text-sm text-muted-foreground">बोलपत्र ट्र्याकर — All your bids at a glance</p>
        </div>
      </div>

      {bids.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No bids yet. Create your first bid from the Dashboard.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bids
            .sort((a, b) => new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime())
            .map((bid) => {
              const days = daysUntil(bid.submissionDeadline);
              const progress = bidProgress(bid.checklist);
              return (
                <Link key={bid.id} to={`/bid/${bid.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{bid.projectName}</p>
                          <p className="text-sm text-muted-foreground">{bid.employer}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{BID_TYPE_LABELS[bid.bidType]}</Badge>
                            <Badge className={`text-xs border ${statusColor[bid.status]}`}>
                              {BID_STATUS_LABELS[bid.status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          {bid.status === 'preparing' && (
                            <div className={`flex items-center gap-1 text-sm ${days <= 3 ? 'text-destructive font-semibold' : days <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                              {days <= 3 ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                              {days > 0 ? `${days}d left` : 'Overdue!'}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Deadline: {new Date(bid.submissionDeadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground w-10 text-right">{progress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
