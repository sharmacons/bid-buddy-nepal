import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, Cpu, CheckSquare, BarChart3, ArrowRight, ArrowLeft,
  Loader2, Trash2, Calculator, Sparkles, AlertCircle, IndianRupee,
} from 'lucide-react';
import { BOQItem, WorkScheduleItem } from '@/lib/types';
import GanttChart from '@/components/GanttChart';
import { supabase } from '@/integrations/supabase/client';
import {
  autoFillRates,
  engineersEstimate,
  referenceProjectEstimate,
  unitCostEstimate,
  parametricEstimate,
  UNIT_COST_STANDARDS,
  CostEstimationResult,
} from '@/lib/cost-estimation';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface ParsedBoqRow {
  id: string;
  sn: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  selected: boolean;
  category?: string;
  autoRate?: { rate: number; normDescription: string; confidence: number };
}

const STEP_LABELS = [
  { step: 1, label: 'Upload BoQ', icon: Upload },
  { step: 2, label: 'AI Processing', icon: Cpu },
  { step: 3, label: 'Review Items', icon: CheckSquare },
  { step: 4, label: 'Cost Estimation', icon: Calculator },
  { step: 5, label: 'Gantt Chart', icon: BarChart3 },
];

function formatNPR(n: number): string {
  return 'NPR ' + n.toLocaleString('en-IN');
}

export default function BoqWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [projectName, setProjectName] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [totalDurationWeeks, setTotalDurationWeeks] = useState(24);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedBoqRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [workSchedule, setWorkSchedule] = useState<WorkScheduleItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cost estimation state
  const [estimationTab, setEstimationTab] = useState('engineers');
  const [contingencyPercent, setContingencyPercent] = useState(5);
  const [physicalContingency, setPhysicalContingency] = useState(2.5);
  const [vatPercent, setVatPercent] = useState(13);
  const [refCost, setRefCost] = useState(0);
  const [refYear, setRefYear] = useState(2078);
  const [currentYear, setCurrentYear] = useState(2081);
  const [annualEscalation, setAnnualEscalation] = useState(8);
  const [scopeAdjustment, setScopeAdjustment] = useState(0);
  const [unitStandardId, setUnitStandardId] = useState('road-blacktop');
  const [unitGradeIndex, setUnitGradeIndex] = useState(0);
  const [unitQuantity, setUnitQuantity] = useState(1);
  const [paramBaseAmount, setParamBaseAmount] = useState(0);
  const [paramFactors, setParamFactors] = useState([
    { label: 'Contingency (आकस्मिक)', percent: 5 },
    { label: 'Overhead & Profit', percent: 15 },
    { label: 'VAT', percent: 13 },
  ]);
  const [estimationResults, setEstimationResults] = useState<CostEstimationResult[]>([]);

  // ─── Step 1: File upload ───
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx|txt)$/i)) {
      toast.error('Please upload a CSV, Excel, or text file');
      return;
    }
    setUploadedFile(file);
    toast.success(`File "${file.name}" loaded`);
  }, []);

  const handlePasteBoq = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
  }, []);

  // ─── Step 2: AI Processing + Auto Rate Fill ───
  const processBoq = useCallback(async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Reading file...');

    try {
      let textContent = rawText;
      if (uploadedFile && !rawText) {
        setProcessingStatus('Extracting text from file...');
        setProcessingProgress(10);
        textContent = await uploadedFile.text();
      }
      if (!textContent.trim()) {
        toast.error('No BoQ data found. Please upload a file or paste data.');
        setIsProcessing(false);
        return;
      }

      setProcessingStatus('Sending to AI for categorization...');
      setProcessingProgress(30);

      let items: ParsedBoqRow[] = [];

      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { type: 'parse-boq', text: textContent, projectName },
      });

      setProcessingProgress(70);
      setProcessingStatus('Processing AI response...');

      if (error) {
        console.warn('AI processing failed, using manual parsing:', error);
        items = parseCSVManually(textContent);
      } else if (data?.result) {
        items = (data.result as any[]).map((item: any, idx: number) => ({
          id: `boq-${idx + 1}`,
          sn: item.sn || String(idx + 1),
          description: item.description || '',
          unit: item.unit || 'LS',
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || (Number(item.quantity) * Number(item.rate)) || 0,
          selected: true,
          category: item.category || 'General',
        }));
      } else {
        items = parseCSVManually(textContent);
      }

      // ── Auto-fill rates from Rate Analysis norms ──
      setProcessingStatus('Auto-filling rates from norms...');
      setProcessingProgress(85);

      const rateMap = autoFillRates(items);
      items = items.map(item => {
        const match = rateMap.get(item.id);
        if (match && (item.rate === 0 || item.rate === undefined)) {
          return {
            ...item,
            rate: match.rate,
            amount: Math.round(item.quantity * match.rate),
            autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence },
          };
        } else if (match) {
          return { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
        }
        return item;
      });

      setParsedItems(items);
      setProcessingProgress(100);
      setProcessingStatus('Done!');
      toast.success(`${items.length} items extracted, rates auto-filled where possible`);
      setTimeout(() => setCurrentStep(3), 600);
    } catch (err) {
      console.error('BoQ processing error:', err);
      const text = rawText || (uploadedFile ? await uploadedFile.text() : '');
      if (text) {
        const rows = parseCSVManually(text);
        setParsedItems(rows);
        setProcessingProgress(100);
        setProcessingStatus('Parsed manually (AI unavailable)');
        setTimeout(() => setCurrentStep(3), 600);
      } else {
        toast.error('Processing failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, rawText, projectName]);

  function parseCSVManually(text: string): ParsedBoqRow[] {
    const lines = text.split('\n').filter(l => l.trim());
    const items: ParsedBoqRow[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;
      if (cols[0].toLowerCase().includes('sn') || cols[0].toLowerCase().includes('item')) continue;
      const desc = cols.length >= 3 ? cols[1] : cols[0];
      const unit = cols.length >= 4 ? cols[2] : 'LS';
      const qty = parseFloat(cols.length >= 4 ? cols[3] : cols[2]) || 0;
      const rate = parseFloat(cols.length >= 5 ? cols[4] : '0') || 0;
      const amount = parseFloat(cols.length >= 6 ? cols[5] : '0') || qty * rate;
      if (desc) {
        items.push({ id: `boq-${items.length + 1}`, sn: cols[0] || String(items.length + 1), description: desc, unit, quantity: qty, rate, amount, selected: true, category: 'General' });
      }
    }
    return items;
  }

  // ─── Step 3 ───
  const toggleItem = (id: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };
  const selectAll = () => setParsedItems(prev => prev.map(item => ({ ...item, selected: true })));
  const deselectAll = () => setParsedItems(prev => prev.map(item => ({ ...item, selected: false })));

  const applyAutoRate = (id: string) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id === id && item.autoRate) {
        return { ...item, rate: item.autoRate.rate, amount: Math.round(item.quantity * item.autoRate.rate) };
      }
      return item;
    }));
    toast.success('Rate applied from norms');
  };

  const updateItemRate = (id: string, newRate: number) => {
    setParsedItems(prev => prev.map(item =>
      item.id === id ? { ...item, rate: newRate, amount: Math.round(item.quantity * newRate) } : item
    ));
  };

  // ─── Step 4: Cost Estimation ───
  const computeAllEstimates = useCallback(() => {
    const selected = parsedItems.filter(i => i.selected);
    const results: CostEstimationResult[] = [];

    // Engineer's estimate
    results.push(engineersEstimate(selected, contingencyPercent, vatPercent, physicalContingency));

    // Reference project (if filled)
    if (refCost > 0) {
      results.push(referenceProjectEstimate(refCost, refYear, currentYear, annualEscalation, scopeAdjustment));
    }

    // Unit cost
    if (unitQuantity > 0) {
      results.push(unitCostEstimate(unitStandardId, unitGradeIndex, unitQuantity, vatPercent));
    }

    // Parametric
    if (paramBaseAmount > 0) {
      results.push(parametricEstimate(paramBaseAmount, paramFactors));
    }

    setEstimationResults(results);
  }, [parsedItems, contingencyPercent, vatPercent, physicalContingency, refCost, refYear, currentYear, annualEscalation, scopeAdjustment, unitStandardId, unitGradeIndex, unitQuantity, paramBaseAmount, paramFactors]);

  useEffect(() => {
    if (currentStep === 4) computeAllEstimates();
  }, [currentStep, computeAllEstimates]);

  // ─── Step 5: Gantt ───
  const generateGanttFromSelected = useCallback(() => {
    const selected = parsedItems.filter(i => i.selected);
    if (selected.length === 0) { toast.error('No items selected'); return; }
    const avgDuration = Math.max(1, Math.floor(totalDurationWeeks / selected.length));
    let currentWeek = 1;
    const schedule: WorkScheduleItem[] = selected.map((item, idx) => {
      const duration = Math.max(1, Math.min(avgDuration + Math.floor(Math.random() * 2) - 1, totalDurationWeeks - currentWeek + 1));
      const ws: WorkScheduleItem = { id: item.id, activity: item.description, duration, startWeek: currentWeek, isMajor: item.amount > 0 && idx < Math.ceil(selected.length * 0.4), dependencies: idx > 0 ? [selected[idx - 1].id] : [] };
      currentWeek += Math.max(1, Math.floor(duration * 0.65));
      return ws;
    });
    setWorkSchedule(schedule);
    setCurrentStep(5);
  }, [parsedItems, totalDurationWeeks]);

  // Navigation
  const canGoNext = () => {
    if (currentStep === 1) return !!(uploadedFile || rawText.trim()) && projectName.trim().length > 0;
    if (currentStep === 2) return parsedItems.length > 0;
    if (currentStep === 3) return parsedItems.some(i => i.selected);
    if (currentStep === 4) return true;
    return false;
  };

  const goNext = () => {
    if (currentStep === 1) { setCurrentStep(2); setTimeout(() => processBoq(), 300); }
    else if (currentStep === 2) { setCurrentStep(3); }
    else if (currentStep === 3) { setCurrentStep(4); }
    else if (currentStep === 4) { generateGanttFromSelected(); }
  };

  const goBack = () => { if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep); };

  const selectedCount = parsedItems.filter(i => i.selected).length;
  const totalAmount = parsedItems.filter(i => i.selected).reduce((s, i) => s + i.amount, 0);
  const autoFilledCount = parsedItems.filter(i => i.autoRate).length;

  const selectedStandard = UNIT_COST_STANDARDS.find(s => s.id === unitStandardId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">BoQ Upload Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload BoQ → AI Processes → Review & Auto-Rate → Cost Estimation → Gantt Chart
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
        {STEP_LABELS.map(({ step, label, icon: Icon }, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all ${
              currentStep === step ? 'bg-primary text-primary-foreground shadow-md' : currentStep > step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {currentStep > step ? '✓' : <Icon className="h-4 w-4" />}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${currentStep === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {idx < STEP_LABELS.length - 1 && <div className={`w-6 md:w-12 h-0.5 mx-1 ${currentStep > step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* ═══ STEP 1: Upload ═══ */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> Upload Bill of Quantities</CardTitle>
            <CardDescription>Upload a CSV/Excel file or paste your BoQ data directly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input id="projectName" placeholder="e.g. Kathmandu-Terai Road" value={projectName} onChange={e => setProjectName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Project Start Date</Label>
                <Input id="startDate" type="date" value={projectStartDate} onChange={e => setProjectStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Total Duration (weeks)</Label>
                <Input id="duration" type="number" min={4} max={520} value={totalDurationWeeks} onChange={e => setTotalDurationWeeks(Number(e.target.value) || 24)} />
              </div>
            </div>

            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx,.txt" className="hidden" onChange={handleFileUpload} />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              {uploadedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB — Click to replace</p>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Drop your BoQ file here or click to browse</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Supports CSV, Excel (.xls, .xlsx), or plain text</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Or paste BoQ data directly</Label>
              <textarea
                className="w-full h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none"
                placeholder={`SN, Description, Unit, Quantity, Rate, Amount\n1, Earthwork Excavation, m3, 5000, 450, 2250000\n2, Sub-base Course, m3, 3000, 800, 2400000`}
                value={rawText}
                onChange={handlePasteBoq}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP 2: AI Processing ═══ */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> AI Processing</CardTitle>
            <CardDescription>Analyzing, categorizing, and auto-filling rates...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <div className="text-center space-y-4">
              {isProcessing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-medium text-foreground">{processingStatus}</p>
                  <Progress value={processingProgress} className="max-w-md mx-auto" />
                  <p className="text-xs text-muted-foreground">{processingProgress}% complete</p>
                </>
              ) : parsedItems.length > 0 ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><CheckSquare className="h-6 w-6 text-primary" /></div>
                  <p className="text-sm font-medium text-foreground">✅ {parsedItems.length} items extracted</p>
                  {autoFilledCount > 0 && (
                    <p className="text-xs text-accent">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      {autoFilledCount} items auto-rated from DoR/DoLIDAR norms
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Total: {formatNPR(parsedItems.reduce((s, i) => s + i.amount, 0))}</p>
                </>
              ) : (
                <>
                  <Cpu className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Waiting to process...</p>
                  <Button onClick={processBoq}><Cpu className="h-4 w-4 mr-2" /> Start Processing</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP 3: Review Items ═══ */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" /> Review & Select Items</CardTitle>
            <CardDescription>
              {selectedCount} of {parsedItems.length} selected · {formatNPR(totalAmount)}
              {autoFilledCount > 0 && <span className="text-accent ml-2">· {autoFilledCount} auto-rated</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
              <Badge variant="secondary" className="ml-auto">{selectedCount} selected</Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-left w-10"></th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">SN</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Description</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Unit</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Rate</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Auto Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item) => (
                      <tr key={item.id} className={`border-t border-border transition-colors ${item.selected ? 'bg-primary/5' : 'opacity-50'} hover:bg-muted/30`}>
                        <td className="px-3 py-2">
                          <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id)} />
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{item.sn}</td>
                        <td className="px-3 py-2 font-medium text-foreground max-w-[200px]">
                          <span className="truncate block">{item.description}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            className="w-24 h-7 text-right text-xs ml-auto"
                            value={item.rate || ''}
                            onChange={(e) => updateItemRate(item.id, Number(e.target.value) || 0)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{item.amount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">
                          {item.autoRate ? (
                            <div className="space-y-0.5">
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] text-accent" onClick={(e) => { e.stopPropagation(); applyAutoRate(item.id); }}>
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                {item.autoRate.rate.toLocaleString()}
                              </Button>
                              <p className="text-[9px] text-muted-foreground truncate max-w-[120px]" title={item.autoRate.normDescription}>
                                {Math.round(item.autoRate.confidence * 100)}% match
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP 4: Cost Estimation ═══ */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                लागत अनुमान — Cost Estimation
              </CardTitle>
              <CardDescription>
                सार्वजनिक खरिद नियमावली अनुसार लागत अनुमान विधिहरू (PPMO Methods)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={estimationTab} onValueChange={(v) => { setEstimationTab(v); }}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="engineers" className="text-xs">दर विश्लेषण</TabsTrigger>
                  <TabsTrigger value="reference" className="text-xs">सन्दर्भ आयोजना</TabsTrigger>
                  <TabsTrigger value="unit-cost" className="text-xs">एकाइ लागत</TabsTrigger>
                  <TabsTrigger value="parametric" className="text-xs">अनुमानित विधि</TabsTrigger>
                </TabsList>

                {/* ── Engineer's Estimate ── */}
                <TabsContent value="engineers" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    BOQ जम्मा + भौतिक आकस्मिक + मूल्य आकस्मिक + VAT = अनुमानित लागत
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Physical Contingency %</Label>
                      <Input type="number" value={physicalContingency} onChange={e => setPhysicalContingency(Number(e.target.value))} min={0} max={15} step={0.5} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price Contingency %</Label>
                      <Input type="number" value={contingencyPercent} onChange={e => setContingencyPercent(Number(e.target.value))} min={0} max={20} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">VAT %</Label>
                      <Input type="number" value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} min={0} max={20} />
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    BOQ Total: <span className="text-primary">{formatNPR(totalAmount)}</span>
                    <span className="text-muted-foreground ml-2">({selectedCount} items)</span>
                  </div>
                </TabsContent>

                {/* ── Reference Project ── */}
                <TabsContent value="reference" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    समान प्रकृतिको आयोजनाको लागतलाई मूल्य सूचकांक (Price Index) ले समायोजन गरी अनुमान गर्ने
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Reference Project Cost (NPR)</Label>
                      <Input type="number" value={refCost || ''} onChange={e => setRefCost(Number(e.target.value))} placeholder="e.g. 50000000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Reference Year (BS)</Label>
                      <Input type="number" value={refYear} onChange={e => setRefYear(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Year (BS)</Label>
                      <Input type="number" value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Annual Escalation %</Label>
                      <Input type="number" value={annualEscalation} onChange={e => setAnnualEscalation(Number(e.target.value))} min={0} max={25} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Scope Adjustment % (+/-)</Label>
                      <Input type="number" value={scopeAdjustment} onChange={e => setScopeAdjustment(Number(e.target.value))} min={-50} max={100} />
                    </div>
                  </div>
                </TabsContent>

                {/* ── Unit Cost ── */}
                <TabsContent value="unit-cost" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    PPMO / DoR ले निर्धारित गरेको प्रति एकाइ मानक लागत दर प्रयोग गरी अनुमान गर्ने
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Work Type</Label>
                      <Select value={unitStandardId} onValueChange={v => { setUnitStandardId(v); setUnitGradeIndex(0); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNIT_COST_STANDARDS.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.label} ({s.labelNe})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Grade / Terrain</Label>
                      <Select value={String(unitGradeIndex)} onValueChange={v => setUnitGradeIndex(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {selectedStandard?.rates.map((r, i) => (
                            <SelectItem key={i} value={String(i)}>{r.grade} — {formatNPR(r.costPerUnit)}/{selectedStandard.unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity ({selectedStandard?.unit})</Label>
                      <Input type="number" value={unitQuantity} onChange={e => setUnitQuantity(Number(e.target.value))} min={0.1} step={0.1} />
                    </div>
                  </div>
                </TabsContent>

                {/* ── Parametric ── */}
                <TabsContent value="parametric" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    आधार रकम + विभिन्न प्रतिशत समायोजन (Contingency, Overhead, VAT) गरी अनुमान गर्ने
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Base Amount (NPR)</Label>
                      <Input type="number" value={paramBaseAmount || ''} onChange={e => setParamBaseAmount(Number(e.target.value))} placeholder="Enter base amount" />
                    </div>
                    <Separator />
                    <Label className="text-xs font-semibold">Adjustment Factors</Label>
                    {paramFactors.map((f, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input className="flex-1 h-8 text-xs" value={f.label} onChange={e => {
                          const nf = [...paramFactors];
                          nf[i] = { ...nf[i], label: e.target.value };
                          setParamFactors(nf);
                        }} />
                        <Input className="w-20 h-8 text-xs text-right" type="number" value={f.percent} onChange={e => {
                          const nf = [...paramFactors];
                          nf[i] = { ...nf[i], percent: Number(e.target.value) };
                          setParamFactors(nf);
                        }} />
                        <span className="text-xs text-muted-foreground">%</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setParamFactors(paramFactors.filter((_, j) => j !== i))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setParamFactors([...paramFactors, { label: 'New Factor', percent: 5 }])}>+ Add Factor</Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4">
                <Button onClick={computeAllEstimates} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" /> Calculate All Estimates
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          {estimationResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Estimation Results — अनुमान नतिजा
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary comparison */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {estimationResults.map((r, i) => (
                    <Card key={i} className="border-primary/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{r.method}</p>
                        <p className="text-[9px] text-muted-foreground">{r.methodNe}</p>
                        <p className="text-lg font-bold text-primary mt-1 tabular-nums">{formatNPR(r.estimatedCost)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Detailed breakdowns */}
                {estimationResults.map((r, i) => (
                  <div key={i}>
                    <Separator className="my-3" />
                    <h4 className="text-sm font-semibold mb-2">{r.method} <span className="text-muted-foreground font-normal">— {r.details}</span></h4>
                    {r.breakdown && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {r.breakdown.map((b, j) => {
                              const isTotal = j === r.breakdown!.length - 1;
                              return (
                                <tr key={j} className={`border-t border-border ${isTotal ? 'bg-primary/5 font-bold' : ''}`}>
                                  <td className="px-4 py-2 text-foreground">{b.label}</td>
                                  <td className="px-4 py-2 text-right tabular-nums">{formatNPR(b.amount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ STEP 5: Gantt ═══ */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Generated Gantt Chart</CardTitle>
            <CardDescription>{projectName} · {workSchedule.length} activities · {totalDurationWeeks} weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {workSchedule.length > 0 ? <GanttChart items={workSchedule} totalWeeks={totalDurationWeeks} /> : <p className="text-sm text-muted-foreground text-center py-8">No schedule generated</p>}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goBack} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">Step {currentStep} of 5</div>
        {currentStep < 5 && (
          <Button onClick={goNext} disabled={!canGoNext() || (currentStep === 2 && isProcessing)}>
            {currentStep === 4 ? 'Generate Gantt' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {currentStep === 5 && (
          <Button onClick={() => { setCurrentStep(1); setParsedItems([]); setWorkSchedule([]); setUploadedFile(null); setRawText(''); }}>
            Start Over
          </Button>
        )}
      </div>
    </div>
  );
}
