import { useState, useRef, useCallback, useEffect } from 'react';
import { fullBidAnalysis, FullAnalysisResult, generateAISchedule } from '@/lib/ai-assist';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { saveBid } from '@/lib/storage';
import { getChecklistForType } from '@/lib/checklists';
import { BidType, BID_TYPE_LABELS, BOQItem, WorkScheduleItem } from '@/lib/types';
import { detectActivitiesFromBOQ, generateWorkSchedule } from '@/lib/work-schedule';
import {
  NRB_PRICE_INDEX_DATA,
  COEFFICIENT_PRESETS,
  PriceAdjustmentCoefficients,
  calculatePriceAdjustment,
  isPriceAdjustmentApplicable,
  PriceAdjustmentResult,
} from '@/lib/price-index';
import { exportPriceAdjustmentPDF, exportWorkSchedulePDF } from '@/lib/pdf-export';
import GanttChart from '@/components/GanttChart';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload, FileText, Calculator, Calendar, TrendingUp, AlertTriangle, CheckCircle,
  ArrowRight, ArrowLeft, Info, FileDown, Sparkles, Loader2, Cpu, BarChart3,
  ClipboardList, Eye, EyeOff, ChevronDown, ChevronUp, Link2, Columns2, List,
} from 'lucide-react';

// Extracted info field for the selectable list
interface ExtractedField {
  key: string;
  label: string;
  labelNe?: string;
  value: string;
  category: 'project' | 'dates' | 'financial' | 'eligibility' | 'conditions';
  selected: boolean;
}

// Component to display original document with highlighted extracted values
function OriginalDocumentView({ text, highlightValues, activeHighlight }: {
  text: string;
  highlightValues: string[];
  activeHighlight: string | null;
}) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (activeHighlight && ref.current) {
      const mark = ref.current.querySelector('mark[data-active="true"]');
      if (mark) mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeHighlight]);

  if (!text) return <p className="p-4 text-sm text-muted-foreground">No document text available</p>;

  // Build regex from values, sorted longest-first to match greedily
  const escaped = highlightValues
    .filter(v => v && v.length > 3)
    .sort((a, b) => b.length - a.length)
    .map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) {
    return <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">{text}</pre>;
  }

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <pre ref={ref} className="p-4 text-xs font-mono whitespace-pre-wrap text-foreground/80 leading-relaxed">
      {parts.map((part, i) => {
        const isMatch = escaped.some(e => part.toLowerCase() === e.toLowerCase().replace(/\\/g, ''));
        const isActive = activeHighlight && part.toLowerCase().includes(activeHighlight.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={i}
              data-active={isActive ? 'true' : 'false'}
              className={`rounded px-0.5 ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-primary/20 text-foreground'
              }`}
            >
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </pre>
  );
}

export default function BidAnalysis() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [phase, setPhase] = useState<WizardPhase>('upload');
  const [uploadedText, setUploadedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');

  // AI result
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResult | null>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [boqSelected, setBoqSelected] = useState<Set<string>>(new Set());
  const [specialConditions, setSpecialConditions] = useState<string[]>([]);

  // Editable values (user can override AI)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  // Work schedule
  const [workSchedule, setWorkSchedule] = useState<WorkScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Price adjustment
  const [coeffPreset, setCoeffPreset] = useState('road-works');
  const [coefficients, setCoefficients] = useState<PriceAdjustmentCoefficients>(COEFFICIENT_PRESETS['road-works'].coefficients);
  const [baseYear, setBaseYear] = useState('2080/81');
  const [currentYear, setCurrentYear] = useState('2082/83');
  const [priceAdjResult, setPriceAdjResult] = useState<PriceAdjustmentResult | null>(null);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['project', 'dates', 'financial', 'boq']));
  // Comparison view
  const [showComparison, setShowComparison] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  // File upload & auto-trigger analysis
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('Max 20MB'); return; }

    // Read text from the file
    try {
      const text = await file.text();
      if (text.trim().length > 50) {
        setUploadedText(text);
        toast.success(`"${file.name}" loaded — starting AI analysis...`);
        triggerAnalysis(text);
      } else {
        toast.info(`"${file.name}" uploaded. Paste the document text below for AI analysis.`);
      }
    } catch {
      toast.info(`"${file.name}" uploaded. Paste text content below for analysis.`);
    }
  }, []);

  // Trigger AI analysis
  const triggerAnalysis = useCallback(async (text: string) => {
    if (!text.trim()) { toast.error('No text to analyze'); return; }
    setPhase('analyzing');
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus('Sending document to AI...');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + Math.random() * 15, 85));
    }, 800);

    try {
      setAnalysisStatus('AI is reading and extracting all information...');
      const result = await fullBidAnalysis(text);

      clearInterval(progressInterval);
      setAnalysisProgress(95);
      setAnalysisStatus('Processing results...');

      if (result) {
        setAnalysisResult(result);
        processAnalysisResult(result);
        setAnalysisProgress(100);
        setAnalysisStatus('Analysis complete!');
        setTimeout(() => setPhase('review'), 500);
      } else {
        setPhase('upload');
        toast.error('Analysis returned no results. Try pasting more text.');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      setPhase('upload');
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Process AI result into selectable fields
  function processAnalysisResult(result: FullAnalysisResult) {
    const fields: ExtractedField[] = [];
    const addField = (key: string, label: string, value: string | undefined, category: ExtractedField['category'], labelNe?: string) => {
      if (value && value.trim()) {
        fields.push({ key, label, labelNe, value: value.trim(), category, selected: true });
      }
    };

    // Project identification
    addField('projectName', 'Project Name', result.projectName, 'project', 'परियोजनाको नाम');
    addField('employer', 'Employer / Procuring Entity', result.employer, 'project', 'नियोक्ता');
    addField('employerAddress', 'Employer Address', result.employerAddress, 'project');
    addField('district', 'District', result.district, 'project', 'जिल्ला');
    addField('ifbNumber', 'IFB Number', result.ifbNumber, 'project');
    addField('contractId', 'Contract ID', result.contractId, 'project');
    addField('lotNumber', 'Lot Number', result.lotNumber, 'project');
    addField('sourceOfFund', 'Source of Fund', result.sourceOfFund, 'project', 'कोषको स्रोत');
    addField('bidType', 'Bid Type', result.bidType ? BID_TYPE_LABELS[result.bidType as BidType] || result.bidType : undefined, 'project');

    // Dates
    addField('submissionDeadline', 'Submission Deadline', result.submissionDeadline, 'dates', 'पेश गर्ने मिति');
    addField('bidOpeningDate', 'Bid Opening Date', result.bidOpeningDate, 'dates');
    addField('preBidMeetingDate', 'Pre-Bid Meeting', result.preBidMeetingDate, 'dates');
    addField('siteVisitDate', 'Site Visit Date', result.siteVisitDate, 'dates');

    // Financial
    addField('estimatedCost', 'Estimated Cost (NPR)', result.estimatedCost, 'financial', 'अनुमानित लागत');
    addField('bidSecurityAmount', 'Bid Security Amount', result.bidSecurityAmount, 'financial', 'बोलपत्र जमानत');
    addField('earnestMoney', 'Earnest Money', result.earnestMoney, 'financial');
    addField('performanceSecurityPercent', 'Performance Security %', result.performanceSecurityPercent, 'financial');

    // Conditions
    addField('bidValidity', 'Bid Validity (days)', result.bidValidity, 'conditions');
    addField('completionPeriod', 'Completion Period (days)', result.completionPeriod, 'conditions', 'सम्पन्न अवधि');
    addField('commencementDays', 'Commencement Period (days)', result.commencementDays, 'conditions');
    addField('defectLiabilityPeriod', 'Defect Liability Period', result.defectLiabilityPeriod, 'conditions');

    // Eligibility
    addField('isJV', 'Joint Venture Allowed', result.isJV !== undefined ? (result.isJV ? 'Yes' : 'No') : undefined, 'eligibility');
    addField('maxJVPartners', 'Max JV Partners', result.maxJVPartners?.toString(), 'eligibility');
    addField('minimumExperienceYears', 'Min. Experience (years)', result.minimumExperienceYears?.toString(), 'eligibility');
    addField('minimumTurnover', 'Min. Annual Turnover', result.minimumTurnover, 'eligibility');

    setExtractedFields(fields);

    // Initialize edited values
    const edits: Record<string, string> = {};
    fields.forEach(f => { edits[f.key] = f.value; });
    setEditedValues(edits);

    // Process BOQ items
    if (result.boqItems && result.boqItems.length > 0) {
      const items: BOQItem[] = result.boqItems.map((item, idx) => ({
        id: crypto.randomUUID(),
        description: item.description,
        unit: item.unit || 'LS',
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        amount: item.amount || (item.quantity || 0) * (item.rate || 0),
      }));
      setBoqItems(items);
      setBoqSelected(new Set(items.map(i => i.id)));
    }

    if (result.specialConditions) {
      setSpecialConditions(result.specialConditions);
    }
  }

  // Toggle field selection
  const toggleField = (key: string) => {
    setExtractedFields(prev => prev.map(f => f.key === key ? { ...f, selected: !f.selected } : f));
  };

  const toggleBoqItem = (id: string) => {
    setBoqSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllBoq = () => setBoqSelected(new Set(boqItems.map(i => i.id)));
  const deselectAllBoq = () => setBoqSelected(new Set());

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  // Generate work schedule from selected BOQ
  async function handleGenerateSchedule() {
    const selected = boqItems.filter(i => boqSelected.has(i.id));
    if (selected.length === 0) { toast.error('Select BOQ items first'); return; }

    setScheduleLoading(true);
    const totalWeeks = editedValues.completionPeriod ? Math.round(parseInt(editedValues.completionPeriod) / 7) : 24;

    try {
      // Try AI schedule first
      const aiResult = await generateAISchedule(selected, {
        projectName: editedValues.projectName || 'Construction Project',
        totalDurationWeeks: totalWeeks,
      });

      if (aiResult && aiResult.activities.length > 0) {
        const idMap: string[] = [];
        const schedule: WorkScheduleItem[] = aiResult.activities.map((act, idx) => {
          const itemId = crypto.randomUUID();
          idMap.push(itemId);
          const predIds: string[] = [];
          let startWeek = 1;

          if (act.predecessors?.length > 0) {
            let maxEnd = 0;
            for (const predIdx of act.predecessors) {
              if (predIdx >= 0 && predIdx < idx) {
                predIds.push(idMap[predIdx]);
                const pred = schedule[predIdx];
                if (pred) maxEnd = Math.max(maxEnd, pred.startWeek + pred.duration + (act.lag || 0));
              }
            }
            if (maxEnd > 0) startWeek = maxEnd;
          } else if (idx > 0) {
            startWeek = schedule[idx - 1].startWeek + Math.ceil(schedule[idx - 1].duration * 0.6);
          }

          return { id: itemId, activity: act.name, duration: Math.max(1, act.duration), startWeek: Math.max(1, startWeek), isMajor: act.isMajor, dependencies: predIds };
        });
        setWorkSchedule(schedule);
        toast.success(`AI generated ${schedule.length} activities with dependencies`);
      } else {
        // Fallback
        const detected = detectActivitiesFromBOQ(selected);
        const schedule = generateWorkSchedule(detected, totalWeeks);
        setWorkSchedule(schedule);
        toast.success(`Auto-generated ${schedule.length} activities`);
      }
    } catch {
      const detected = detectActivitiesFromBOQ(selected);
      const schedule = generateWorkSchedule(detected, editedValues.completionPeriod ? Math.round(parseInt(editedValues.completionPeriod) / 7) : 24);
      setWorkSchedule(schedule);
    } finally {
      setScheduleLoading(false);
    }
  }

  // Price adjustment calculation
  function handleCalculatePriceAdj() {
    const baseIdx = NRB_PRICE_INDEX_DATA.find(d => d.fiscalYear === baseYear);
    const currIdx = NRB_PRICE_INDEX_DATA.find(d => d.fiscalYear === currentYear);
    if (!baseIdx || !currIdx) { toast.error('Select valid years'); return; }
    const amount = parseFloat(editedValues.estimatedCost || '0') || boqItems.filter(i => boqSelected.has(i.id)).reduce((s, i) => s + i.amount, 0);
    if (amount <= 0) { toast.error('No amount available'); return; }
    const result = calculatePriceAdjustment(coefficients, baseIdx, currIdx, amount);
    setPriceAdjResult(result);
    toast.success(`Multiplying Factor: ${result.multiplyingFactor}`);
  }

  // Create bid from selected data
  function handleCreateBid() {
    const selected = extractedFields.filter(f => f.selected);
    const val = (key: string) => editedValues[key] || '';
    const pName = val('projectName');
    const emp = val('employer');
    const subDate = val('submissionDeadline');
    if (!pName) { toast.error('Project name is required'); return; }

    const selectedBoq = boqItems.filter(i => boqSelected.has(i.id));
    const boqTotal = selectedBoq.reduce((s, i) => s + i.amount, 0);
    const bidTypeVal = (analysisResult?.bidType as BidType) || 'ncb-single';
    const totalWeeks = val('completionPeriod') ? Math.round(parseInt(val('completionPeriod')) / 7) : undefined;

    const id = crypto.randomUUID();
    saveBid({
      id,
      projectName: pName,
      employer: emp,
      employerAddress: val('employerAddress'),
      bidType: bidTypeVal,
      status: 'preparing',
      submissionDeadline: subDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      checklist: getChecklistForType(bidTypeVal),
      boqItems: selectedBoq,
      isJV: analysisResult?.isJV || false,
      jvPartners: [],
      runningContracts: [],
      workSchedule,
      totalDurationWeeks: totalWeeks,
      ifbNumber: val('ifbNumber'),
      contractId: val('contractId'),
      bidSecurityAmount: val('bidSecurityAmount'),
      bidValidity: val('bidValidity') || '120',
      completionPeriod: val('completionPeriod'),
      commencementDays: val('commencementDays') || '14',
      bidAmount: boqTotal > 0 ? boqTotal.toFixed(2) : val('estimatedCost'),
      bidAmountWords: '',
      performanceSecurityPercent: val('performanceSecurityPercent') || '5',
    });
    toast.success('Bid created with all selected data!');
    navigate(`/bid/${id}`);
  }

  const selectedFieldCount = extractedFields.filter(f => f.selected).length;
  const selectedBoqCount = boqSelected.size;
  const totalBoq = boqItems.filter(i => boqSelected.has(i.id)).reduce((s, i) => s + i.amount, 0);
  const categories = ['project', 'dates', 'financial', 'eligibility', 'conditions'] as const;
  const categoryLabels: Record<string, { label: string; icon: any }> = {
    project: { label: 'Project Details', icon: FileText },
    dates: { label: 'Important Dates', icon: Calendar },
    financial: { label: 'Financial Information', icon: Calculator },
    eligibility: { label: 'Eligibility Requirements', icon: ClipboardList },
    conditions: { label: 'Bid Conditions', icon: Info },
  };

  // Build highlighted original text
  const getHighlightedText = useCallback(() => {
    if (!uploadedText) return uploadedText;
    const allValues = extractedFields
      .filter(f => f.selected)
      .map(f => editedValues[f.key] || f.value)
      .filter(v => v.length > 3);
    // Also add BOQ descriptions
    boqItems.filter(i => boqSelected.has(i.id)).forEach(i => {
      if (i.description.length > 3) allValues.push(i.description);
    });
    return allValues;
  }, [uploadedText, extractedFields, editedValues, boqItems, boqSelected]);

  // Find value in original text and scroll
  const findInDocument = (value: string) => {
    setHighlightedField(value);
    setTimeout(() => setHighlightedField(null), 3000);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">AI Bid Document Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Upload → AI extracts everything → You select what you need → Create bid
          </p>
        </div>
      </div>

      {/* Phase: Upload */}
      {phase === 'upload' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> Upload Bidding Document
              </CardTitle>
              <CardDescription>
                Upload a text/CSV file or paste the full bid document text. AI will automatically extract all details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File upload */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".txt,.csv,.doc,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Drop your bid document here or click to browse</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Supports TXT, CSV, DOC files (for PDF, paste text below)</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-background text-xs text-muted-foreground">or paste document text</span></div>
              </div>

              <textarea
                className="w-full min-h-[250px] p-3 rounded-lg border border-border bg-background text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={`Paste the FULL text of your PPMO bidding document here...\n\nInclude:\n• IFB page / cover page\n• Data Sheet (ITB clauses)\n• BOQ / Bill of Quantities table\n• Special conditions\n\nAI will automatically extract:\n✓ Project name, employer, IFB number, contract ID\n✓ All dates (submission, opening, pre-bid meeting)\n✓ Financial details (estimated cost, bid security)\n✓ Eligibility (JV, experience, turnover)\n✓ BOQ items with quantities\n✓ Special conditions & notes`}
                value={uploadedText}
                onChange={(e) => setUploadedText(e.target.value)}
              />

              <Button
                onClick={() => triggerAnalysis(uploadedText)}
                disabled={!uploadedText.trim() || isAnalyzing}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="h-5 w-5" /> Analyze Document with AI
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase: Analyzing */}
      {phase === 'analyzing' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-5 max-w-md mx-auto">
              <Loader2 className="h-14 w-14 text-primary animate-spin mx-auto" />
              <div>
                <p className="text-lg font-semibold text-foreground">{analysisStatus}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI is reading your document and extracting all bid details, BOQ items, dates, and conditions...
                </p>
              </div>
              <Progress value={analysisProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">{Math.round(analysisProgress)}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase: Review — Selectable results */}
      {phase === 'review' && (
        <div className="space-y-4">
          {/* Summary banner */}
          {analysisResult?.summary && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Analysis Complete</p>
                    <p className="text-sm text-muted-foreground mt-1">{analysisResult.summary}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{extractedFields.length} fields extracted</span>
                      <span>•</span>
                      <span>{boqItems.length} BOQ items</span>
                      <span>•</span>
                      <span>{specialConditions.length} special conditions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium">
              <span className="text-primary">{selectedFieldCount}</span> of {extractedFields.length} fields selected
              {boqItems.length > 0 && <> · <span className="text-primary">{selectedBoqCount}</span> of {boqItems.length} BOQ items</>}
            </p>
            <div className="flex gap-2">
              <Button
                variant={showComparison ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="gap-1.5"
              >
                <Columns2 className="h-3.5 w-3.5" />
                {showComparison ? 'Hide Original' : 'Compare with Original'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExtractedFields(prev => prev.map(f => ({ ...f, selected: true })))}>
                Select All Fields
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPhase('upload'); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Re-analyze
              </Button>
            </div>
          </div>

          {/* Main content: comparison split or single column */}
          <div className={showComparison ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
            {/* Left panel: Original Document (only shown in comparison mode) */}
            {showComparison && (
              <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
                <Card className="h-full">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Original Document Text
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[calc(100vh-220px)] rounded-lg border border-border bg-muted/20 p-0">
                      <OriginalDocumentView
                        text={uploadedText}
                        highlightValues={getHighlightedText()}
                        activeHighlight={highlightedField}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Right panel: Extracted data */}
            <div className="space-y-4">

          {/* Categorized fields */}
          {categories.map(cat => {
            const catFields = extractedFields.filter(f => f.category === cat);
            if (catFields.length === 0) return null;
            const { label, icon: Icon } = categoryLabels[cat];
            const isExpanded = expandedSections.has(cat);
            const selectedInCat = catFields.filter(f => f.selected).length;

            return (
              <Card key={cat}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
                  onClick={() => toggleSection(cat)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                      <Badge variant="secondary" className="text-[10px]">{selectedInCat}/{catFields.length}</Badge>
                    </CardTitle>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 space-y-2">
                    {catFields.map(field => (
                      <div
                        key={field.key}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          field.selected ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'
                        }`}
                        onClick={() => toggleField(field.key)}
                      >
                        <Checkbox checked={field.selected} onCheckedChange={() => toggleField(field.key)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                            {field.labelNe && <span className="text-[10px] text-muted-foreground/60">({field.labelNe})</span>}
                          </div>
                          <Input
                            className="h-8 text-sm mt-1 border-none bg-transparent px-0 focus:bg-background focus:px-2 focus:border"
                            value={editedValues[field.key] || field.value}
                            onChange={(e) => {
                              e.stopPropagation();
                              setEditedValues(prev => ({ ...prev, [field.key]: e.target.value }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* BOQ items */}
          {boqItems.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
                onClick={() => toggleSection('boq')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Bill of Quantities (BOQ)
                    <Badge variant="secondary" className="text-[10px]">{selectedBoqCount}/{boqItems.length}</Badge>
                    {totalBoq > 0 && <Badge variant="outline" className="text-[10px]">NPR {totalBoq.toLocaleString()}</Badge>}
                  </CardTitle>
                  {expandedSections.has('boq') ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </CardHeader>
              {expandedSections.has('boq') && (
                <CardContent className="pt-0 space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllBoq}>Select All</Button>
                    <Button variant="outline" size="sm" onClick={deselectAllBoq}>Deselect All</Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 w-8"></th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">SN</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Description</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Unit</th>
                            <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                            <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground">Rate</th>
                            <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boqItems.map((item, idx) => (
                            <tr
                              key={item.id}
                              className={`border-t cursor-pointer transition-colors ${boqSelected.has(item.id) ? 'bg-primary/5' : 'opacity-50'} hover:bg-muted/30`}
                              onClick={() => toggleBoqItem(item.id)}
                            >
                              <td className="px-2 py-1.5"><Checkbox checked={boqSelected.has(item.id)} /></td>
                              <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                              <td className="px-2 py-1.5 max-w-[250px] truncate">{item.description}</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{item.unit}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{item.quantity.toLocaleString()}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{item.rate.toLocaleString()}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums font-medium">{item.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Special conditions */}
          {specialConditions.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Special Conditions & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {specialConditions.map((cond, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {cond}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action bar: What do you want to do? */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">What would you like to do?</CardTitle>
              <CardDescription>Choose actions based on the extracted information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Action 1: Create Bid */}
              <Button onClick={handleCreateBid} className="w-full gap-2 justify-start h-auto py-3" size="lg">
                <ArrowRight className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Create Bid from Selected Data</p>
                  <p className="text-xs opacity-80 font-normal">
                    {selectedFieldCount} fields + {selectedBoqCount} BOQ items → new bid with checklist
                  </p>
                </div>
              </Button>

              {/* Action 2: Generate Work Schedule */}
              <Button
                variant="outline"
                onClick={handleGenerateSchedule}
                disabled={selectedBoqCount === 0 || scheduleLoading}
                className="w-full gap-2 justify-start h-auto py-3"
              >
                {scheduleLoading ? <Loader2 className="h-5 w-5 animate-spin shrink-0" /> : <Cpu className="h-5 w-5 shrink-0" />}
                <div className="text-left">
                  <p className="font-semibold">Generate AI Work Schedule</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    AI analyzes {selectedBoqCount} BOQ items → creates activities with dependencies & Gantt chart
                  </p>
                </div>
              </Button>

              {/* Action 3: Price Adjustment */}
              <Button
                variant="outline"
                onClick={() => setPhase('actions')}
                className="w-full gap-2 justify-start h-auto py-3"
              >
                <TrendingUp className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Calculate Price Adjustment</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    NRB Price Index based calculation per PPA Section 55
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Work Schedule Preview (if generated) */}
          {workSchedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Generated Work Schedule ({workSchedule.length} activities)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/60 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left">#</th>
                          <th className="px-2 py-2 text-left">Activity</th>
                          <th className="px-2 py-2 text-center">Duration</th>
                          <th className="px-2 py-2 text-center">Start</th>
                          <th className="px-2 py-2 text-center">End</th>
                          <th className="px-2 py-2 text-left"><Link2 className="h-3 w-3 inline" /> Pred.</th>
                          <th className="px-2 py-2 text-center">Major</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workSchedule.map((item, idx) => {
                          const predNames = (item.dependencies || [])
                            .map(depId => { const pi = workSchedule.findIndex(w => w.id === depId); return pi >= 0 ? `${pi + 1}` : null; })
                            .filter(Boolean);
                          return (
                            <tr key={item.id} className={`border-t ${item.isMajor ? 'bg-primary/5 font-medium' : ''}`}>
                              <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                              <td className="px-2 py-1.5">{item.activity}</td>
                              <td className="px-2 py-1.5 text-center">{item.duration}w</td>
                              <td className="px-2 py-1.5 text-center">Wk {item.startWeek}</td>
                              <td className="px-2 py-1.5 text-center">Wk {item.startWeek + item.duration - 1}</td>
                              <td className="px-2 py-1.5">
                                {predNames.length > 0 ? predNames.map(p => <Badge key={p} variant="outline" className="text-[9px] h-4 px-1 mr-0.5">{p}FS</Badge>) : '—'}
                              </td>
                              <td className="px-2 py-1.5 text-center">{item.isMajor ? '★' : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gantt chart */}
                <GanttChart items={workSchedule} totalWeeks={editedValues.completionPeriod ? Math.round(parseInt(editedValues.completionPeriod) / 7) : 24} />

                <Button variant="outline" size="sm" className="gap-2" onClick={() => exportWorkSchedulePDF({
                  projectName: editedValues.projectName || '',
                  employer: editedValues.employer || '',
                  ifbNumber: editedValues.ifbNumber || '',
                  contractId: editedValues.contractId || '',
                  workSchedule,
                  totalDurationWeeks: editedValues.completionPeriod ? Math.round(parseInt(editedValues.completionPeriod) / 7) : 24,
                })}>
                  <FileDown className="h-3 w-3" /> Export Schedule PDF
                </Button>
              </CardContent>
            </Card>
          )}
            </div>{/* end right panel */}
          </div>{/* end grid/comparison wrapper */}
        </div>
      )}

      {/* Phase: Actions — Price Adjustment */}
      {phase === 'actions' && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setPhase('review')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Review
          </Button>

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
              </div>

              <div className="space-y-2">
                <Label>Work Type Preset</Label>
                <Select value={coeffPreset} onValueChange={v => { setCoeffPreset(v); setCoefficients(COEFFICIENT_PRESETS[v].coefficients); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COEFFICIENT_PRESETS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {([['a', 'Fixed'], ['b', 'Labor'], ['c', 'Materials'], ['d', 'Equipment'], ['e', 'Fuel']] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label} ({key})</Label>
                    <Input type="number" step="0.01" value={coefficients[key]}
                      onChange={e => setCoefficients({ ...coefficients, [key]: parseFloat(e.target.value) || 0 })}
                      className="text-sm text-center" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Base Year</Label>
                  <Select value={baseYear} onValueChange={setBaseYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NRB_PRICE_INDEX_DATA.map(d => (
                        <SelectItem key={d.fiscalYear} value={d.fiscalYear}>{d.fiscalYear}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Current Year</Label>
                  <Select value={currentYear} onValueChange={setCurrentYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NRB_PRICE_INDEX_DATA.map(d => (
                        <SelectItem key={d.fiscalYear} value={d.fiscalYear}>{d.fiscalYear}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCalculatePriceAdj} className="w-full gap-2">
                <Calculator className="h-4 w-4" /> Calculate
              </Button>

              {priceAdjResult && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4 space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Multiplying Factor (Pn)</p>
                      <p className="text-4xl font-bold text-primary">{priceAdjResult.multiplyingFactor}</p>
                      <p className="text-sm mt-1">Adjustment: <strong>{priceAdjResult.adjustmentPercent > 0 ? '+' : ''}{priceAdjResult.adjustmentPercent}%</strong></p>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span>Original:</span>
                      <span>NPR {(parseFloat(editedValues.estimatedCost || '0') || totalBoq).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Adjusted:</span>
                      <span>NPR {priceAdjResult.adjustedAmount.toLocaleString()}</span>
                    </div>
                    <Button variant="outline" className="w-full gap-2" onClick={() => exportPriceAdjustmentPDF({
                      projectName: editedValues.projectName || '', employer: editedValues.employer || '',
                      ifbNumber: editedValues.ifbNumber || '', contractId: editedValues.contractId || '',
                      baseYear, currentYear, coefficients,
                      coeffPresetLabel: COEFFICIENT_PRESETS[coeffPreset]?.label || coeffPreset,
                      result: priceAdjResult,
                      originalAmount: parseFloat(editedValues.estimatedCost || '0') || totalBoq,
                    })}>
                      <FileDown className="h-4 w-4" /> Export Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
