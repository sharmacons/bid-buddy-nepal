import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBids, getCompanyProfile, downloadBackup, restoreBackup, clearAllData, clearBidsAndDocuments } from '@/lib/storage';
import { BID_TYPE_LABELS, BID_STATUS_LABELS, BidData } from '@/lib/types';
import { FilePlus, AlertTriangle, CheckCircle2, Clock, Building2, Download, Upload, Trash2, RotateCcw, Shield } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function bidProgress(bid: BidData) {
  if (!bid.checklist.length) return 0;
  return Math.round((bid.checklist.filter((c) => c.completed).length / bid.checklist.length) * 100);
}

export default function Dashboard() {
  const bids = useMemo(() => getBids(), []);
  const profile = useMemo(() => getCompanyProfile(), []);
  const activeBids = bids.filter((b) => b.status === 'preparing');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    downloadBackup();
    toast.success('Backup downloaded!', { description: 'Save this file safely to restore your data later.' });
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await restoreBackup(file);
    if (result.success) {
      toast.success('Backup restored!', { description: result.message });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Restore failed', { description: result.message });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success('All data cleared!', { description: 'Starting fresh. Page will reload...' });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleNewTender = () => {
    clearBidsAndDocuments();
    toast.success('Bid data cleared!', { description: 'Company profile kept. Ready for new tender. Reloading...' });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">BidReady Nepal</h1>
        <p className="text-muted-foreground mt-1">बोलपत्र तयारी ड्यासबोर्ड</p>
      </div>

      {!profile && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Set up your company profile first</p>
              <p className="text-xs text-muted-foreground">Your details will auto-fill bid templates</p>
            </div>
            <Button asChild size="sm">
              <Link to="/company">Set Up</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick start */}
      <section>
        <h2 className="text-lg font-semibold font-heading mb-3">Start New Bid</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['ncb-single', 'ncb-double', 'sealed-quotation', 'icb'] as const).map((type) => (
            <Link key={type} to={`/bid/new?type=${type}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <FilePlus className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium leading-tight">{BID_TYPE_LABELS[type]}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Active Bids */}
      <section>
        <h2 className="text-lg font-semibold font-heading mb-3">
          Active Bids ({activeBids.length})
        </h2>
        {activeBids.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No active bids yet. Start preparing a new bid above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeBids.map((bid) => {
              const days = daysUntil(bid.submissionDeadline);
              const progress = bidProgress(bid);
              return (
                <Link key={bid.id} to={`/bid/${bid.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{bid.projectName}</p>
                          <p className="text-sm text-muted-foreground">{bid.employer}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {BID_TYPE_LABELS[bid.bidType]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {BID_STATUS_LABELS[bid.status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <div className={`flex items-center gap-1 text-sm ${days <= 3 ? 'text-destructive font-semibold' : days <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {days <= 3 ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            {days > 0 ? `${days} days left` : 'Overdue!'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            {progress}% ready
                          </div>
                        </div>
                      </div>
                      <Progress value={progress} className="mt-3 h-2" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bids', value: bids.length },
          { label: 'Preparing', value: bids.filter((b) => b.status === 'preparing').length },
          { label: 'Submitted', value: bids.filter((b) => b.status === 'submitted').length },
          { label: 'Won', value: bids.filter((b) => b.status === 'won').length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Data Management ═══ */}
      <section>
        <h2 className="text-lg font-semibold font-heading mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Data Management
        </h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Backup & Restore */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="gap-2 flex-1" onClick={handleBackup}>
                <Download className="h-4 w-4" />
                Backup All Data (.json)
              </Button>
              <Button variant="outline" className="gap-2 flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Restore from Backup
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleRestore}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Always backup before starting a new tender. Your backup includes company profile, all bids, documents, and custom rate analysis norms.
            </p>

            {/* New Tender / Clear */}
            <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1 border-accent text-accent-foreground">
                    <RotateCcw className="h-4 w-4" />
                    New Tender (Keep Profile)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start New Tender?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all bids, documents, and custom norms but <strong>keep your company profile</strong>.
                      Make sure to backup first!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleNewTender}>Clear & Start Fresh</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 flex-1">
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear ALL Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <strong>everything</strong> — company profile, all bids, documents, and custom norms.
                      This action cannot be undone. Please backup first!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
