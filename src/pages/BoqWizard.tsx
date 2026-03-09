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
  Loader2, Trash2, Calculator, Sparkles, AlertCircle, IndianRupee, Plus, Download,
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
  { step: 3, label: 'Review & Edit', icon: CheckSquare },
  { step: 4, label: 'Cost Estimation', icon: Calculator },
  { step: 5, label: 'Gantt Chart', icon: BarChart3 },
];

function formatNPR(n: number): string {
  return 'NPR ' + n.toLocaleString('en-IN');
}

// ═══════════════════════════════════════════
// ─── SAMPLE BOQ TEMPLATES ───
// ═══════════════════════════════════════════
const SAMPLE_TEMPLATES: { name: string; items: Omit<ParsedBoqRow, 'selected' | 'autoRate'>[] }[] = [
  {
    name: 'Road Construction (सडक निर्माण)',
    items: [
      { id: 'st-1', sn: '1', description: 'Site Clearance & Grubbing', unit: 'sq.m', quantity: 15000, rate: 25, amount: 375000, category: 'Preliminary' },
      { id: 'st-2', sn: '2', description: 'Earthwork Excavation in Ordinary Soil', unit: 'cum', quantity: 8000, rate: 380, amount: 3040000, category: 'Earthwork' },
      { id: 'st-3', sn: '3', description: 'Earthwork in Embankment / Fill', unit: 'cum', quantity: 5000, rate: 420, amount: 2100000, category: 'Earthwork' },
      { id: 'st-4', sn: '4', description: 'Sub-base Course (Granular)', unit: 'cum', quantity: 2500, rate: 2800, amount: 7000000, category: 'Pavement' },
      { id: 'st-5', sn: '5', description: 'Base Course (WBM)', unit: 'cum', quantity: 2000, rate: 3500, amount: 7000000, category: 'Pavement' },
      { id: 'st-6', sn: '6', description: 'Prime Coat (Bituminous)', unit: 'sq.m', quantity: 18000, rate: 65, amount: 1170000, category: 'Pavement' },
      { id: 'st-7', sn: '7', description: 'Seal Coat (20mm Aggregate)', unit: 'sq.m', quantity: 18000, rate: 180, amount: 3240000, category: 'Pavement' },
      { id: 'st-8', sn: '8', description: 'Stone Masonry in Side Drain', unit: 'cum', quantity: 800, rate: 8500, amount: 6800000, category: 'Drainage' },
      { id: 'st-9', sn: '9', description: 'Hume Pipe Culvert (600mm dia)', unit: 'rm', quantity: 120, rate: 12000, amount: 1440000, category: 'Drainage' },
      { id: 'st-10', sn: '10', description: 'Gabion Wall (2x1x1)', unit: 'cum', quantity: 500, rate: 6500, amount: 3250000, category: 'Protection' },
      { id: 'st-11', sn: '11', description: 'Road Furniture & Signage', unit: 'LS', quantity: 1, rate: 350000, amount: 350000, category: 'Furniture' },
      { id: 'st-12', sn: '12', description: 'Bio-engineering / Slope Protection', unit: 'sq.m', quantity: 3000, rate: 250, amount: 750000, category: 'Protection' },
    ],
  },
  {
    name: 'Building Construction (भवन निर्माण)',
    items: [
      { id: 'bt-1', sn: '1', description: 'Earthwork Excavation for Foundation', unit: 'cum', quantity: 400, rate: 450, amount: 180000, category: 'Foundation' },
      { id: 'bt-2', sn: '2', description: 'PCC 1:3:6 in Foundation', unit: 'cum', quantity: 50, rate: 9500, amount: 475000, category: 'Foundation' },
      { id: 'bt-3', sn: '3', description: 'RCC M20 in Footing', unit: 'cum', quantity: 80, rate: 18000, amount: 1440000, category: 'Structure' },
      { id: 'bt-4', sn: '4', description: 'RCC M20 in Column', unit: 'cum', quantity: 45, rate: 22000, amount: 990000, category: 'Structure' },
      { id: 'bt-5', sn: '5', description: 'RCC M20 in Beam', unit: 'cum', quantity: 60, rate: 20000, amount: 1200000, category: 'Structure' },
      { id: 'bt-6', sn: '6', description: 'RCC M20 in Slab', unit: 'cum', quantity: 70, rate: 19000, amount: 1330000, category: 'Structure' },
      { id: 'bt-7', sn: '7', description: 'Brick Masonry in Superstructure', unit: 'cum', quantity: 200, rate: 12000, amount: 2400000, category: 'Masonry' },
      { id: 'bt-8', sn: '8', description: 'Plastering 1:4 (12mm)', unit: 'sq.m', quantity: 2500, rate: 350, amount: 875000, category: 'Finishing' },
      { id: 'bt-9', sn: '9', description: 'Painting (2 coats)', unit: 'sq.m', quantity: 2500, rate: 280, amount: 700000, category: 'Finishing' },
      { id: 'bt-10', sn: '10', description: 'Roofing with CGI Sheet', unit: 'sq.m', quantity: 300, rate: 1800, amount: 540000, category: 'Roofing' },
    ],
  },
  {
    name: 'Bridge Construction (पुल निर्माण)',
    items: [
      { id: 'br-1', sn: '1', description: 'Earthwork in Abutment Foundation', unit: 'cum', quantity: 600, rate: 500, amount: 300000, category: 'Foundation' },
      { id: 'br-2', sn: '2', description: 'PCC M15 in Foundation', unit: 'cum', quantity: 120, rate: 10500, amount: 1260000, category: 'Foundation' },
      { id: 'br-3', sn: '3', description: 'RCC M25 in Abutment', unit: 'cum', quantity: 150, rate: 24000, amount: 3600000, category: 'Substructure' },
      { id: 'br-4', sn: '4', description: 'RCC M25 in Pier', unit: 'cum', quantity: 80, rate: 26000, amount: 2080000, category: 'Substructure' },
      { id: 'br-5', sn: '5', description: 'RCC M30 in Deck Slab', unit: 'cum', quantity: 100, rate: 28000, amount: 2800000, category: 'Superstructure' },
      { id: 'br-6', sn: '6', description: 'RCC M30 in Girder', unit: 'cum', quantity: 60, rate: 32000, amount: 1920000, category: 'Superstructure' },
      { id: 'br-7', sn: '7', description: 'Bearing & Expansion Joint', unit: 'set', quantity: 4, rate: 250000, amount: 1000000, category: 'Accessories' },
      { id: 'br-8', sn: '8', description: 'Railing (MS)', unit: 'rm', quantity: 50, rate: 8500, amount: 425000, category: 'Accessories' },
      { id: 'br-9', sn: '9', description: 'Approach Road', unit: 'cum', quantity: 500, rate: 3200, amount: 1600000, category: 'Approach' },
    ],
  },
];

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
  const [currentYearBS, setCurrentYearBS] = useState(2081);
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
  const [quotedAmount, setQuotedAmount] = useState(0);

  // ─── Load sample template ───
  const loadSampleTemplate = (templateIndex: number) => {
    const template = SAMPLE_TEMPLATES[templateIndex];
    if (!template) return;
    const items: ParsedBoqRow[] = template.items.map(item => ({ ...item, selected: true }));
    // Auto-fill rates
    const rateMap = autoFillRates(items);
    const enhanced = items.map(item => {
      const match = rateMap.get(item.id);
      if (match) {
        return { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
      }
      return item;
    });
    setParsedItems(enhanced);
    if (!projectName) setProjectName(template.name.split('(')[0].trim());
    toast.success(`Loaded "${template.name}" with ${items.length} items`);
    setCurrentStep(3);
  };

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
        toast.error('No BoQ data found.');
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

      if (error) {
        items = parseCSVManually(textContent);
      } else if (data?.result) {
        items = (data.result as any[]).map((item: any, idx: number) => ({
          id: `boq-${idx + 1}`, sn: item.sn || String(idx + 1), description: item.description || '', unit: item.unit || 'LS',
          quantity: Number(item.quantity) || 0, rate: Number(item.rate) || 0, amount: Number(item.amount) || (Number(item.quantity) * Number(item.rate)) || 0,
          selected: true, category: item.category || 'General',
        }));
      } else {
        items = parseCSVManually(textContent);
      }

      setProcessingStatus('Auto-filling rates from norms...');
      setProcessingProgress(85);

      const rateMap = autoFillRates(items);
      items = items.map(item => {
        const match = rateMap.get(item.id);
        if (match && (item.rate === 0 || item.rate === undefined)) {
          return { ...item, rate: match.rate, amount: Math.round(item.quantity * match.rate), autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
        } else if (match) {
          return { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
        }
        return item;
      });

      setParsedItems(items);
      setProcessingProgress(100);
      setProcessingStatus('Done!');
      toast.success(`${items.length} items extracted`);
      setTimeout(() => setCurrentStep(3), 600);
    } catch (err) {
      console.error(err);
      const text = rawText || (uploadedFile ? await uploadedFile.text() : '');
      if (text) {
        setParsedItems(parseCSVManually(text));
        setProcessingProgress(100);
        setTimeout(() => setCurrentStep(3), 600);
      } else {
        toast.error('Processing failed.');
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
      if (desc) items.push({ id: `boq-${items.length + 1}`, sn: cols[0] || String(items.length + 1), description: desc, unit, quantity: qty, rate, amount, selected: true, category: 'General' });
    }
    return items;
  }

  // ─── Step 3: Editable table ───
  const toggleItem = (id: string) => setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  const selectAll = () => setParsedItems(prev => prev.map(item => ({ ...item, selected: true })));
  const deselectAll = () => setParsedItems(prev => prev.map(item => ({ ...item, selected: false })));

  const applyAutoRate = (id: string) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id === id && item.autoRate) return { ...item, rate: item.autoRate.rate, amount: Math.round(item.quantity * item.autoRate.rate) };
      return item;
    }));
  };

  const updateItemField = (id: string, field: 'description' | 'unit' | 'quantity' | 'rate', value: string | number) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const rate = field === 'rate' ? Number(value) : item.rate;
        updated.amount = Math.round(qty * rate);
        updated.quantity = qty;
        updated.rate = rate;
      }
      return updated;
    }));
  };

  const addNewRow = () => {
    const newId = `boq-${parsedItems.length + 1}`;
    setParsedItems(prev => [...prev, {
      id: newId, sn: String(parsedItems.length + 1), description: '', unit: 'cum',
      quantity: 0, rate: 0, amount: 0, selected: true, category: 'General',
    }]);
  };

  const deleteRow = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  // ─── Step 4: Cost Estimation ───
  const computeAllEstimates = useCallback(() => {
    const selected = parsedItems.filter(i => i.selected);
    const results: CostEstimationResult[] = [];
    results.push(engineersEstimate(selected, contingencyPercent, vatPercent, physicalContingency));
    if (refCost > 0) results.push(referenceProjectEstimate(refCost, refYear, currentYearBS, annualEscalation, scopeAdjustment));
    if (unitQuantity > 0) results.push(unitCostEstimate(unitStandardId, unitGradeIndex, unitQuantity, vatPercent));
    if (paramBaseAmount > 0) results.push(parametricEstimate(paramBaseAmount, paramFactors));
    setEstimationResults(results);
  }, [parsedItems, contingencyPercent, vatPercent, physicalContingency, refCost, refYear, currentYearBS, annualEscalation, scopeAdjustment, unitStandardId, unitGradeIndex, unitQuantity, paramBaseAmount, paramFactors]);

  useEffect(() => { if (currentStep === 4) computeAllEstimates(); }, [currentStep, computeAllEstimates]);

  // ─── Step 5: Gantt ───
  const generateGanttFromSelected = useCallback(() => {
    const selected = parsedItems.filter(i => i.selected);
    if (selected.length === 0) { toast.error('No items selected'); return; }
    const avgDuration = Math.max(1, Math.floor(totalDurationWeeks / selected.length));
    let cw = 1;
    const schedule: WorkScheduleItem[] = selected.map((item, idx) => {
      const duration = Math.max(1, Math.min(avgDuration + Math.floor(Math.random() * 2) - 1, totalDurationWeeks - cw + 1));
      const ws: WorkScheduleItem = { id: item.id, activity: item.description, duration, startWeek: cw, isMajor: item.amount > 0 && idx < Math.ceil(selected.length * 0.4), dependencies: idx > 0 ? [selected[idx - 1].id] : [] };
      cw += Math.max(1, Math.floor(duration * 0.65));
      return ws;
    });
    setWorkSchedule(schedule);
    setCurrentStep(5);
  }, [parsedItems, totalDurationWeeks]);

  const canGoNext = () => {
    if (currentStep === 1) return !!(uploadedFile || rawText.trim()) && projectName.trim().length > 0;
    if (currentStep === 2) return parsedItems.length > 0;
    if (currentStep === 3) return parsedItems.some(i => i.selected);
    if (currentStep === 4) return true;
    return false;
  };

  const goNext = () => {
    if (currentStep === 1) { setCurrentStep(2); setTimeout(() => processBoq(), 300); }
    else if (currentStep === 2) setCurrentStep(3);
    else if (currentStep === 3) setCurrentStep(4);
    else if (currentStep === 4) generateGanttFromSelected();
  };

  const goBack = () => { if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep); };

  const selectedCount = parsedItems.filter(i => i.selected).length;
  const totalAmount = parsedItems.filter(i => i.selected).reduce((s, i) => s + i.amount, 0);
  const autoFilledCount = parsedItems.filter(i => i.autoRate).length;
  const selectedStandard = UNIT_COST_STANDARDS.find(s => s.id === unitStandardId);

  // Final calculation
  const boqSubtotal = totalAmount;
  const vatAmount = Math.round(boqSubtotal * (vatPercent / 100));
  const grandTotal = boqSubtotal + vatAmount;
  const engineerEstimate = estimationResults.find(r => r.method.includes("Engineer"))?.estimatedCost || grandTotal;
  const belowPercent = engineerEstimate > 0 && quotedAmount > 0 ? ((engineerEstimate - quotedAmount) / engineerEstimate * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">BoQ Upload Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload BoQ → AI Processes → Edit Rates → Cost Estimation → Gantt Chart</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
        {STEP_LABELS.map(({ step, label, icon: Icon }, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all ${currentStep === step ? 'bg-primary text-primary-foreground shadow-md' : currentStep > step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {currentStep > step ? '✓' : <Icon className="h-4 w-4" />}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${currentStep === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {idx < STEP_LABELS.length - 1 && <div className={`w-6 md:w-10 h-0.5 mx-1 ${currentStep > step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* ═══ STEP 1: Upload ═══ */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> Upload Bill of Quantities</CardTitle>
              <CardDescription>Upload a file, paste data, or use a sample template below.</CardDescription>
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

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx,.txt" className="hidden" onChange={handleFileUpload} />
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                {uploadedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    <Button variant="ghost" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drop your BoQ file here or click to browse</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Supports CSV, Excel, or plain text</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Or paste BoQ data directly</Label>
                <textarea className="w-full h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none"
                  placeholder={`SN, Description, Unit, Quantity, Rate, Amount\n1, Earthwork Excavation, m3, 5000, 450, 2250000`}
                  value={rawText} onChange={handlePasteBoq}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sample Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Sample Templates (नमुना BoQ)</CardTitle>
              <CardDescription>Load a pre-filled BOQ template to get started quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {SAMPLE_TEMPLATES.map((t, i) => (
                  <Button key={i} variant="outline" className="h-auto py-3 flex flex-col items-start text-left" onClick={() => loadSampleTemplate(i)}>
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.items.length} items · {formatNPR(t.items.reduce((s, it) => s + it.amount, 0))}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ STEP 2: AI Processing ═══ */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> AI Processing</CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              {isProcessing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-medium">{processingStatus}</p>
                  <Progress value={processingProgress} className="max-w-md mx-auto" />
                </>
              ) : parsedItems.length > 0 ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><CheckSquare className="h-6 w-6 text-primary" /></div>
                  <p className="text-sm font-medium">✅ {parsedItems.length} items extracted</p>
                  {autoFilledCount > 0 && <p className="text-xs text-accent"><Sparkles className="h-3 w-3 inline mr-1" />{autoFilledCount} auto-rated</p>}
                </>
              ) : (
                <>
                  <Cpu className="h-12 w-12 text-muted-foreground mx-auto" />
                  <Button onClick={processBoq}><Cpu className="h-4 w-4 mr-2" /> Start Processing</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP 3: Editable Spreadsheet ═══ */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" /> Edit BoQ — Excel-style Editing</CardTitle>
            <CardDescription>
              {selectedCount}/{parsedItems.length} selected · {formatNPR(totalAmount)} subtotal
              {autoFilledCount > 0 && <span className="text-accent ml-2">· {autoFilledCount} auto-rated</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
              <Button variant="outline" size="sm" onClick={addNewRow}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
              <Badge variant="secondary" className="ml-auto">{selectedCount} selected</Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2.5 w-8"></th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground w-10">SN</th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground min-w-[200px]">Description</th>
                      <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground w-16">Unit</th>
                      <th className="px-2 py-2.5 text-right text-xs font-semibold text-muted-foreground w-20">Qty</th>
                      <th className="px-2 py-2.5 text-right text-xs font-semibold text-muted-foreground w-24">Rate</th>
                      <th className="px-2 py-2.5 text-right text-xs font-semibold text-muted-foreground w-28">Amount</th>
                      <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground w-24">Norm Rate</th>
                      <th className="px-2 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item, idx) => (
                      <tr key={item.id} className={`border-t border-border ${item.selected ? '' : 'opacity-40'} hover:bg-muted/20`}>
                        <td className="px-2 py-1.5">
                          <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id)} />
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <Input className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent"
                            value={item.description} onChange={e => updateItemField(item.id, 'description', e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input className="h-7 text-xs w-16 border-transparent hover:border-border focus:border-primary bg-transparent"
                            value={item.unit} onChange={e => updateItemField(item.id, 'unit', e.target.value)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="h-7 text-xs text-right w-20 border-transparent hover:border-border focus:border-primary bg-transparent"
                            value={item.quantity || ''} onChange={e => updateItemField(item.id, 'quantity', Number(e.target.value) || 0)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input type="number" className="h-7 text-xs text-right w-24 border-transparent hover:border-border focus:border-primary bg-transparent"
                            value={item.rate || ''} onChange={e => updateItemField(item.id, 'rate', Number(e.target.value) || 0)} />
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-medium text-xs">{item.amount.toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-center">
                          {item.autoRate ? (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-accent px-1" onClick={() => applyAutoRate(item.id)} title={item.autoRate.normDescription}>
                              <Sparkles className="h-3 w-3 mr-0.5" />{item.autoRate.rate.toLocaleString()}
                            </Button>
                          ) : <span className="text-muted-foreground/30 text-[10px]">—</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive" onClick={() => deleteRow(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 sticky bottom-0">
                    <tr className="border-t-2 border-primary/20">
                      <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-foreground">Subtotal (BOQ Total)</td>
                      <td className="px-2 py-2.5 text-right tabular-nums font-bold text-foreground">{formatNPR(totalAmount)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="border-t border-border">
                      <td colSpan={6} className="px-3 py-2 text-right text-xs text-muted-foreground">VAT ({vatPercent}%)</td>
                      <td className="px-2 py-2 text-right tabular-nums text-xs text-muted-foreground">{formatNPR(vatAmount)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="border-t border-primary/30 bg-primary/5">
                      <td colSpan={6} className="px-3 py-2.5 text-right text-sm font-bold text-primary">Grand Total (with VAT)</td>
                      <td className="px-2 py-2.5 text-right tabular-nums font-bold text-primary text-sm">{formatNPR(grandTotal)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
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
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> लागत अनुमान — Cost Estimation</CardTitle>
              <CardDescription>सार्वजनिक खरिद नियमावली अनुसार (PPMO Methods)</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={estimationTab} onValueChange={setEstimationTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="engineers" className="text-xs">दर विश्लेषण</TabsTrigger>
                  <TabsTrigger value="reference" className="text-xs">सन्दर्भ आयोजना</TabsTrigger>
                  <TabsTrigger value="unit-cost" className="text-xs">एकाइ लागत</TabsTrigger>
                  <TabsTrigger value="parametric" className="text-xs">अनुमानित विधि</TabsTrigger>
                </TabsList>

                <TabsContent value="engineers" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    BOQ जम्मा + भौतिक आकस्मिक + मूल्य आकस्मिक + VAT = अनुमानित लागत
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5"><Label className="text-xs">Physical Contingency %</Label><Input type="number" value={physicalContingency} onChange={e => setPhysicalContingency(Number(e.target.value))} min={0} max={15} step={0.5} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Price Contingency %</Label><Input type="number" value={contingencyPercent} onChange={e => setContingencyPercent(Number(e.target.value))} min={0} max={20} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">VAT %</Label><Input type="number" value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} min={0} max={20} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="reference" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5 inline mr-1" />समान आयोजनाको लागतलाई मूल्य सूचकांकले समायोजन गर्ने</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5"><Label className="text-xs">Reference Project Cost (NPR)</Label><Input type="number" value={refCost || ''} onChange={e => setRefCost(Number(e.target.value))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Reference Year (BS)</Label><Input type="number" value={refYear} onChange={e => setRefYear(Number(e.target.value))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Current Year (BS)</Label><Input type="number" value={currentYearBS} onChange={e => setCurrentYearBS(Number(e.target.value))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Annual Escalation %</Label><Input type="number" value={annualEscalation} onChange={e => setAnnualEscalation(Number(e.target.value))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Scope Adjustment %</Label><Input type="number" value={scopeAdjustment} onChange={e => setScopeAdjustment(Number(e.target.value))} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="unit-cost" className="space-y-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5 inline mr-1" />PPMO/DoR मानक एकाइ दर प्रयोग</div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5"><Label className="text-xs">Work Type</Label>
                      <Select value={unitStandardId} onValueChange={v => { setUnitStandardId(v); setUnitGradeIndex(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNIT_COST_STANDARDS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Grade</Label>
                      <Select value={String(unitGradeIndex)} onValueChange={v => setUnitGradeIndex(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{selectedStandard?.rates.map((r, i) => <SelectItem key={i} value={String(i)}>{r.grade}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Quantity</Label><Input type="number" value={unitQuantity} onChange={e => setUnitQuantity(Number(e.target.value))} min={0.1} step={0.1} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="parametric" className="space-y-4 mt-4">
                  <div className="space-y-1.5"><Label className="text-xs">Base Amount (NPR)</Label><Input type="number" value={paramBaseAmount || ''} onChange={e => setParamBaseAmount(Number(e.target.value))} /></div>
                  <Separator />
                  {paramFactors.map((f, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input className="flex-1 h-8 text-xs" value={f.label} onChange={e => { const nf = [...paramFactors]; nf[i] = { ...nf[i], label: e.target.value }; setParamFactors(nf); }} />
                      <Input className="w-20 h-8 text-xs text-right" type="number" value={f.percent} onChange={e => { const nf = [...paramFactors]; nf[i] = { ...nf[i], percent: Number(e.target.value) }; setParamFactors(nf); }} />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setParamFactors(paramFactors.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setParamFactors([...paramFactors, { label: 'New Factor', percent: 5 }])}>+ Add Factor</Button>
                </TabsContent>
              </Tabs>

              <div className="mt-4">
                <Button onClick={computeAllEstimates} className="w-full"><Calculator className="h-4 w-4 mr-2" /> Calculate All Estimates</Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {estimationResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><IndianRupee className="h-4 w-4 text-primary" /> Estimation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {estimationResults.map((r, i) => (
                    <Card key={i} className="border-primary/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{r.method}</p>
                        <p className="text-[9px] text-muted-foreground">{r.methodNe}</p>
                        <p className="text-lg font-bold text-primary mt-1 tabular-nums">{formatNPR(r.estimatedCost)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {estimationResults.map((r, i) => (
                  <div key={i}>
                    <Separator className="my-3" />
                    <h4 className="text-sm font-semibold mb-2">{r.method} <span className="text-muted-foreground font-normal text-xs">— {r.details}</span></h4>
                    {r.breakdown && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {r.breakdown.map((b, j) => {
                              const isTotal = j === r.breakdown!.length - 1;
                              return (
                                <tr key={j} className={`border-t border-border ${isTotal ? 'bg-primary/5 font-bold' : ''}`}>
                                  <td className="px-4 py-2">{b.label}</td>
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

                {/* Quoted Amount & Below % */}
                <Separator className="my-4" />
                <Card className="border-accent/30 bg-accent/5">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Your Quoted Amount (तपाईंको बोलपत्र रकम)
                    </h4>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Quoted Bid Amount (NPR)</Label>
                        <Input type="number" value={quotedAmount || ''} onChange={e => setQuotedAmount(Number(e.target.value))} placeholder="Enter your bid amount" className="text-lg font-bold" />
                      </div>
                      {quotedAmount > 0 && engineerEstimate > 0 && (
                        <div className="text-center pb-2">
                          <p className="text-xs text-muted-foreground">Below Estimate</p>
                          <p className={`text-2xl font-bold tabular-nums ${belowPercent > 0 ? 'text-accent' : belowPercent < 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {belowPercent > 0 ? '-' : '+'}{Math.abs(belowPercent).toFixed(2)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {belowPercent > 0 ? 'Below' : 'Above'} Engineer&apos;s Estimate
                          </p>
                        </div>
                      )}
                    </div>
                    {quotedAmount > 0 && (
                      <div className="border rounded-lg overflow-hidden mt-3">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">BOQ Subtotal</td><td className="px-4 py-2 text-right tabular-nums text-xs">{formatNPR(boqSubtotal)}</td></tr>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">VAT ({vatPercent}%)</td><td className="px-4 py-2 text-right tabular-nums text-xs">{formatNPR(vatAmount)}</td></tr>
                            <tr className="border-b border-border bg-muted/30"><td className="px-4 py-2 text-xs font-bold">Grand Total (with VAT)</td><td className="px-4 py-2 text-right tabular-nums font-bold text-xs">{formatNPR(grandTotal)}</td></tr>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">Engineer&apos;s Estimate</td><td className="px-4 py-2 text-right tabular-nums text-xs">{formatNPR(engineerEstimate)}</td></tr>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">Your Quoted Amount</td><td className="px-4 py-2 text-right tabular-nums text-xs font-bold">{formatNPR(quotedAmount)}</td></tr>
                            <tr className={`${belowPercent > 0 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
                              <td className="px-4 py-2 text-xs font-bold">{belowPercent > 0 ? 'Savings (Below Estimate)' : 'Over Estimate'}</td>
                              <td className="px-4 py-2 text-right tabular-nums font-bold text-xs">
                                {formatNPR(Math.abs(engineerEstimate - quotedAmount))} ({Math.abs(belowPercent).toFixed(2)}%)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
        <Button variant="outline" onClick={goBack} disabled={currentStep === 1}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <div className="text-xs text-muted-foreground">Step {currentStep} of 5</div>
        {currentStep < 5 && (
          <Button onClick={goNext} disabled={!canGoNext() || (currentStep === 2 && isProcessing)}>
            {currentStep === 4 ? 'Generate Gantt' : 'Next'}<ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {currentStep === 5 && (
          <Button onClick={() => { setCurrentStep(1); setParsedItems([]); setWorkSchedule([]); setUploadedFile(null); setRawText(''); }}>Start Over</Button>
        )}
      </div>
    </div>
  );
}
