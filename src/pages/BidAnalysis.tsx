import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { saveBid } from '@/lib/storage';
import { getChecklistForType } from '@/lib/checklists';
import { BidType, BID_TYPE_LABELS, BOQItem } from '@/lib/types';
import {
  NRB_PRICE_INDEX_DATA,
  COEFFICIENT_PRESETS,
  PriceAdjustmentCoefficients,
  calculatePriceAdjustment,
  isPriceAdjustmentApplicable,
  PriceAdjustmentResult,
} from '@/lib/price-index';
import {
  Upload,
  FileText,
  Calculator,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Info,
  FileDown,
} from 'lucide-react';
import { exportPriceAdjustmentPDF } from '@/lib/pdf-export';

export default function BidAnalysis() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF reference
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  // Extracted / manually entered fields
  const [bidType, setBidType] = useState<BidType>('ncb-single');
  const [projectName, setProjectName] = useState('');
  const [employer, setEmployer] = useState('');
  const [employerAddress, setEmployerAddress] = useState('');
  const [ifbNumber, setIfbNumber] = useState('');
  const [contractId, setContractId] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [workStartDate, setWorkStartDate] = useState('');
  const [workCompletionDate, setWorkCompletionDate] = useState('');
  const [completionPeriodDays, setCompletionPeriodDays] = useState('');
  const [bidSecurityAmount, setBidSecurityAmount] = useState('');
  const [bidValidity, setBidValidity] = useState('120');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [isJV, setIsJV] = useState(false);

  // BOQ items from document
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [newBoqDesc, setNewBoqDesc] = useState('');
  const [newBoqUnit, setNewBoqUnit] = useState('');
  const [newBoqQty, setNewBoqQty] = useState('');
  const [newBoqRate, setNewBoqRate] = useState('');

  // Price adjustment
  const [coeffPreset, setCoeffPreset] = useState('road-works');
  const [coefficients, setCoefficients] = useState<PriceAdjustmentCoefficients>(
    COEFFICIENT_PRESETS['road-works'].coefficients
  );
  const [baseYear, setBaseYear] = useState('2080/81');
  const [currentYear, setCurrentYear] = useState('2082/83');
  const [priceAdjResult, setPriceAdjResult] = useState<PriceAdjustmentResult | null>(null);

  // Handle file upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }
    setUploadedFile({ name: file.name, size: file.size });
    toast.success('Document uploaded for reference. Please fill in the key fields below.');
  }

  // Calculate contract duration
  function getContractDurationMonths(): number {
    if (!workStartDate || !workCompletionDate) return 0;
    const start = new Date(workStartDate);
    const end = new Date(workCompletionDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  }

  // Add BOQ item
  function addBoqItem() {
    if (!newBoqDesc || !newBoqUnit || !newBoqQty || !newBoqRate) {
      toast.error('Fill all BOQ fields');
      return;
    }
    const qty = parseFloat(newBoqQty);
    const rate = parseFloat(newBoqRate);
    setBoqItems([...boqItems, {
      id: crypto.randomUUID(),
      description: newBoqDesc,
      unit: newBoqUnit,
      quantity: qty,
      rate,
      amount: qty * rate,
    }]);
    setNewBoqDesc(''); setNewBoqUnit(''); setNewBoqQty(''); setNewBoqRate('');
  }

  function removeBoqItem(id: string) {
    setBoqItems(boqItems.filter(i => i.id !== id));
  }

  // Calculate price adjustment
  function handleCalculatePriceAdj() {
    const baseIdx = NRB_PRICE_INDEX_DATA.find(d => d.fiscalYear === baseYear);
    const currIdx = NRB_PRICE_INDEX_DATA.find(d => d.fiscalYear === currentYear);
    if (!baseIdx || !currIdx) {
      toast.error('Select valid base and current year');
      return;
    }
    const amount = parseFloat(estimatedCost) || boqItems.reduce((s, i) => s + i.amount, 0) || 0;
    if (amount <= 0) {
      toast.error('Enter estimated cost or add BOQ items first');
      return;
    }
    const result = calculatePriceAdjustment(coefficients, baseIdx, currIdx, amount);
    setPriceAdjResult(result);
    toast.success(`Multiplying Factor: ${result.multiplyingFactor}`);
  }

  // Create bid from analysis
  function handleCreateBid() {
    if (!projectName || !employer || !submissionDate) {
      toast.error('Project Name, Employer, and Submission Date are required');
      return;
    }
    const id = crypto.randomUUID();
    saveBid({
      id,
      projectName,
      employer,
      employerAddress,
      bidType,
      status: 'preparing',
      submissionDeadline: submissionDate,
      createdAt: new Date().toISOString(),
      checklist: getChecklistForType(bidType),
      boqItems,
      isJV,
      jvPartners: [],
      runningContracts: [],
      workSchedule: [],
      ifbNumber,
      contractId,
      bidSecurityAmount,
      bidValidity,
      completionPeriod: completionPeriodDays ? `${completionPeriodDays} days` : undefined,
    });
    toast.success('Bid created from analysis!');
    navigate(`/bid/${id}`);
  }

  const totalBoq = boqItems.reduce((s, i) => s + i.amount, 0);
  const durationMonths = getContractDurationMonths();
  const priceAdjApplicable = durationMonths > 0
    ? isPriceAdjustmentApplicable(durationMonths, priceAdjResult?.adjustmentPercent || 0)
    : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Bid Document Analysis</h1>
          <p className="text-sm text-muted-foreground">बोलपत्र कागजात विश्लेषण — Upload & extract key details</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="upload">📄 Upload</TabsTrigger>
          <TabsTrigger value="details">📋 Details</TabsTrigger>
          <TabsTrigger value="boq">📊 BOQ</TabsTrigger>
          <TabsTrigger value="price-adj">💰 Price Adj.</TabsTrigger>
        </TabsList>

        {/* TAB 1: Upload */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" /> Upload Bidding Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Upload your PPMO Standard Bidding Document (PDF) for reference.<br />
                  You'll manually extract key fields from it.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" /> Choose PDF File
                </Button>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Uploaded ✓</Badge>
                </div>
              )}

              <div className="bg-accent/30 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> How to use:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Upload your bid document PDF for reference</li>
                  <li>Open the PDF alongside and fill in key fields in the <strong>Details</strong> tab</li>
                  <li>Enter BOQ items from the document in the <strong>BOQ</strong> tab</li>
                  <li>Calculate price adjustment multiplying factor in <strong>Price Adj.</strong> tab</li>
                  <li>Click "Create Bid" to start preparing your submission</li>
                </ol>
              </div>

              {/* Quick identification */}
              <Separator />
              <p className="text-sm font-medium">Quick Identification — बोलपत्र प्रकार पहिचान:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { type: 'ncb-single' as BidType, hint: 'All docs in ONE envelope, national bidding' },
                  { type: 'ncb-double' as BidType, hint: 'Technical + Financial in SEPARATE envelopes' },
                  { type: 'sealed-quotation' as BidType, hint: 'Simple quotation, lower value works' },
                  { type: 'icb' as BidType, hint: 'International bidding, additional eligibility forms' },
                ].map(({ type, hint }) => (
                  <button
                    key={type}
                    onClick={() => setBidType(type)}
                    className={`p-3 rounded-lg border text-left transition-all ${bidType === type
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <p className="text-sm font-medium">{BID_TYPE_LABELS[type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Details */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Key Details from Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name (परियोजनाको नाम) *</Label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)}
                  placeholder="From IFB / Cover Page" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Employer / Procuring Entity *</Label>
                  <Input value={employer} onChange={e => setEmployer(e.target.value)}
                    placeholder="e.g., DoR, Division Road Office" />
                </div>
                <div className="space-y-2">
                  <Label>Employer Address</Label>
                  <Input value={employerAddress} onChange={e => setEmployerAddress(e.target.value)}
                    placeholder="e.g., Gulmi, Nepal" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>IFB Number (बोलपत्र नम्बर)</Label>
                  <Input value={ifbNumber} onChange={e => setIfbNumber(e.target.value)}
                    placeholder="From Invitation for Bids" />
                </div>
                <div className="space-y-2">
                  <Label>Contract ID (ठेक्का नम्बर)</Label>
                  <Input value={contractId} onChange={e => setContractId(e.target.value)} />
                </div>
              </div>

              <Separator />
              <p className="text-sm font-semibold">📅 Important Dates</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Bid Submission Date *</Label>
                  <Input type="date" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Work Start Date (Intended)</Label>
                  <Input type="date" value={workStartDate} onChange={e => setWorkStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Work Completion Date</Label>
                  <Input type="date" value={workCompletionDate} onChange={e => setWorkCompletionDate(e.target.value)} />
                </div>
              </div>

              {durationMonths > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Contract Duration: <strong>{durationMonths} months</strong>
                    {durationMonths > 12 && <Badge variant="outline" className="ml-2 text-green-600">Price Adjustment Eligible</Badge>}
                    {durationMonths <= 12 && <Badge variant="outline" className="ml-2 text-orange-600">No Price Adjustment</Badge>}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Completion Period (days)</Label>
                  <Input value={completionPeriodDays} onChange={e => setCompletionPeriodDays(e.target.value)}
                    placeholder="e.g., 365" type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Bid Security Amount (NPR)</Label>
                  <Input value={bidSecurityAmount} onChange={e => setBidSecurityAmount(e.target.value)}
                    placeholder="From ITB" type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Bid Validity (days)</Label>
                  <Input value={bidValidity} onChange={e => setBidValidity(e.target.value)}
                    placeholder="120" type="number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estimated Cost / Engineer's Estimate (NPR)</Label>
                <Input value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
                  placeholder="If mentioned in bid document" type="number" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Joint Venture (JV) Allowed?</Label>
                  <p className="text-xs text-muted-foreground">Check ITB clause 4.1</p>
                </div>
                <Switch checked={isJV} onCheckedChange={setIsJV} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BOQ */}
        <TabsContent value="boq">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Bill of Quantities (from document)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Enter BOQ items from Section IV of the bidding document. Major items will be used for work schedule.
              </p>

              {/* Add BOQ form */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input value={newBoqDesc} onChange={e => setNewBoqDesc(e.target.value)}
                    placeholder="Earthwork excavation" className="text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Input value={newBoqUnit} onChange={e => setNewBoqUnit(e.target.value)}
                    placeholder="cum" className="text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input value={newBoqQty} onChange={e => setNewBoqQty(e.target.value)}
                    type="number" className="text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Rate (NPR)</Label>
                  <Input value={newBoqRate} onChange={e => setNewBoqRate(e.target.value)}
                    type="number" className="text-sm" />
                </div>
                <div className="col-span-2">
                  <Button onClick={addBoqItem} size="sm" className="w-full">Add</Button>
                </div>
              </div>

              {/* BOQ table */}
              {boqItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">S.N.</th>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
                        <th className="text-left px-3 py-2 font-medium">Unit</th>
                        <th className="text-right px-3 py-2 font-medium">Qty</th>
                        <th className="text-right px-3 py-2 font-medium">Rate</th>
                        <th className="text-right px-3 py-2 font-medium">Amount</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {boqItems.map((item, idx) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2">{item.unit}</td>
                          <td className="px-3 py-2 text-right">{item.quantity.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{item.rate.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-medium">{item.amount.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <Button variant="ghost" size="sm" onClick={() => removeBoqItem(item.id)}
                              className="text-destructive h-6 px-2">✕</Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/30">
                        <td colSpan={5} className="px-3 py-2 text-right font-semibold">Total:</td>
                        <td className="px-3 py-2 text-right font-bold">NPR {totalBoq.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {boqItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No BOQ items yet. Add items from the bidding document above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Price Adjustment */}
        <TabsContent value="price-adj">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Price Adjustment Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-accent/30 p-3 rounded-lg text-xs space-y-1">
                  <p className="font-medium">Formula (PPA Section 55 / PPR Rule 119):</p>
                  <p className="font-mono">Pn = a + b×(Ln/Lo) + c×(Mn/Mo) + d×(En/Eo) + e×(Fn/Fo)</p>
                  <p className="text-muted-foreground">Where a=fixed, b=labor, c=materials, d=equipment, e=fuel coefficients. L,M,E,F = NRB indices.</p>
                </div>

                {priceAdjApplicable && (
                  <div className={`flex items-start gap-2 p-3 rounded-lg ${priceAdjApplicable.applicable
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-orange-500/10 border border-orange-500/20'
                    }`}>
                    {priceAdjApplicable.applicable
                      ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      : <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />}
                    <p className="text-xs">{priceAdjApplicable.reason}</p>
                  </div>
                )}

                {/* Coefficient preset */}
                <div className="space-y-2">
                  <Label>Work Type (for coefficient preset)</Label>
                  <Select value={coeffPreset} onValueChange={v => {
                    setCoeffPreset(v);
                    setCoefficients(COEFFICIENT_PRESETS[v].coefficients);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(COEFFICIENT_PRESETS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Coefficients */}
                <div className="grid grid-cols-5 gap-2">
                  {([
                    ['a', 'Fixed (a)'],
                    ['b', 'Labor (b)'],
                    ['c', 'Materials (c)'],
                    ['d', 'Equipment (d)'],
                    ['e', 'Fuel (e)'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={coefficients[key]}
                        onChange={e => setCoefficients({ ...coefficients, [key]: parseFloat(e.target.value) || 0 })}
                        className="text-sm text-center"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sum: {(coefficients.a + coefficients.b + coefficients.c + coefficients.d + coefficients.e).toFixed(2)}
                  {Math.abs((coefficients.a + coefficients.b + coefficients.c + coefficients.d + coefficients.e) - 1) > 0.001 && (
                    <span className="text-destructive ml-2">⚠ Must equal 1.00</span>
                  )}
                </p>

                {/* Year selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Base Year (Lo — bid opening date)</Label>
                    <Select value={baseYear} onValueChange={setBaseYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NRB_PRICE_INDEX_DATA.map(d => (
                          <SelectItem key={d.fiscalYear} value={d.fiscalYear}>
                            {d.fiscalYear} BS ({d.fiscalYearAD} AD)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Year (Ln — payment date)</Label>
                    <Select value={currentYear} onValueChange={setCurrentYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NRB_PRICE_INDEX_DATA.map(d => (
                          <SelectItem key={d.fiscalYear} value={d.fiscalYear}>
                            {d.fiscalYear} BS ({d.fiscalYearAD} AD)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* NRB Index table */}
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Year (BS)</th>
                        <th className="px-2 py-1.5 text-right">Overall</th>
                        <th className="px-2 py-1.5 text-right">Food</th>
                        <th className="px-2 py-1.5 text-right">Non-Food</th>
                        <th className="px-2 py-1.5 text-right">Construction</th>
                        <th className="px-2 py-1.5 text-right">Labor</th>
                        <th className="px-2 py-1.5 text-right">Fuel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {NRB_PRICE_INDEX_DATA.map(d => (
                        <tr key={d.fiscalYear} className={`border-t ${(d.fiscalYear === baseYear || d.fiscalYear === currentYear) ? 'bg-primary/10 font-medium' : ''}`}>
                          <td className="px-2 py-1.5">{d.fiscalYear}</td>
                          <td className="px-2 py-1.5 text-right">{d.overall.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right">{d.food.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right">{d.nonFood.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right">{d.construction.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right">{d.labor.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right">{d.fuel.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Source: Nepal Rastra Bank CPI Data. Base Year: 2080/81 BS = 100. Construction & Labor indices derived from NRB sectoral reports.
                </p>

                <Button onClick={handleCalculatePriceAdj} className="w-full gap-2">
                  <Calculator className="h-4 w-4" /> Calculate Multiplying Factor
                </Button>

                {/* Result */}
                {priceAdjResult && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-4 space-y-3">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Multiplying Factor (Pn)</p>
                        <p className="text-4xl font-bold text-primary">{priceAdjResult.multiplyingFactor}</p>
                        <p className="text-sm mt-1">
                          Price Adjustment: <strong>{priceAdjResult.adjustmentPercent > 0 ? '+' : ''}{priceAdjResult.adjustmentPercent}%</strong>
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div>
                          <p className="text-muted-foreground">Fixed</p>
                          <p className="font-medium">{priceAdjResult.breakDown.fixed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Labor</p>
                          <p className="font-medium">{priceAdjResult.breakDown.labor}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Materials</p>
                          <p className="font-medium">{priceAdjResult.breakDown.materials}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Equipment</p>
                          <p className="font-medium">{priceAdjResult.breakDown.equipment}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fuel</p>
                          <p className="font-medium">{priceAdjResult.breakDown.fuel}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between text-sm">
                        <span>Original Amount:</span>
                        <span>NPR {(parseFloat(estimatedCost) || totalBoq).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Adjusted Amount:</span>
                        <span>NPR {priceAdjResult.adjustedAmount.toLocaleString()}</span>
                      </div>

                      {priceAdjResult.adjustmentPercent > 25 && (
                        <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                          <p className="text-xs text-destructive">
                            Exceeds 25% cap per PPR Rule 119(3). Contract may be terminated or renegotiated.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Bid CTA */}
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <Button onClick={handleCreateBid} className="w-full gap-2" size="lg">
            <ArrowRight className="h-5 w-5" /> Create Bid from This Analysis & Start Preparing
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            This will create a new bid with all details, BOQ items, and checklist ready to go.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
