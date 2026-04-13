import { useState, useCallback, useRef, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, Cpu, CheckSquare, BarChart3,
  Loader2, Trash2, Calculator, Sparkles, AlertCircle, IndianRupee, Plus, Download, Printer,
  FolderTree, Calendar, Shield, FileText, Table2, Save,
} from 'lucide-react';
import { BOQItem, WorkScheduleItem, BidData, BidType } from '@/lib/types';
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
import {
  calculateBidQualification,
  WORK_NATURE_OPTIONS,
} from '@/lib/bid-qualification';
import { wrapDocumentWithLetterhead } from '@/lib/letterhead';
import { getCompanyProfile, saveBid, getBids } from '@/lib/storage';
import { getChecklistForType } from '@/lib/checklists';
import { fullBidAnalysis, FullAnalysisResult } from '@/lib/ai-assist';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
// ═══════════════════════════════════════════
// ─── TYPES ───
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// ─── PRINT HELPER ───
// ═══════════════════════════════════════════
function printContent(title: string, htmlContent: string) {
  const profile = getCompanyProfile();
  const printWindow = window.open('', '_blank');
  if (!printWindow) { toast.error('Please allow popups'); return; }
  printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Source Sans 3', 'Mukta', sans-serif; font-size: 11pt; color: #111; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
  td, th { border: 1px solid #333; padding: 4pt 6pt; text-align: left; font-size: 10pt; }
  th { background: #f0f0f0; font-weight: 700; }
  h1 { font-size: 16pt; text-align: center; margin: 12pt 0 8pt; }
  h2 { font-size: 13pt; margin: 10pt 0 6pt; border-bottom: 2px solid #333; padding-bottom: 3pt; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .total-row { background: #e8f5e9; font-weight: 700; }
  .info-box { border: 1px solid #ccc; padding: 8pt; margin: 8pt 0; border-radius: 4pt; background: #fafafa; }
  @media print { .no-print { display: none; } }
</style></head><body>
<button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:8px 16px;background:#1e3a5f;color:#fff;border:none;border-radius:4px;cursor:pointer;">🖨 Print / Save PDF</button>
${htmlContent}
</body></html>`);
  printWindow.document.close();
}

// ═══════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ═══════════════════════════════════════════

export default function BoqWizard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bid-doc');
  const [projectName, setProjectName] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [totalDurationWeeks, setTotalDurationWeeks] = useState(24);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedBoqRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bidDocInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // ─── Bid Info State (auto-populated from bid doc) ───
  const [employer, setEmployer] = useState('');
  const [employerAddress, setEmployerAddress] = useState('');
  const [ifbNumber, setIfbNumber] = useState('');
  const [contractId, setContractId] = useState('');
  const [bidType, setBidType] = useState<BidType>('ncb-single');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [bidValidity, setBidValidity] = useState('');
  const [completionPeriod, setCompletionPeriod] = useState('');
  const [commencementDays, setCommencementDays] = useState('');
  const [bidSecurityAmount, setBidSecurityAmount] = useState('');
  const [performanceSecurityPercent, setPerformanceSecurityPercent] = useState('');
  const [estimatedCostFromDoc, setEstimatedCostFromDoc] = useState('');
  const [isJV, setIsJV] = useState(false);
  const [savedBidId, setSavedBidId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bid Doc analysis state
  const [bidDocAnalyzing, setBidDocAnalyzing] = useState(false);
  const [bidDocProgress, setBidDocProgress] = useState(0);
  const [bidDocStatus, setBidDocStatus] = useState('');
  const [bidDocText, setBidDocText] = useState('');
  const [bidDocFile, setBidDocFile] = useState<File | null>(null);
  const [bidDocResult, setBidDocResult] = useState<FullAnalysisResult | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<{ label: string; value: string; key: string }[]>([]);

  // Excel BOQ upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelProcessing, setExcelProcessing] = useState(false);

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
  const [quotedAmount, setQuotedAmount] = useState(0);
  const [workNature, setWorkNature] = useState<string>('road');
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, { duration?: number; overlapPercent?: number }>>({});

  // ─── REAL-TIME COMPUTED VALUES ───
  const selectedItems = useMemo(() => parsedItems.filter(i => i.selected), [parsedItems]);
  const totalAmount = useMemo(() => selectedItems.reduce((s, i) => s + i.amount, 0), [selectedItems]);
  const vatAmount = useMemo(() => Math.round(totalAmount * (vatPercent / 100)), [totalAmount, vatPercent]);
  const grandTotal = useMemo(() => totalAmount + vatAmount, [totalAmount, vatAmount]);
  const autoFilledCount = useMemo(() => parsedItems.filter(i => i.autoRate).length, [parsedItems]);

  // Real-time estimation results
  const estimationResults = useMemo(() => {
    if (selectedItems.length === 0) return [];
    const results: CostEstimationResult[] = [];
    results.push(engineersEstimate(selectedItems, contingencyPercent, vatPercent, physicalContingency));
    if (refCost > 0) results.push(referenceProjectEstimate(refCost, refYear, currentYearBS, annualEscalation, scopeAdjustment));
    if (unitQuantity > 0) results.push(unitCostEstimate(unitStandardId, unitGradeIndex, unitQuantity, vatPercent));
    if (paramBaseAmount > 0) results.push(parametricEstimate(paramBaseAmount, paramFactors));
    return results;
  }, [selectedItems, contingencyPercent, vatPercent, physicalContingency, refCost, refYear, currentYearBS, annualEscalation, scopeAdjustment, unitStandardId, unitGradeIndex, unitQuantity, paramBaseAmount, paramFactors]);

  const engineerEstimate = useMemo(() => estimationResults.find(r => r.method.includes("Engineer"))?.estimatedCost || grandTotal, [estimationResults, grandTotal]);
  const belowPercent = useMemo(() => engineerEstimate > 0 && quotedAmount > 0 ? ((engineerEstimate - quotedAmount) / engineerEstimate * 100) : 0, [engineerEstimate, quotedAmount]);

  // Real-time bid qualification
  const qualificationCriteria = useMemo(() => {
    const cost = engineerEstimate || grandTotal;
    if (cost <= 0) return [];
    return calculateBidQualification({
      estimatedCost: cost,
      contractDurationMonths: Math.round(totalDurationWeeks * 7 / 30),
      workNature: workNature as any,
    });
  }, [engineerEstimate, grandTotal, totalDurationWeeks, workNature]);

  // Real-time work schedule
  const workSchedule = useMemo<WorkScheduleItem[]>(() => {
    if (selectedItems.length === 0) return [];
    const avgDuration = Math.max(1, Math.floor(totalDurationWeeks / selectedItems.length));
    const items: WorkScheduleItem[] = [];
    let cw = 1;
    for (let idx = 0; idx < selectedItems.length; idx++) {
      const item = selectedItems[idx];
      const override = scheduleOverrides[item.id];
      const baseDuration = override?.duration ?? Math.max(1, Math.min(avgDuration + Math.floor(Math.random() * 2) - 1, totalDurationWeeks - cw + 1));
      const duration = Math.max(1, Math.min(baseDuration, totalDurationWeeks - cw + 1));
      const overlapPct = override?.overlapPercent ?? 0;

      let startWeek = cw;
      if (idx > 0 && overlapPct > 0) {
        const prevItem = items[idx - 1];
        const overlapWeeks = Math.floor(prevItem.duration * (overlapPct / 100));
        startWeek = Math.max(1, prevItem.startWeek + prevItem.duration - overlapWeeks);
      }
      startWeek = Math.min(startWeek, totalDurationWeeks);

      const ws: WorkScheduleItem = {
        id: item.id, activity: item.description, duration, startWeek,
        isMajor: item.amount > 0 && idx < Math.ceil(selectedItems.length * 0.4),
        dependencies: idx > 0 ? [selectedItems[idx - 1].id] : [],
      };
      items.push(ws);
      cw = startWeek + duration;
    }
    return items;
  }, [selectedItems, totalDurationWeeks, scheduleOverrides]);

  // WBS grouping
  const wbsGroups = useMemo(() => {
    const groups = new Map<string, ParsedBoqRow[]>();
    for (const item of selectedItems) {
      const cat = item.category || 'General';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }
    return groups;
  }, [selectedItems]);

  const selectedStandard = UNIT_COST_STANDARDS.find(s => s.id === unitStandardId);

  // ─── SAVE ALL DATA ───
  const handleSaveAllData = useCallback(() => {
    if (!projectName.trim()) {
      toast.error('Project name is required to save.');
      return;
    }
    setIsSaving(true);
    try {
      const id = savedBidId || `bid-${Date.now()}`;
      const boqItems: BOQItem[] = selectedItems.map((item, idx) => ({
        id: item.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }));

      const bid: BidData = {
        id,
        projectName,
        employer,
        employerAddress,
        bidType,
        status: 'preparing',
        submissionDeadline: submissionDeadline || new Date().toISOString().slice(0, 10),
        createdAt: savedBidId ? (getBids().find(b => b.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        checklist: getChecklistForType(bidType),
        boqItems,
        isJV,
        jvPartners: [],
        runningContracts: [],
        workSchedule,
        totalDurationWeeks,
        ifbNumber,
        contractId,
        bidAmount: String(grandTotal),
        bidValidity,
        completionPeriod,
        commencementDays,
        bidSecurityAmount,
        performanceSecurityPercent,
      };

      saveBid(bid);
      setSavedBidId(id);
      toast.success('✅ All data saved successfully! You can view it in Bid Tracker.');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false);
    }
  }, [projectName, employer, employerAddress, bidType, submissionDeadline, selectedItems, workSchedule, totalDurationWeeks, ifbNumber, contractId, grandTotal, bidValidity, completionPeriod, commencementDays, bidSecurityAmount, performanceSecurityPercent, isJV, savedBidId]);
  const loadSampleTemplate = (templateIndex: number) => {
    const template = SAMPLE_TEMPLATES[templateIndex];
    if (!template) return;
    const items: ParsedBoqRow[] = template.items.map(item => ({ ...item, selected: true }));
    const rateMap = autoFillRates(items);
    const enhanced = items.map(item => {
      const match = rateMap.get(item.id);
      return match ? { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } } : item;
    });
    setParsedItems(enhanced);
    if (!projectName) setProjectName(template.name.split('(')[0].trim());
    toast.success(`Loaded "${template.name}" with ${items.length} items`);
    setActiveTab('boq');
  };

  // ─── File upload ───
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    toast.success(`File "${file.name}" loaded`);
  }, []);

  // ─── AI Processing ───
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
      if (!textContent.trim()) { toast.error('No BoQ data found.'); setIsProcessing(false); return; }
      setProcessingStatus('Sending to AI for categorization...');
      setProcessingProgress(30);
      let items: ParsedBoqRow[] = [];
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { type: 'parse-boq', text: textContent, projectName },
      });
      setProcessingProgress(70);
      if (error) items = parseCSVManually(textContent);
      else if (data?.result) {
        items = (data.result as any[]).map((item: any, idx: number) => ({
          id: `boq-${idx + 1}`, sn: item.sn || String(idx + 1), description: item.description || '', unit: item.unit || 'LS',
          quantity: Number(item.quantity) || 0, rate: Number(item.rate) || 0, amount: Number(item.amount) || (Number(item.quantity) * Number(item.rate)) || 0,
          selected: true, category: item.category || 'General',
        }));
      } else items = parseCSVManually(textContent);

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
      toast.success(`${items.length} items extracted`);
      setTimeout(() => setActiveTab('boq'), 600);
    } catch (err) {
      console.error(err);
      const text = rawText || (uploadedFile ? await uploadedFile.text() : '');
      if (text) { setParsedItems(parseCSVManually(text)); setTimeout(() => setActiveTab('boq'), 600); }
      else toast.error('Processing failed.');
    } finally { setIsProcessing(false); }
  }, [uploadedFile, rawText, projectName]);

  // ─── Bid Doc PDF Analysis ───
  const handleBidDocUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('Max 20MB file size'); return; }
    setBidDocFile(file);
    toast.success(`"${file.name}" loaded`);
  }, []);

  const analyzeBidDocument = useCallback(async () => {
    let text = bidDocText;
    if (bidDocFile && !text.trim()) {
      setBidDocStatus('Extracting text from file...');
      setBidDocProgress(5);
      try {
        // Try reading as text first (works for .txt files)
        const rawText = await bidDocFile.text();
        if (rawText.trim().length > 100 && !rawText.includes('\x00')) {
          text = rawText;
        } else {
          // For PDF files, try using pdfjs
          try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
            const arrayBuffer = await bidDocFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
            }
            text = fullText;
          } catch (pdfErr) {
            console.error('PDF parse error:', pdfErr);
            toast.error('Could not extract text from PDF. Please paste the document text manually.');
            return;
          }
        }
      } catch (err) {
        toast.error('Failed to read file');
        return;
      }
    }

    if (!text.trim()) { toast.error('No text to analyze. Paste or upload a document.'); return; }

    setBidDocAnalyzing(true);
    setBidDocProgress(10);
    setBidDocStatus('Sending to AI for comprehensive analysis...');

    const progressInterval = setInterval(() => {
      setBidDocProgress(prev => Math.min(prev + Math.random() * 12, 85));
    }, 800);

    try {
      setBidDocStatus('AI is extracting all information...');
      const result = await fullBidAnalysis(text);
      clearInterval(progressInterval);
      setBidDocProgress(95);

      if (result) {
        setBidDocResult(result);
        setBidDocStatus('Processing extracted data...');

        // Build extracted info for display
        const info: { label: string; value: string; key: string }[] = [];
        const add = (label: string, value: string | undefined, key: string) => {
          if (value?.trim()) info.push({ label, value: value.trim(), key });
        };
        add('Project Name (परियोजना)', result.projectName, 'projectName');
        add('Employer (नियोक्ता)', result.employer, 'employer');
        add('Employer Address', result.employerAddress, 'employerAddress');
        add('District (जिल्ला)', result.district, 'district');
        add('IFB Number', result.ifbNumber, 'ifbNumber');
        add('Contract ID', result.contractId, 'contractId');
        add('Lot Number', result.lotNumber, 'lotNumber');
        add('Source of Fund', result.sourceOfFund, 'sourceOfFund');
        add('Bid Type', result.bidType, 'bidType');
        add('Submission Deadline', result.submissionDeadline, 'submissionDeadline');
        add('Bid Opening Date', result.bidOpeningDate, 'bidOpeningDate');
        add('Pre-Bid Meeting', result.preBidMeetingDate, 'preBidMeetingDate');
        add('Site Visit Date', result.siteVisitDate, 'siteVisitDate');
        add('Estimated Cost (NPR)', result.estimatedCost, 'estimatedCost');
        add('Bid Security Amount', result.bidSecurityAmount, 'bidSecurityAmount');
        add('Bid Validity (days)', result.bidValidity, 'bidValidity');
        add('Completion Period (days)', result.completionPeriod, 'completionPeriod');
        add('Commencement (days)', result.commencementDays, 'commencementDays');
        add('Performance Security %', result.performanceSecurityPercent, 'performanceSecurityPercent');
        add('Defect Liability', result.defectLiabilityPeriod, 'defectLiabilityPeriod');
        add('JV Allowed', result.isJV !== undefined ? (result.isJV ? 'Yes' : 'No') : undefined, 'isJV');
        add('Min Experience (years)', result.minimumExperienceYears?.toString(), 'minExperience');
        add('Min Turnover', result.minimumTurnover, 'minTurnover');
        if (result.summary) add('Summary', result.summary, 'summary');
        setExtractedInfo(info);

        // Auto-populate ALL wizard fields from analysis
        if (result.projectName) setProjectName(result.projectName);
        if (result.employer) setEmployer(result.employer);
        if (result.employerAddress) setEmployerAddress(result.employerAddress);
        if (result.ifbNumber) setIfbNumber(result.ifbNumber);
        if (result.contractId) setContractId(result.contractId);
        if (result.submissionDeadline) setSubmissionDeadline(result.submissionDeadline);
        if (result.bidValidity) setBidValidity(result.bidValidity);
        if (result.bidSecurityAmount) setBidSecurityAmount(result.bidSecurityAmount);
        if (result.performanceSecurityPercent) setPerformanceSecurityPercent(result.performanceSecurityPercent);
        if (result.commencementDays) setCommencementDays(result.commencementDays);
        if (result.estimatedCost) setEstimatedCostFromDoc(result.estimatedCost);
        if (result.isJV !== undefined) setIsJV(result.isJV);
        if (result.bidType) {
          const bt = result.bidType.toLowerCase();
          if (bt.includes('double')) setBidType('ncb-double');
          else if (bt.includes('icb')) setBidType('icb');
          else if (bt.includes('quotation') || bt.includes('sealed')) setBidType('sealed-quotation');
          else setBidType('ncb-single');
        }
        if (result.completionPeriod) {
          setCompletionPeriod(result.completionPeriod);
          const days = parseInt(result.completionPeriod);
          if (days > 0) setTotalDurationWeeks(Math.ceil(days / 7));
        }

        // Auto-populate BOQ items if found
        if (result.boqItems && result.boqItems.length > 0) {
          const boqItems: ParsedBoqRow[] = result.boqItems.map((item, idx) => ({
            id: `bid-boq-${idx + 1}`,
            sn: item.sn || String(idx + 1),
            description: item.description || '',
            unit: item.unit || 'LS',
            quantity: Number(item.quantity) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || (Number(item.quantity) * Number(item.rate)) || 0,
            selected: true,
            category: 'General',
          }));
          const rateMap = autoFillRates(boqItems);
          const enhanced = boqItems.map(item => {
            const match = rateMap.get(item.id);
            if (match && (item.rate === 0)) {
              return { ...item, rate: match.rate, amount: Math.round(item.quantity * match.rate), autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
            } else if (match) {
              return { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
            }
            return item;
          });
          setParsedItems(enhanced);
          toast.success(`${enhanced.length} BOQ items extracted from bid document and loaded into wizard!`);
        }

        setBidDocProgress(100);
        setBidDocStatus('✅ Analysis complete!');
        toast.success('Bid document analyzed successfully! Data populated across all tabs.');
      } else {
        toast.error('No results from analysis. Try pasting more text.');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setBidDocAnalyzing(false);
    }
  }, [bidDocFile, bidDocText]);

  // ─── Excel BOQ Upload ───
  const handleExcelUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('Max 20MB'); return; }
    setExcelFile(file);
    setExcelProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: '' });

      if (jsonData.length === 0) { toast.error('No data found in the Excel file.'); setExcelProcessing(false); return; }

      // Try to detect columns (SN, Description, Unit, Quantity, Rate, Amount)
      const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim());
      const findCol = (keywords: string[]) => {
        const key = Object.keys(jsonData[0]).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
        return key || '';
      };

      const snCol = findCol(['sn', 's.n', 'no', '#', 'sl']);
      const descCol = findCol(['description', 'item', 'particular', 'work', 'activity', 'desc']);
      const unitCol = findCol(['unit', 'uom']);
      const qtyCol = findCol(['quantity', 'qty', 'qnty']);
      const rateCol = findCol(['rate', 'price', 'unit rate', 'unit price']);
      const amountCol = findCol(['amount', 'total', 'amt']);

      const items: ParsedBoqRow[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const desc = String(row[descCol] || '').trim();
        if (!desc || desc.toLowerCase().includes('description') || desc.toLowerCase().includes('particular')) continue;

        const qty = parseFloat(row[qtyCol]) || 0;
        const rate = parseFloat(row[rateCol]) || 0;
        const amt = parseFloat(row[amountCol]) || (qty * rate);

        items.push({
          id: `xls-${items.length + 1}`,
          sn: String(row[snCol] || items.length + 1),
          description: desc,
          unit: String(row[unitCol] || 'LS').trim(),
          quantity: qty,
          rate: rate,
          amount: amt,
          selected: true,
          category: 'General',
        });
      }

      if (items.length === 0) {
        // Fallback: send to AI for parsing
        const textContent = jsonData.map(r => Object.values(r).join('\t')).join('\n');
        const { data, error } = await supabase.functions.invoke('ai-assist', {
          body: { type: 'parse-boq', text: textContent, projectName },
        });
        if (!error && data?.result) {
          const aiItems: ParsedBoqRow[] = (data.result as any[]).map((item: any, idx: number) => ({
            id: `xls-${idx + 1}`, sn: item.sn || String(idx + 1), description: item.description || '', unit: item.unit || 'LS',
            quantity: Number(item.quantity) || 0, rate: Number(item.rate) || 0, amount: Number(item.amount) || 0,
            selected: true, category: item.category || 'General',
          }));
          const rateMap = autoFillRates(aiItems);
          const enhanced = aiItems.map(item => {
            const match = rateMap.get(item.id);
            if (match && item.rate === 0) return { ...item, rate: match.rate, amount: Math.round(item.quantity * match.rate), autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
            else if (match) return { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
            return item;
          });
          setParsedItems(enhanced);
          toast.success(`${enhanced.length} items parsed via AI from Excel`);
        } else {
          toast.error('Could not parse Excel. Check column headers.');
        }
      } else {
        const rateMap = autoFillRates(items);
        const enhanced = items.map(item => {
          const match = rateMap.get(item.id);
          if (match && item.rate === 0) return { ...item, rate: match.rate, amount: Math.round(item.quantity * match.rate), autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
          else if (match) return { ...item, autoRate: { rate: match.rate, normDescription: match.normDescription, confidence: match.confidence } };
          return item;
        });
        setParsedItems(enhanced);
        toast.success(`${enhanced.length} BOQ items loaded from Excel!`);
      }

      setActiveTab('boq');
    } catch (err) {
      console.error('Excel parse error:', err);
      toast.error('Failed to read Excel file.');
    } finally {
      setExcelProcessing(false);
    }
  }, [projectName]);

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

  // ─── Table editing ───
  const toggleItem = (id: string) => setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
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
  const addNewRow = () => setParsedItems(prev => [...prev, { id: `boq-${prev.length + 1}`, sn: String(prev.length + 1), description: '', unit: 'cum', quantity: 0, rate: 0, amount: 0, selected: true, category: 'General' }]);
  const deleteRow = (id: string) => setParsedItems(prev => prev.filter(item => item.id !== id));

  // ─── PRINT FUNCTIONS ───
  function printBoqTable() {
    let rows = selectedItems.map((item, i) =>
      `<tr><td class="text-center">${i + 1}</td><td>${item.description}</td><td class="text-center">${item.unit}</td><td class="text-right">${item.quantity.toLocaleString()}</td><td class="text-right">${item.rate.toLocaleString()}</td><td class="text-right">${item.amount.toLocaleString()}</td></tr>`
    ).join('');
    printContent(`BOQ — ${projectName}`, `
      <h1>Bill of Quantities (BOQ)</h1>
      <div class="info-box"><strong>Project:</strong> ${projectName} &nbsp;|&nbsp; <strong>Items:</strong> ${selectedItems.length} &nbsp;|&nbsp; <strong>Duration:</strong> ${totalDurationWeeks} weeks</div>
      <table><thead><tr><th class="text-center">SN</th><th>Description</th><th class="text-center">Unit</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount (NPR)</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="total-row"><td colspan="5" class="text-right">Subtotal</td><td class="text-right">${totalAmount.toLocaleString()}</td></tr>
        <tr><td colspan="5" class="text-right">VAT (${vatPercent}%)</td><td class="text-right">${vatAmount.toLocaleString()}</td></tr>
        <tr class="total-row"><td colspan="5" class="text-right font-bold">Grand Total</td><td class="text-right font-bold">${grandTotal.toLocaleString()}</td></tr>
      </tfoot></table>
    `);
  }

  function printEstimation() {
    let html = `<h1>Cost Estimation — ${projectName}</h1>
      <div class="info-box"><strong>BOQ Total:</strong> ${formatNPR(totalAmount)} &nbsp;|&nbsp; <strong>Grand Total (with VAT):</strong> ${formatNPR(grandTotal)}</div>`;
    for (const r of estimationResults) {
      html += `<h2>${r.method}</h2><p style="font-size:10pt;color:#555;">${r.methodNe} — ${r.details}</p>`;
      if (r.breakdown) {
        html += '<table><tbody>';
        r.breakdown.forEach((b, j) => {
          const isTotal = j === r.breakdown!.length - 1;
          html += `<tr${isTotal ? ' class="total-row"' : ''}><td>${b.label}</td><td class="text-right">${formatNPR(b.amount)}</td></tr>`;
        });
        html += '</tbody></table>';
      }
    }
    if (quotedAmount > 0) {
      html += `<h2>Quote Comparison</h2><table><tbody>
        <tr><td>Engineer's Estimate</td><td class="text-right">${formatNPR(engineerEstimate)}</td></tr>
        <tr><td>Your Quoted Amount</td><td class="text-right font-bold">${formatNPR(quotedAmount)}</td></tr>
        <tr class="total-row"><td>${belowPercent > 0 ? 'Below Estimate' : 'Above Estimate'}</td><td class="text-right">${Math.abs(belowPercent).toFixed(2)}%</td></tr>
      </tbody></table>`;
    }
    printContent(`Cost Estimation — ${projectName}`, html);
  }

  function printQualification() {
    let rows = qualificationCriteria.map(c =>
      `<tr><td>${c.label}</td><td>${c.labelNe}</td><td class="text-right font-bold">${c.value}</td><td style="font-size:9pt;color:#555;">${c.formula}</td></tr>`
    ).join('');
    printContent(`Bid Qualification — ${projectName}`, `
      <h1>Bid Qualification Requirements</h1>
      <h2 style="text-align:center;border:none;">बोलपत्र योग्यता आवश्यकताहरू (PPMO)</h2>
      <div class="info-box"><strong>Estimated Cost:</strong> ${formatNPR(engineerEstimate)} &nbsp;|&nbsp; <strong>Nature:</strong> ${WORK_NATURE_OPTIONS.find(o => o.value === workNature)?.label || workNature} &nbsp;|&nbsp; <strong>Duration:</strong> ${totalDurationWeeks} weeks</div>
      <table><thead><tr><th>Criteria</th><th>मापदण्ड</th><th class="text-right">Value</th><th>Formula</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  }

  function printWBS() {
    let html = `<h1>Work Breakdown Structure (WBS)</h1>
      <div class="info-box"><strong>Project:</strong> ${projectName} &nbsp;|&nbsp; <strong>Activities:</strong> ${selectedItems.length}</div>`;
    wbsGroups.forEach((items, category) => {
      html += `<h2>📂 ${category} (${items.length} items — ${formatNPR(items.reduce((s, i) => s + i.amount, 0))})</h2>
        <table><thead><tr><th class="text-center">SN</th><th>Activity</th><th class="text-center">Unit</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th></tr></thead><tbody>`;
      items.forEach((item, i) => {
        html += `<tr><td class="text-center">${i + 1}</td><td>${item.description}</td><td class="text-center">${item.unit}</td><td class="text-right">${item.quantity.toLocaleString()}</td><td class="text-right">${item.rate.toLocaleString()}</td><td class="text-right">${item.amount.toLocaleString()}</td></tr>`;
      });
      html += `</tbody></table>`;
    });
    printContent(`WBS — ${projectName}`, html);
  }

  function printSchedule() {
    let rows = workSchedule.map((item, i) =>
      `<tr><td class="text-center">${i + 1}</td><td>${item.activity}</td><td class="text-center">${item.duration}w</td><td class="text-center">W${item.startWeek}</td><td class="text-center">W${item.startWeek + item.duration - 1}</td><td class="text-center">${item.isMajor ? '★' : '—'}</td></tr>`
    ).join('');
    printContent(`Schedule — ${projectName}`, `
      <h1>Construction Schedule</h1>
      <div class="info-box"><strong>Project:</strong> ${projectName} &nbsp;|&nbsp; <strong>Duration:</strong> ${totalDurationWeeks} weeks &nbsp;|&nbsp; <strong>Activities:</strong> ${workSchedule.length}</div>
      <table><thead><tr><th class="text-center">SN</th><th>Activity</th><th class="text-center">Duration</th><th class="text-center">Start</th><th class="text-center">End</th><th class="text-center">Major</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  }

  // ═══════════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">BoQ Upload Wizard</h1>
          <p className="text-sm text-muted-foreground mt-1">Bid Doc → BOQ Excel → Edit → Estimate → Qualify → WBS → Gantt (all real-time)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveAllData} disabled={isSaving || !projectName.trim()} className="gap-1.5">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savedBidId ? 'Update Saved Data' : 'Save All Data'}
          </Button>
          {savedBidId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/bid/${savedBidId}`)}>
              View Bid →
            </Button>
          )}
        </div>
      </div>

      {/* Extracted Project Info Bar */}
      {(employer || ifbNumber || submissionDeadline || bidSecurityAmount) && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-3 flex flex-wrap gap-x-4 gap-y-1 items-center text-xs">
            {employer && <span>Employer: <strong>{employer}</strong></span>}
            {ifbNumber && <><Separator orientation="vertical" className="h-4" /><span>IFB: <strong>{ifbNumber}</strong></span></>}
            {contractId && <><Separator orientation="vertical" className="h-4" /><span>Contract: <strong>{contractId}</strong></span></>}
            {submissionDeadline && <><Separator orientation="vertical" className="h-4" /><span>Deadline: <strong>{submissionDeadline}</strong></span></>}
            {bidSecurityAmount && <><Separator orientation="vertical" className="h-4" /><span>Bid Security: <strong>{bidSecurityAmount}</strong></span></>}
            {completionPeriod && <><Separator orientation="vertical" className="h-4" /><span>Duration: <strong>{completionPeriod} days</strong></span></>}
            {performanceSecurityPercent && <><Separator orientation="vertical" className="h-4" /><span>Perf. Security: <strong>{performanceSecurityPercent}%</strong></span></>}
          </CardContent>
        </Card>
      )}

      {/* Live summary bar */}
      {parsedItems.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex flex-wrap gap-4 items-center text-xs">
            <span><strong>{selectedItems.length}</strong>/{parsedItems.length} items</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Subtotal: <strong>{formatNPR(totalAmount)}</strong></span>
            <Separator orientation="vertical" className="h-4" />
            <span>VAT: <strong>{formatNPR(vatAmount)}</strong></span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-primary font-bold">Grand Total: {formatNPR(grandTotal)}</span>
            {engineerEstimate !== grandTotal && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span>Engineer's Est: <strong>{formatNPR(engineerEstimate)}</strong></span>
              </>
            )}
            {quotedAmount > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className={belowPercent > 0 ? 'text-accent font-bold' : 'text-destructive font-bold'}>
                  {belowPercent > 0 ? '↓' : '↑'}{Math.abs(belowPercent).toFixed(2)}% {belowPercent > 0 ? 'Below' : 'Above'}
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="bid-doc" className="text-xs gap-1"><FileText className="h-3 w-3" /> Bid Doc</TabsTrigger>
          <TabsTrigger value="excel-boq" className="text-xs gap-1"><Table2 className="h-3 w-3" /> BOQ Excel</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1"><Upload className="h-3 w-3" /> Upload</TabsTrigger>
          <TabsTrigger value="boq" className="text-xs gap-1"><CheckSquare className="h-3 w-3" /> BOQ</TabsTrigger>
          <TabsTrigger value="estimation" className="text-xs gap-1"><Calculator className="h-3 w-3" /> Estimate</TabsTrigger>
          <TabsTrigger value="qualification" className="text-xs gap-1"><Shield className="h-3 w-3" /> Qualify</TabsTrigger>
          <TabsTrigger value="wbs" className="text-xs gap-1"><FolderTree className="h-3 w-3" /> WBS</TabsTrigger>
          <TabsTrigger value="gantt" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> Gantt</TabsTrigger>
        </TabsList>

        {/* ═══ BID DOC TAB ═══ */}
        <TabsContent value="bid-doc" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> बोलपत्र कागजात विश्लेषण — Bid Document Analysis</CardTitle>
              <CardDescription>Upload a complete bid document (PDF/TXT) and AI will extract all major items, dates, amounts, BOQ, and project details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors" onClick={() => bidDocInputRef.current?.click()}>
                <input ref={bidDocInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleBidDocUpload} />
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                {bidDocFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{bidDocFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(bidDocFile.size / 1024).toFixed(1)} KB</p>
                    <Button variant="ghost" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); setBidDocFile(null); if (bidDocInputRef.current) bidDocInputRef.current.value = ''; }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drop your Bid Document here (PDF, TXT)</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">AI will extract project info, dates, amounts, and BOQ items</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Or paste bid document text directly</Label>
                <textarea className="w-full h-36 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Paste the full bid document text here... AI will extract all information including project name, dates, financial details, eligibility criteria, and BOQ items."
                  value={bidDocText} onChange={e => setBidDocText(e.target.value)}
                />
              </div>

              {(bidDocFile || bidDocText.trim()) && (
                <Button className="w-full" onClick={analyzeBidDocument} disabled={bidDocAnalyzing}>
                  {bidDocAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{bidDocStatus}</> : <><Cpu className="h-4 w-4 mr-2" /> Analyze Full Bid Document with AI</>}
                </Button>
              )}
              {bidDocAnalyzing && <Progress value={bidDocProgress} />}
            </CardContent>
          </Card>

          {/* Extracted Info Display */}
          {extractedInfo.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Extracted Information ({extractedInfo.length} items found)</CardTitle>
                <CardDescription>Data auto-populated into wizard tabs. BOQ items loaded into BOQ tab.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Field</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Extracted Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedInfo.map((info, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/20">
                          <td className="px-3 py-2 text-xs font-medium text-muted-foreground">{info.label}</td>
                          <td className="px-3 py-2 text-xs font-medium text-foreground">{info.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {bidDocResult?.boqItems && bidDocResult.boqItems.length > 0 && (
                  <div className="mt-3 p-3 bg-accent/10 rounded-lg">
                    <p className="text-xs font-medium text-accent">✅ {bidDocResult.boqItems.length} BOQ items extracted and loaded into the BOQ tab</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => setActiveTab('boq')} disabled={parsedItems.length === 0}>
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> View BOQ Items ({parsedItems.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('estimation')} disabled={parsedItems.length === 0}>
                    <Calculator className="h-3.5 w-3.5 mr-1" /> View Estimation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('gantt')} disabled={parsedItems.length === 0}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1" /> View Gantt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bidDocResult?.specialConditions && bidDocResult.specialConditions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">विशेष शर्तहरू — Special Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {bidDocResult.specialConditions.map((c, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-destructive/70 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ EXCEL BOQ TAB ═══ */}
        <TabsContent value="excel-boq" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Table2 className="h-5 w-5 text-primary" /> BOQ Excel Upload — एक्सेल बोक्यू अपलोड</CardTitle>
              <CardDescription>Upload an Excel (.xls/.xlsx) file with BOQ items. Columns are auto-detected (SN, Description, Unit, Quantity, Rate, Amount).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors" onClick={() => excelInputRef.current?.click()}>
                <input ref={excelInputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleExcelUpload} />
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                {excelFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{excelFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(excelFile.size / 1024).toFixed(1)} KB</p>
                    {excelProcessing && <Loader2 className="h-5 w-5 animate-spin mx-auto mt-2 text-primary" />}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drop your Excel BOQ file here (.xls, .xlsx)</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Auto-detects columns: SN, Description, Unit, Quantity, Rate, Amount</p>
                  </div>
                )}
              </div>

              {parsedItems.length > 0 && (
                <div className="p-3 bg-accent/10 rounded-lg flex items-center justify-between">
                  <p className="text-xs font-medium text-accent">✅ {parsedItems.length} BOQ items loaded — data flows to all tabs automatically</p>
                  <Button size="sm" onClick={() => setActiveTab('boq')}>
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> Edit BOQ
                  </Button>
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-xs font-semibold mb-2">Expected Excel Format:</h4>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1.5 text-left">SN</th>
                        <th className="px-2 py-1.5 text-left">Description</th>
                        <th className="px-2 py-1.5 text-left">Unit</th>
                        <th className="px-2 py-1.5 text-right">Quantity</th>
                        <th className="px-2 py-1.5 text-right">Rate</th>
                        <th className="px-2 py-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t"><td className="px-2 py-1">1</td><td className="px-2 py-1">Earthwork Excavation</td><td className="px-2 py-1">cum</td><td className="px-2 py-1 text-right">5000</td><td className="px-2 py-1 text-right">450</td><td className="px-2 py-1 text-right">2,250,000</td></tr>
                      <tr className="border-t"><td className="px-2 py-1">2</td><td className="px-2 py-1">Sub-base Course</td><td className="px-2 py-1">cum</td><td className="px-2 py-1 text-right">2500</td><td className="px-2 py-1 text-right">2800</td><td className="px-2 py-1 text-right">7,000,000</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Column headers are auto-detected. Similar column names like "Item", "Particular", "Qty" also work.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ UPLOAD TAB ═══ */}
        <TabsContent value="upload" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> Upload Bill of Quantities</CardTitle>
              <CardDescription>Upload a file, paste data, or use a sample template below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input id="projectName" placeholder="e.g. Kathmandu-Terai Road" value={projectName} onChange={e => setProjectName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={projectStartDate} onChange={e => setProjectStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input id="duration" type="number" min={4} max={520} value={totalDurationWeeks} onChange={e => setTotalDurationWeeks(Number(e.target.value) || 24)} />
                </div>
                <div className="space-y-2">
                  <Label>Work Nature</Label>
                  <Select value={workNature} onValueChange={setWorkNature}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WORK_NATURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
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
                  value={rawText} onChange={e => setRawText(e.target.value)}
                />
              </div>

              {(uploadedFile || rawText.trim()) && projectName.trim() && (
                <Button className="w-full" onClick={processBoq} disabled={isProcessing}>
                  {isProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{processingStatus}</> : <><Cpu className="h-4 w-4 mr-2" /> Process with AI</>}
                </Button>
              )}
              {isProcessing && <Progress value={processingProgress} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Sample Templates (नमुना BoQ)</CardTitle>
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
        </TabsContent>

        {/* ═══ BOQ TAB ═══ */}
        <TabsContent value="boq" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" /> Edit BoQ — Excel-style</CardTitle>
                <CardDescription>
                  {selectedItems.length}/{parsedItems.length} selected · {formatNPR(totalAmount)}
                  {autoFilledCount > 0 && <span className="text-accent ml-2">· {autoFilledCount} auto-rated</span>}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={printBoqTable}>
                <Printer className="h-3.5 w-3.5" /> Print BOQ
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setParsedItems(prev => prev.map(item => ({ ...item, selected: true })))}>Select All</Button>
                <Button variant="outline" size="sm" onClick={() => setParsedItems(prev => prev.map(item => ({ ...item, selected: false })))}>Deselect All</Button>
                <Button variant="outline" size="sm" onClick={addNewRow}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
                <Badge variant="secondary" className="ml-auto">{selectedItems.length} selected</Badge>
              </div>

              {parsedItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">No BOQ items yet. Go to Upload tab to load data.</p>
                </div>
              ) : (
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
                            <td className="px-2 py-1.5"><Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id)} /></td>
                            <td className="px-2 py-1.5 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-2 py-1.5"><Input className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent" value={item.description} onChange={e => updateItemField(item.id, 'description', e.target.value)} /></td>
                            <td className="px-2 py-1.5"><Input className="h-7 text-xs w-16 border-transparent hover:border-border focus:border-primary bg-transparent" value={item.unit} onChange={e => updateItemField(item.id, 'unit', e.target.value)} /></td>
                            <td className="px-2 py-1.5"><Input type="number" className="h-7 text-xs text-right w-20 border-transparent hover:border-border focus:border-primary bg-transparent" value={item.quantity || ''} onChange={e => updateItemField(item.id, 'quantity', Number(e.target.value) || 0)} /></td>
                            <td className="px-2 py-1.5"><Input type="number" className="h-7 text-xs text-right w-24 border-transparent hover:border-border focus:border-primary bg-transparent" value={item.rate || ''} onChange={e => updateItemField(item.id, 'rate', Number(e.target.value) || 0)} /></td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-medium text-xs">{item.amount.toLocaleString()}</td>
                            <td className="px-2 py-1.5 text-center">
                              {item.autoRate ? (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-accent px-1" onClick={() => applyAutoRate(item.id)} title={item.autoRate.normDescription}>
                                  <Sparkles className="h-3 w-3 mr-0.5" />{item.autoRate.rate.toLocaleString()}
                                </Button>
                              ) : <span className="text-muted-foreground/30 text-[10px]">—</span>}
                            </td>
                            <td className="px-2 py-1.5">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive" onClick={() => deleteRow(item.id)}><Trash2 className="h-3 w-3" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/40 sticky bottom-0">
                        <tr className="border-t-2 border-primary/20">
                          <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-foreground">Subtotal</td>
                          <td className="px-2 py-2.5 text-right tabular-nums font-bold text-foreground">{formatNPR(totalAmount)}</td>
                          <td colSpan={2}></td>
                        </tr>
                        <tr className="border-t border-border">
                          <td colSpan={6} className="px-3 py-2 text-right text-xs text-muted-foreground">VAT ({vatPercent}%)</td>
                          <td className="px-2 py-2 text-right tabular-nums text-xs text-muted-foreground">{formatNPR(vatAmount)}</td>
                          <td colSpan={2}></td>
                        </tr>
                        <tr className="border-t border-primary/30 bg-primary/5">
                          <td colSpan={6} className="px-3 py-2.5 text-right text-sm font-bold text-primary">Grand Total</td>
                          <td className="px-2 py-2.5 text-right tabular-nums font-bold text-primary text-sm">{formatNPR(grandTotal)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ESTIMATION TAB ═══ */}
        <TabsContent value="estimation" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> लागत अनुमान — Cost Estimation</CardTitle>
                <CardDescription>सार्वजनिक खरिद नियमावली अनुसार (PPMO Methods) — Auto-updates as you edit BOQ</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={printEstimation} disabled={estimationResults.length === 0}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
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
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />BOQ जम्मा + भौतिक आकस्मिक + मूल्य आकस्मिक + VAT = अनुमानित लागत
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
            </CardContent>
          </Card>

          {/* Results */}
          {estimationResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><IndianRupee className="h-4 w-4 text-primary" /> Estimation Results (Real-time)</CardTitle>
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

                {/* Quoted Amount */}
                <Separator className="my-4" />
                <Card className="border-accent/30 bg-accent/5">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Your Quoted Amount (तपाईंको बोलपत्र रकम)</h4>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Quoted Bid Amount (NPR)</Label>
                        <Input type="number" value={quotedAmount || ''} onChange={e => setQuotedAmount(Number(e.target.value))} placeholder="Enter your bid amount" className="text-lg font-bold" />
                      </div>
                      {quotedAmount > 0 && engineerEstimate > 0 && (
                        <div className="text-center pb-2">
                          <p className="text-xs text-muted-foreground">Below Estimate</p>
                          <p className={`text-2xl font-bold tabular-nums ${belowPercent > 0 ? 'text-accent' : 'text-destructive'}`}>
                            {belowPercent > 0 ? '-' : '+'}{Math.abs(belowPercent).toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>
                    {quotedAmount > 0 && (
                      <div className="border rounded-lg overflow-hidden mt-3">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">BOQ Subtotal</td><td className="px-4 py-2 text-right tabular-nums text-xs">{formatNPR(totalAmount)}</td></tr>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">VAT ({vatPercent}%)</td><td className="px-4 py-2 text-right tabular-nums text-xs">{formatNPR(vatAmount)}</td></tr>
                            <tr className="border-b border-border bg-muted/30"><td className="px-4 py-2 text-xs font-bold">Grand Total</td><td className="px-4 py-2 text-right tabular-nums font-bold text-xs">{formatNPR(grandTotal)}</td></tr>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">Engineer&apos;s Estimate</td><td className="px-4 py-2 text-right tabular-nums text-xs">{formatNPR(engineerEstimate)}</td></tr>
                            <tr className="border-b border-border"><td className="px-4 py-2 text-xs">Your Quoted Amount</td><td className="px-4 py-2 text-right tabular-nums text-xs font-bold">{formatNPR(quotedAmount)}</td></tr>
                            <tr className={`${belowPercent > 0 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
                              <td className="px-4 py-2 text-xs font-bold">{belowPercent > 0 ? 'Savings (Below)' : 'Over Estimate'}</td>
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
        </TabsContent>

        {/* ═══ QUALIFICATION TAB ═══ */}
        <TabsContent value="qualification" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> बोलपत्र योग्यता — Bid Qualification Requirements</CardTitle>
                <CardDescription>PPMO सार्वजनिक खरिद नियमावली अनुसार — Based on estimated cost of {formatNPR(engineerEstimate)}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={printQualification} disabled={qualificationCriteria.length === 0}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </CardHeader>
            <CardContent>
              {qualificationCriteria.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">Add BOQ items first to calculate qualification requirements.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Criteria</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">मापदण्ड</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Value</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qualificationCriteria.map((c, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/20">
                          <td className="px-3 py-2 text-xs font-medium">{c.label}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{c.labelNe}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-bold text-xs text-primary">{c.value}</td>
                          <td className="px-3 py-2 text-[10px] text-muted-foreground">{c.formula}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick summary cards */}
          {qualificationCriteria.length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {qualificationCriteria.filter(c => c.amount > 0).slice(0, 6).map((c, i) => (
                <Card key={i} className="border-primary/15">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
                    <p className="text-base font-bold text-primary mt-1 tabular-nums">{c.value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{c.formula}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ WBS TAB ═══ */}
        <TabsContent value="wbs" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-primary" /> Work Breakdown Structure (WBS)</CardTitle>
                <CardDescription>Hierarchical breakdown by category — {wbsGroups.size} groups, {selectedItems.length} activities</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={printWBS} disabled={selectedItems.length === 0}>
                <Printer className="h-3.5 w-3.5" /> Print WBS
              </Button>
            </CardHeader>
            <CardContent>
              {selectedItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderTree className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">Add BOQ items to generate WBS.</p>
                </div>
              ) : (
                <div className="space-y-1 pl-2">
                  <div className="font-semibold text-sm text-foreground mb-3">📁 {projectName || 'Project'}</div>
                  {Array.from(wbsGroups.entries()).map(([category, items]) => {
                    const catTotal = items.reduce((s, i) => s + i.amount, 0);
                    const catPercent = totalAmount > 0 ? ((catTotal / totalAmount) * 100).toFixed(1) : '0';
                    return (
                      <div key={category} className="ml-4 mb-3">
                        <div className="font-medium text-xs text-primary mb-1 flex items-center gap-2">
                          📂 {category}
                          <Badge variant="secondary" className="text-[10px] h-4">{items.length} items</Badge>
                          <span className="text-muted-foreground ml-auto tabular-nums">{formatNPR(catTotal)} ({catPercent}%)</span>
                        </div>
                        {items.map((item, i) => (
                          <div key={item.id} className="ml-4 flex items-center gap-2 text-xs py-1 border-l-2 border-primary/30 pl-3">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span className="font-medium flex-1">{item.description}</span>
                            <span className="text-muted-foreground tabular-nums">{item.quantity} {item.unit}</span>
                            <span className="text-muted-foreground tabular-nums">@ {item.rate.toLocaleString()}</span>
                            <span className="font-medium tabular-nums text-right min-w-[80px]">{formatNPR(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <div className="ml-4 flex items-center justify-between text-sm font-bold text-primary">
                    <span>Total</span>
                    <span className="tabular-nums">{formatNPR(totalAmount)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WBS Cost Distribution */}
          {wbsGroups.size > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cost Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(wbsGroups.entries()).map(([category, items]) => {
                    const catTotal = items.reduce((s, i) => s + i.amount, 0);
                    const pct = totalAmount > 0 ? (catTotal / totalAmount) * 100 : 0;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{category}</span>
                          <span className="tabular-nums text-muted-foreground">{formatNPR(catTotal)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ GANTT TAB ═══ */}
        <TabsContent value="gantt" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Construction Schedule & Gantt Chart</CardTitle>
                <CardDescription>{projectName || 'Project'} · {workSchedule.length} activities · {totalDurationWeeks} weeks</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={printSchedule} disabled={workSchedule.length === 0}>
                <Printer className="h-3.5 w-3.5" /> Print Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {workSchedule.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">Add BOQ items to auto-generate the construction schedule.</p>
                </div>
              ) : (
                <>
                  {/* Schedule table */}
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Overlap Profile:</span>
                      {([
                        { label: 'Conservative', desc: 'No overlap', values: () => 0 },
                        { label: 'Standard', desc: '20-40%', values: (i: number) => i === 0 ? 0 : 30 },
                        { label: 'Aggressive', desc: '50-70%', values: (i: number) => i === 0 ? 0 : 60 },
                      ] as const).map(profile => (
                        <Button
                          key={profile.label}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const overrides: Record<string, { duration?: number; overlapPercent?: number }> = {};
                            workSchedule.forEach((item, i) => {
                              overrides[item.id] = {
                                ...scheduleOverrides[item.id],
                                overlapPercent: profile.values(i),
                              };
                            });
                            setScheduleOverrides(overrides);
                          }}
                        >
                          {profile.label}
                          <span className="text-muted-foreground ml-1">({profile.desc})</span>
                        </Button>
                      ))}
                    </div>
                    {Object.keys(scheduleOverrides).length > 0 && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => setScheduleOverrides({})}>
                        Reset All
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-10">SN</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Activity</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-24">Duration (w)</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-24">Overlap %</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-20">Start</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-20">End</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-16">Major</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workSchedule.map((item, i) => {
                            const override = scheduleOverrides[item.id] || {};
                            return (
                              <tr key={item.id} className="border-t border-border hover:bg-muted/20">
                                <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                                <td className="px-3 py-1.5 font-medium text-xs">{item.activity}</td>
                                <td className="px-2 py-1">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={totalDurationWeeks}
                                    value={override.duration ?? item.duration}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      setScheduleOverrides(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], duration: Math.max(1, Math.min(val, totalDurationWeeks)) }
                                      }));
                                    }}
                                    className="h-7 text-center text-xs w-16 mx-auto"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  {i === 0 ? (
                                    <span className="text-xs text-muted-foreground text-center block">—</span>
                                  ) : (
                                    <Input
                                      type="number"
                                      min={0}
                                      max={80}
                                      value={override.overlapPercent ?? 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setScheduleOverrides(prev => ({
                                          ...prev,
                                          [item.id]: { ...prev[item.id], overlapPercent: Math.max(0, Math.min(val, 80)) }
                                        }));
                                      }}
                                      className="h-7 text-center text-xs w-16 mx-auto"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-1.5 text-center tabular-nums text-xs">W{item.startWeek}</td>
                                <td className="px-3 py-1.5 text-center tabular-nums text-xs">W{item.startWeek + item.duration - 1}</td>
                                <td className="px-3 py-1.5 text-center">{item.isMajor ? '★' : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Gantt Chart */}
                  <GanttChart items={workSchedule} totalWeeks={totalDurationWeeks} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
