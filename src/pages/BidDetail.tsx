import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBids, saveBid, deleteBid, getCompanyProfile } from '@/lib/storage';
import { BID_TYPE_LABELS, BID_STATUS_LABELS, BidData, BidStatus, BOQItem } from '@/lib/types';
import { letterOfBidTemplate, bidSecurityTemplate, powerOfAttorneyTemplate } from '@/lib/templates';
import { toast } from 'sonner';
import { Trash2, Save, FileText, CheckCircle2 } from 'lucide-react';

export default function BidDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bid, setBid] = useState<BidData | null>(null);

  useEffect(() => {
    const found = getBids().find((b) => b.id === id);
    if (found) setBid(found);
    else navigate('/');
  }, [id, navigate]);

  const save = useCallback((updated: BidData) => {
    setBid(updated);
    saveBid(updated);
  }, []);

  if (!bid) return null;

  const profile = getCompanyProfile();
  const progress = bid.checklist.length
    ? Math.round((bid.checklist.filter((c) => c.completed).length / bid.checklist.length) * 100)
    : 0;

  const technicalItems = bid.checklist.filter((c) => c.envelope === 'technical');
  const financialItems = bid.checklist.filter((c) => c.envelope === 'financial');
  const allItems = bid.checklist.filter((c) => !c.envelope);
  const showEnvelopes = technicalItems.length > 0;

  function toggleItem(itemId: string) {
    const updated = {
      ...bid!,
      checklist: bid!.checklist.map((c) =>
        c.id === itemId ? { ...c, completed: !c.completed } : c
      ),
    };
    save(updated);
  }

  function handleDelete() {
    deleteBid(bid!.id);
    toast.success('Bid deleted');
    navigate('/');
  }

  function addBoqItem() {
    const item: BOQItem = {
      id: crypto.randomUUID(),
      description: '',
      unit: '',
      quantity: 0,
      rate: 0,
      amount: 0,
    };
    save({ ...bid!, boqItems: [...bid!.boqItems, item] });
  }

  function updateBoqItem(itemId: string, field: keyof BOQItem, value: string | number) {
    const items = bid!.boqItems.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updated.amount = Number(updated.quantity) * Number(updated.rate);
      }
      return updated;
    });
    save({ ...bid!, boqItems: items });
  }

  function removeBoqItem(itemId: string) {
    save({ ...bid!, boqItems: bid!.boqItems.filter((i) => i.id !== itemId) });
  }

  const ChecklistSection = ({ items, title }: { items: typeof bid.checklist; title: string }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <Checkbox
            checked={item.completed}
            onCheckedChange={() => toggleItem(item.id)}
          />
          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
            {item.label}
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{bid.projectName}</h1>
          <p className="text-muted-foreground">{bid.employer}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{BID_TYPE_LABELS[bid.bidType]}</Badge>
            <Select
              value={bid.status}
              onValueChange={(v) => save({ ...bid, status: v as BidStatus })}
            >
              <SelectTrigger className="w-36 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BID_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Document Readiness
            </span>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {bid.checklist.filter((c) => c.completed).length} of {bid.checklist.length} documents ready
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="boq">BOQ</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Checklist */}
        <TabsContent value="checklist" className="space-y-6 mt-4">
          {showEnvelopes ? (
            <>
              <ChecklistSection items={technicalItems} title="📁 Envelope 1 — Technical (प्राविधिक)" />
              <ChecklistSection items={financialItems} title="📁 Envelope 2 — Financial (आर्थिक)" />
            </>
          ) : (
            <ChecklistSection items={allItems.length ? allItems : bid.checklist} title="📁 Required Documents" />
          )}
        </TabsContent>

        {/* BOQ */}
        <TabsContent value="boq" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Bill of Quantities (परिमाण विवरण)</CardTitle>
              <Button size="sm" onClick={addBoqItem}>+ Add Item</Button>
            </CardHeader>
            <CardContent>
              {bid.boqItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No BOQ items yet. Add items above.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Rate</div>
                    <div className="col-span-1">Amount</div>
                    <div className="col-span-1"></div>
                  </div>
                  {bid.boqItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-4 h-8 text-sm"
                        value={item.description}
                        onChange={(e) => updateBoqItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                      />
                      <Input
                        className="col-span-2 h-8 text-sm"
                        value={item.unit}
                        onChange={(e) => updateBoqItem(item.id, 'unit', e.target.value)}
                        placeholder="m³"
                      />
                      <Input
                        className="col-span-2 h-8 text-sm"
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateBoqItem(item.id, 'quantity', Number(e.target.value))}
                      />
                      <Input
                        className="col-span-2 h-8 text-sm"
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => updateBoqItem(item.id, 'rate', Number(e.target.value))}
                      />
                      <span className="col-span-1 text-sm font-medium">
                        {item.amount.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="col-span-1 h-8 w-8"
                        onClick={() => removeBoqItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="border-t pt-2 text-right font-semibold">
                    Total: NPR {bid.boqItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          {[
            { title: 'Letter of Bid', icon: FileText, content: letterOfBidTemplate(profile, bid.projectName, bid.employer) },
            { title: 'Bid Security (Bank Guarantee)', icon: FileText, content: bidSecurityTemplate(profile) },
            { title: 'Power of Attorney', icon: FileText, content: powerOfAttorneyTemplate(profile) },
          ].map((tpl) => (
            <Card key={tpl.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <tpl.icon className="h-4 w-4 text-primary" />
                  {tpl.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="font-mono text-xs min-h-[200px]"
                  defaultValue={tpl.content}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(tpl.content);
                    toast.success('Copied to clipboard!');
                  }}
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes & Remarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Methodology / Work Plan</Label>
                <Textarea
                  value={bid.methodology || ''}
                  onChange={(e) => save({ ...bid, methodology: e.target.value })}
                  placeholder="Describe your approach, methodology, work plan..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>General Notes</Label>
                <Textarea
                  value={bid.notes || ''}
                  onChange={(e) => save({ ...bid, notes: e.target.value })}
                  placeholder="Any additional notes about this bid..."
                  className="min-h-[80px]"
                />
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  save(bid);
                  toast.success('Notes saved!');
                }}
              >
                <Save className="h-4 w-4" /> Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
