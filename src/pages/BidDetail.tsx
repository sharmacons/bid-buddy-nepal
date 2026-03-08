import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBids, saveBid, deleteBid, getCompanyProfile } from '@/lib/storage';
import { BID_TYPE_LABELS, BID_STATUS_LABELS, BidData, BidStatus, BOQItem, JVPartner, RunningContract, WorkScheduleItem, COMMON_ROAD_WORK_ITEMS } from '@/lib/types';
import {
  letterOfBidTemplate, bidSecurityTemplate, powerOfAttorneyTemplate,
  bidderInfoELI1Template, jvInfoELI2Template, runningContractsELI3Template,
  jvAgreementTemplate, methodStatementTemplate, siteOrganizationTemplate,
  constructionScheduleTemplate, mobilizationScheduleTemplate,
} from '@/lib/templates';
import { toast } from 'sonner';
import { Trash2, Save, FileText, CheckCircle2, Printer, Plus, Users, Calendar } from 'lucide-react';

export default function BidDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bid, setBid] = useState<BidData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = getBids().find((b) => b.id === id);
    if (found) {
      // Migrate older bids that don't have new fields
      const migrated = {
        ...found,
        isJV: found.isJV ?? false,
        jvPartners: found.jvPartners ?? [],
        runningContracts: found.runningContracts ?? [],
        workSchedule: found.workSchedule ?? [],
      };
      setBid(migrated);
    } else navigate('/');
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
    save({
      ...bid!,
      checklist: bid!.checklist.map((c) =>
        c.id === itemId ? { ...c, completed: !c.completed } : c
      ),
    });
  }

  function handleDelete() {
    deleteBid(bid!.id);
    toast.success('Bid deleted');
    navigate('/');
  }

  // BOQ functions
  function addBoqItem() {
    const item: BOQItem = { id: crypto.randomUUID(), description: '', unit: '', quantity: 0, rate: 0, amount: 0 };
    save({ ...bid!, boqItems: [...bid!.boqItems, item] });
  }

  function updateBoqItem(itemId: string, field: keyof BOQItem, value: string | number) {
    const items = bid!.boqItems.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') updated.amount = Number(updated.quantity) * Number(updated.rate);
      return updated;
    });
    save({ ...bid!, boqItems: items });
  }

  function removeBoqItem(itemId: string) {
    save({ ...bid!, boqItems: bid!.boqItems.filter((i) => i.id !== itemId) });
  }

  // JV functions
  function addJVPartner() {
    const partner: JVPartner = {
      id: crypto.randomUUID(), legalName: '', country: 'Nepal', yearOfConstitution: '',
      address: '', authorizedRepresentative: '', contactPhone: '', contactEmail: '', sharePercentage: 0,
    };
    save({ ...bid!, jvPartners: [...bid!.jvPartners, partner] });
  }

  function updateJVPartner(partnerId: string, field: keyof JVPartner, value: string | number) {
    save({
      ...bid!,
      jvPartners: bid!.jvPartners.map((p) => p.id === partnerId ? { ...p, [field]: value } : p),
    });
  }

  function removeJVPartner(partnerId: string) {
    save({ ...bid!, jvPartners: bid!.jvPartners.filter((p) => p.id !== partnerId) });
  }

  // Running contracts
  function addRunningContract() {
    const contract: RunningContract = {
      id: crypto.randomUUID(), name: '', sourceOfFund: 'GON', dateOfAcceptance: '', status: 'running',
    };
    save({ ...bid!, runningContracts: [...bid!.runningContracts, contract] });
  }

  function updateRunningContract(cId: string, field: keyof RunningContract, value: string) {
    save({
      ...bid!,
      runningContracts: bid!.runningContracts.map((c) => c.id === cId ? { ...c, [field]: value } : c),
    });
  }

  function removeRunningContract(cId: string) {
    save({ ...bid!, runningContracts: bid!.runningContracts.filter((c) => c.id !== cId) });
  }

  // Work schedule
  function autoGenerateSchedule() {
    let startWeek = 1;
    const items: WorkScheduleItem[] = COMMON_ROAD_WORK_ITEMS.map((item) => {
      const ws: WorkScheduleItem = {
        id: crypto.randomUUID(),
        activity: item.activity,
        duration: item.defaultDuration,
        startWeek,
        isMajor: item.isMajor,
      };
      startWeek += Math.ceil(item.defaultDuration * 0.6); // Overlap activities
      return ws;
    });
    const total = Math.max(...items.map((i) => i.startWeek + i.duration));
    save({ ...bid!, workSchedule: items, totalDurationWeeks: total });
    toast.success('Work schedule auto-generated from standard road construction items!');
  }

  function addScheduleItem() {
    const lastEnd = bid!.workSchedule.length
      ? Math.max(...bid!.workSchedule.map((i) => i.startWeek + i.duration))
      : 1;
    const item: WorkScheduleItem = {
      id: crypto.randomUUID(), activity: '', duration: 2, startWeek: lastEnd, isMajor: false,
    };
    save({ ...bid!, workSchedule: [...bid!.workSchedule, item] });
  }

  function updateScheduleItem(itemId: string, field: keyof WorkScheduleItem, value: string | number | boolean) {
    save({
      ...bid!,
      workSchedule: bid!.workSchedule.map((i) => i.id === itemId ? { ...i, [field]: value } : i),
    });
  }

  function removeScheduleItem(itemId: string) {
    save({ ...bid!, workSchedule: bid!.workSchedule.filter((i) => i.id !== itemId) });
  }

  // Print all documents
  function handlePrint() {
    const allDocs = generateAllDocuments();
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups'); return; }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Bid Documents - ${bid!.projectName}</title>
      <style>
        @page { margin: 2cm; size: A4; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
        .page-break { page-break-before: always; }
        pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
        h1 { text-align: center; font-size: 16pt; margin-bottom: 20pt; }
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
        td, th { border: 1px solid #000; padding: 4pt 8pt; text-align: left; font-size: 11pt; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <div class="no-print" style="text-align:center;padding:20px;background:#f0f0f0;margin-bottom:20px;">
        <button onclick="window.print()" style="padding:10px 30px;font-size:14pt;cursor:pointer;">🖨️ Print All Documents</button>
      </div>
      ${allDocs.map((doc, i) => `
        ${i > 0 ? '<div class="page-break"></div>' : ''}
        <h1>${doc.title}</h1>
        <pre>${doc.content}</pre>
      `).join('')}
      </body></html>
    `);
    printWindow.document.close();
  }

  function generateAllDocuments() {
    const docs = [
      { title: 'Letter of Bid (बोलपत्र पत्र)', content: letterOfBidTemplate(profile, bid!) },
      { title: 'Bid Security — Bank Guarantee (बोलपत्र जमानत)', content: bidSecurityTemplate(profile, bid!) },
      { title: 'Power of Attorney (अख्तियारनामा)', content: powerOfAttorneyTemplate(profile, bid!) },
      { title: 'Bidder Information — ELI-1', content: bidderInfoELI1Template(profile) },
      { title: 'Running Contracts — ELI-3', content: runningContractsELI3Template(bid!.runningContracts.map((c) => ({
        name: c.name, sourceOfFund: c.sourceOfFund, dateOfAcceptance: c.dateOfAcceptance,
        status: c.status, takingOverDate: c.takingOverDate,
      }))) },
      { title: 'Method Statement (कार्यविधि)', content: methodStatementTemplate(bid!) },
      { title: 'Site Organization (स्थलीय संगठन)', content: siteOrganizationTemplate(profile, bid!) },
      { title: 'Mobilization Schedule (परिचालन तालिका)', content: mobilizationScheduleTemplate(bid!) },
    ];

    if (bid!.workSchedule.length > 0) {
      docs.push({
        title: 'Construction Schedule (कार्य तालिका)',
        content: constructionScheduleTemplate(bid!.workSchedule, bid!.totalDurationWeeks || 24),
      });
    }

    if (bid!.isJV && bid!.jvPartners.length > 0) {
      bid!.jvPartners.forEach((p, i) => {
        docs.push({
          title: `JV Partner ${i + 1} — ELI-2: ${p.legalName || 'Partner'}`,
          content: jvInfoELI2Template(p, profile?.companyName || bid!.projectName),
        });
      });
      docs.push({
        title: 'Joint Venture Agreement (संयुक्त उपक्रम सम्झौता)',
        content: jvAgreementTemplate(profile, bid!.jvPartners, bid!),
      });
    }

    return docs;
  }

  const ChecklistSection = ({ items, title }: { items: typeof bid.checklist; title: string }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
          <Checkbox checked={item.completed} onCheckedChange={() => toggleItem(item.id)} />
          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" ref={printRef}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{bid.projectName}</h1>
          <p className="text-muted-foreground">{bid.employer}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary">{BID_TYPE_LABELS[bid.bidType]}</Badge>
            {bid.isJV && <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> JV</Badge>}
            <Select value={bid.status} onValueChange={(v) => save({ ...bid, status: v as BidStatus })}>
              <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BID_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
            <Printer className="h-4 w-4" /> Print All
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" /> Document Readiness
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
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="bid-info">Bid Info</TabsTrigger>
          <TabsTrigger value="boq">BOQ</TabsTrigger>
          {bid.isJV && <TabsTrigger value="jv">JV Partners</TabsTrigger>}
          <TabsTrigger value="contracts">Running Contracts</TabsTrigger>
          <TabsTrigger value="schedule">Work Schedule</TabsTrigger>
          <TabsTrigger value="templates">Documents</TabsTrigger>
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

        {/* Bid Info */}
        <TabsContent value="bid-info" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Bid Details (बोलपत्र विवरण)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>IFB Number</Label>
                  <Input value={bid.ifbNumber || ''} onChange={(e) => save({ ...bid, ifbNumber: e.target.value })} placeholder="07/079-80" />
                </div>
                <div className="space-y-2">
                  <Label>Contract ID</Label>
                  <Input value={bid.contractId || ''} onChange={(e) => save({ ...bid, contractId: e.target.value })} placeholder="RIDO/GUL/..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Bid Amount (NPR)</Label>
                  <Input value={bid.bidAmount || ''} onChange={(e) => save({ ...bid, bidAmount: e.target.value })} placeholder="2,791,360.66" />
                </div>
                <div className="space-y-2">
                  <Label>Bid Amount (Words)</Label>
                  <Input value={bid.bidAmountWords || ''} onChange={(e) => save({ ...bid, bidAmountWords: e.target.value })} placeholder="Twenty Seven Lakhs..." />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Bid Validity (days)</Label>
                  <Input value={bid.bidValidity || '90'} onChange={(e) => save({ ...bid, bidValidity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Commencement (days)</Label>
                  <Input value={bid.commencementDays || ''} onChange={(e) => save({ ...bid, commencementDays: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Completion (days)</Label>
                  <Input value={bid.completionPeriod || ''} onChange={(e) => save({ ...bid, completionPeriod: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Bid Security Amount (NPR)</Label>
                  <Input value={bid.bidSecurityAmount || ''} onChange={(e) => save({ ...bid, bidSecurityAmount: e.target.value })} placeholder="85,000" />
                </div>
                <div className="space-y-2">
                  <Label>Performance Security %</Label>
                  <Input value={bid.performanceSecurityPercent || '5'} onChange={(e) => save({ ...bid, performanceSecurityPercent: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Joint Venture (संयुक्त उपक्रम)</Label>
                  <p className="text-xs text-muted-foreground">Bidding as JV?</p>
                </div>
                <Switch checked={bid.isJV} onCheckedChange={(v) => save({ ...bid, isJV: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOQ */}
        <TabsContent value="boq" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Bill of Quantities (परिमाण विवरण)</CardTitle>
              <Button size="sm" onClick={addBoqItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
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
                      <Input className="col-span-4 h-8 text-sm" value={item.description} onChange={(e) => updateBoqItem(item.id, 'description', e.target.value)} placeholder="Description" />
                      <Input className="col-span-2 h-8 text-sm" value={item.unit} onChange={(e) => updateBoqItem(item.id, 'unit', e.target.value)} placeholder="m³" />
                      <Input className="col-span-2 h-8 text-sm" type="number" value={item.quantity || ''} onChange={(e) => updateBoqItem(item.id, 'quantity', Number(e.target.value))} />
                      <Input className="col-span-2 h-8 text-sm" type="number" value={item.rate || ''} onChange={(e) => updateBoqItem(item.id, 'rate', Number(e.target.value))} />
                      <span className="col-span-1 text-sm font-medium">{item.amount.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeBoqItem(item.id)}>
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

        {/* JV Partners */}
        {bid.isJV && (
          <TabsContent value="jv" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">JV Partners (संयुक्त उपक्रम साझेदारहरू)</CardTitle>
                <Button size="sm" onClick={addJVPartner} disabled={bid.jvPartners.length >= 2}>
                  <Plus className="h-4 w-4 mr-1" /> Add Partner (max 3 total)
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {bid.jvPartners.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No JV partners added. Your company is the Lead Partner.</p>
                ) : bid.jvPartners.map((partner, idx) => (
                  <div key={partner.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Partner {idx + 2}</h4>
                      <Button variant="ghost" size="sm" onClick={() => removeJVPartner(partner.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Legal Name</Label>
                        <Input className="h-8 text-sm" value={partner.legalName} onChange={(e) => updateJVPartner(partner.id, 'legalName', e.target.value)} placeholder="Partner Company Name" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Share %</Label>
                        <Input className="h-8 text-sm" type="number" value={partner.sharePercentage || ''} onChange={(e) => updateJVPartner(partner.id, 'sharePercentage', Number(e.target.value))} placeholder="40" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Address</Label>
                        <Input className="h-8 text-sm" value={partner.address} onChange={(e) => updateJVPartner(partner.id, 'address', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Authorized Representative</Label>
                        <Input className="h-8 text-sm" value={partner.authorizedRepresentative} onChange={(e) => updateJVPartner(partner.id, 'authorizedRepresentative', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input className="h-8 text-sm" value={partner.contactPhone} onChange={(e) => updateJVPartner(partner.id, 'contactPhone', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input className="h-8 text-sm" value={partner.contactEmail} onChange={(e) => updateJVPartner(partner.id, 'contactEmail', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Running Contracts */}
        <TabsContent value="contracts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Running Contracts — ELI-3 (चालु ठेक्काहरू)</CardTitle>
              <Button size="sm" onClick={addRunningContract}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                As per ITB 4.8 & 4.9: Maximum 5 running contracts allowed. Declare all current contracts.
              </p>
              {bid.runningContracts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No running contracts declared (NIL).</p>
              ) : (
                <div className="space-y-3">
                  {bid.runningContracts.map((contract, idx) => (
                    <div key={contract.id} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Contract {idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeRunningContract(contract.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input className="h-8 text-sm col-span-2" value={contract.name} onChange={(e) => updateRunningContract(contract.id, 'name', e.target.value)} placeholder="Contract name" />
                        <Select value={contract.sourceOfFund} onValueChange={(v) => updateRunningContract(contract.id, 'sourceOfFund', v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GON">GON Funded</SelectItem>
                            <SelectItem value="DP">DP Funded</SelectItem>
                            <SelectItem value="Other">Other PE</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={contract.status} onValueChange={(v) => updateRunningContract(contract.id, 'status', v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yet-to-sign">Yet to Sign</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="substantially-completed">Substantially Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Schedule */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Construction Schedule (कार्य तालिका)
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={autoGenerateSchedule}>
                  ⚡ Auto-Generate (Road)
                </Button>
                <Button size="sm" onClick={addScheduleItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Click "Auto-Generate" for standard road construction activities, then customize as needed.
              </p>
              {bid.workSchedule.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No schedule yet. Auto-generate from standard items or add manually.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                    <div className="col-span-5">Activity</div>
                    <div className="col-span-2">Duration (wk)</div>
                    <div className="col-span-2">Start Week</div>
                    <div className="col-span-2">Major?</div>
                    <div className="col-span-1"></div>
                  </div>
                  {bid.workSchedule.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-5 h-8 text-sm" value={item.activity} onChange={(e) => updateScheduleItem(item.id, 'activity', e.target.value)} />
                      <Input className="col-span-2 h-8 text-sm" type="number" value={item.duration} onChange={(e) => updateScheduleItem(item.id, 'duration', Number(e.target.value))} />
                      <Input className="col-span-2 h-8 text-sm" type="number" value={item.startWeek} onChange={(e) => updateScheduleItem(item.id, 'startWeek', Number(e.target.value))} />
                      <div className="col-span-2 flex items-center">
                        <Checkbox checked={item.isMajor} onCheckedChange={(v) => updateScheduleItem(item.id, 'isMajor', !!v)} />
                        <span className="text-xs ml-1">Major</span>
                      </div>
                      <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeScheduleItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {/* Visual bar chart */}
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 overflow-x-auto">
                    <h4 className="text-xs font-semibold mb-2">Bar Chart Preview</h4>
                    <div className="min-w-[600px]">
                      {bid.workSchedule.map((item) => {
                        const maxWeek = bid.totalDurationWeeks || Math.max(...bid.workSchedule.map((i) => i.startWeek + i.duration), 24);
                        const leftPercent = ((item.startWeek - 1) / maxWeek) * 100;
                        const widthPercent = (item.duration / maxWeek) * 100;
                        return (
                          <div key={item.id} className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] w-32 truncate shrink-0">{item.activity}</span>
                            <div className="flex-1 h-5 bg-muted rounded relative">
                              <div
                                className={`absolute h-full rounded ${item.isMajor ? 'bg-primary' : 'bg-primary/50'}`}
                                style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates / Documents */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print All Documents
            </Button>
          </div>
          {generateAllDocuments().map((doc) => (
            <Card key={doc.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea className="font-mono text-xs min-h-[200px]" defaultValue={doc.content} readOnly />
                <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                  navigator.clipboard.writeText(doc.content);
                  toast.success('Copied to clipboard!');
                }}>
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Notes & Methodology</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Methodology / Work Plan (कार्यविधि)</Label>
                <Textarea value={bid.methodology || ''} onChange={(e) => save({ ...bid, methodology: e.target.value })} placeholder="Describe your approach, methodology, work plan..." className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>Site Organization Notes</Label>
                <Textarea value={bid.siteOrganization || ''} onChange={(e) => save({ ...bid, siteOrganization: e.target.value })} placeholder="Key personnel, equipment list..." className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>General Notes</Label>
                <Textarea value={bid.notes || ''} onChange={(e) => save({ ...bid, notes: e.target.value })} placeholder="Any additional notes..." className="min-h-[80px]" />
              </div>
              <Button variant="outline" className="gap-2" onClick={() => { save(bid); toast.success('Notes saved!'); }}>
                <Save className="h-4 w-4" /> Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
