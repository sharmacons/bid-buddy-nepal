import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Cpu, CheckSquare, BarChart3, ArrowRight, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { BOQItem, WorkScheduleItem } from '@/lib/types';
import GanttChart from '@/components/GanttChart';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 1 | 2 | 3 | 4;

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
}

const STEP_LABELS = [
  { step: 1, label: 'Upload BoQ', icon: Upload },
  { step: 2, label: 'AI Processing', icon: Cpu },
  { step: 3, label: 'Review Items', icon: CheckSquare },
  { step: 4, label: 'Gantt Chart', icon: BarChart3 },
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

  // Step 1: File upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

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

  // Step 2: AI Processing
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

      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          type: 'parse-boq',
          text: textContent,
          projectName,
        },
      });

      setProcessingProgress(70);
      setProcessingStatus('Processing AI response...');

      if (error) {
        // Fallback: parse CSV manually
        console.warn('AI processing failed, using manual parsing:', error);
        const rows = parseCSVManually(textContent);
        setParsedItems(rows);
      } else if (data?.result) {
        const items: ParsedBoqRow[] = (data.result as any[]).map((item: any, idx: number) => ({
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
        setParsedItems(items);
      } else {
        // Fallback
        const rows = parseCSVManually(textContent);
        setParsedItems(rows);
      }

      setProcessingProgress(100);
      setProcessingStatus('Done!');
      toast.success(`${parsedItems.length || 'Multiple'} items extracted`);
      
      setTimeout(() => setCurrentStep(3), 600);
    } catch (err) {
      console.error('BoQ processing error:', err);
      // Fallback to manual parse
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
  }, [uploadedFile, rawText, projectName, parsedItems.length]);

  // Manual CSV parser fallback
  function parseCSVManually(text: string): ParsedBoqRow[] {
    const lines = text.split('\n').filter(l => l.trim());
    const items: ParsedBoqRow[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;
      // Skip header-like rows
      if (cols[0].toLowerCase().includes('sn') || cols[0].toLowerCase().includes('item')) continue;

      const desc = cols.length >= 3 ? cols[1] : cols[0];
      const unit = cols.length >= 4 ? cols[2] : 'LS';
      const qty = parseFloat(cols.length >= 4 ? cols[3] : cols[2]) || 0;
      const rate = parseFloat(cols.length >= 5 ? cols[4] : '0') || 0;
      const amount = parseFloat(cols.length >= 6 ? cols[5] : '0') || qty * rate;

      if (desc) {
        items.push({
          id: `boq-${items.length + 1}`,
          sn: cols[0] || String(items.length + 1),
          description: desc,
          unit,
          quantity: qty,
          rate,
          amount,
          selected: true,
          category: 'General',
        });
      }
    }
    return items;
  }

  // Step 3: Toggle item selection
  const toggleItem = (id: string) => {
    setParsedItems(prev =>
      prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item)
    );
  };

  const selectAll = () => setParsedItems(prev => prev.map(item => ({ ...item, selected: true })));
  const deselectAll = () => setParsedItems(prev => prev.map(item => ({ ...item, selected: false })));

  // Step 4: Generate work schedule from selected BoQ items
  const generateGanttFromSelected = useCallback(() => {
    const selected = parsedItems.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error('No items selected');
      return;
    }

    const avgDuration = Math.max(1, Math.floor(totalDurationWeeks / selected.length));
    let currentWeek = 1;

    const schedule: WorkScheduleItem[] = selected.map((item, idx) => {
      const duration = Math.max(1, Math.min(avgDuration + Math.floor(Math.random() * 2) - 1, totalDurationWeeks - currentWeek + 1));
      const ws: WorkScheduleItem = {
        id: item.id,
        activity: item.description,
        duration,
        startWeek: currentWeek,
        isMajor: item.amount > 0 && idx < Math.ceil(selected.length * 0.4),
        dependencies: idx > 0 ? [selected[idx - 1].id] : [],
      };
      // Overlap: next item starts at 60-80% of current item's duration
      currentWeek += Math.max(1, Math.floor(duration * 0.65));
      return ws;
    });

    setWorkSchedule(schedule);
    setCurrentStep(4);
  }, [parsedItems, totalDurationWeeks]);

  // Navigation
  const canGoNext = () => {
    if (currentStep === 1) return !!(uploadedFile || rawText.trim()) && projectName.trim().length > 0;
    if (currentStep === 2) return parsedItems.length > 0;
    if (currentStep === 3) return parsedItems.some(i => i.selected);
    return false;
  };

  const goNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setTimeout(() => processBoq(), 300);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      generateGanttFromSelected();
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep);
  };

  const selectedCount = parsedItems.filter(i => i.selected).length;
  const totalAmount = parsedItems.filter(i => i.selected).reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">BoQ Upload Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your Bill of Quantities → AI processes & categorizes → Review → Generate Gantt Chart
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
        {STEP_LABELS.map(({ step, label, icon: Icon }, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : currentStep > step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step ? '✓' : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                currentStep === step ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {idx < STEP_LABELS.length - 1 && (
              <div className={`w-8 md:w-16 h-0.5 mx-1 ${currentStep > step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload BoQ */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Bill of Quantities
            </CardTitle>
            <CardDescription>
              Upload a CSV/Excel file or paste your BoQ data directly. Provide project details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Kathmandu-Terai Road"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Project Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={projectStartDate}
                  onChange={e => setProjectStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Total Duration (weeks)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={4}
                  max={520}
                  value={totalDurationWeeks}
                  onChange={e => setTotalDurationWeeks(Number(e.target.value) || 24)}
                />
              </div>
            </div>

            {/* File upload area */}
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              {uploadedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB — Click to replace
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Drop your BoQ file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Supports CSV, Excel (.xls, .xlsx), or plain text
                  </p>
                </div>
              )}
            </div>

            {/* Or paste */}
            <div className="space-y-2">
              <Label>Or paste BoQ data directly</Label>
              <textarea
                className="w-full h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none"
                placeholder={`SN, Description, Unit, Quantity, Rate, Amount\n1, Earthwork Excavation, m3, 5000, 450, 2250000\n2, Sub-base Course, m3, 3000, 800, 2400000\n...`}
                value={rawText}
                onChange={handlePasteBoq}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Processing */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              AI Processing
            </CardTitle>
            <CardDescription>
              Analyzing and categorizing your BoQ items...
            </CardDescription>
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
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    ✅ {parsedItems.length} items extracted successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: NPR {parsedItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </p>
                </>
              ) : (
                <>
                  <Cpu className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Waiting to process...</p>
                  <Button onClick={processBoq}>
                    <Cpu className="h-4 w-4 mr-2" /> Start Processing
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review Items */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Review & Select Items
            </CardTitle>
            <CardDescription>
              {selectedCount} of {parsedItems.length} items selected · NPR {totalAmount.toLocaleString()} total
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
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-t border-border transition-colors cursor-pointer ${
                          item.selected ? 'bg-primary/5' : 'opacity-50'
                        } hover:bg-muted/30`}
                        onClick={() => toggleItem(item.id)}
                      >
                        <td className="px-3 py-2">
                          <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id)} />
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{item.sn}</td>
                        <td className="px-3 py-2 font-medium text-foreground max-w-[250px] truncate">{item.description}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.rate.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{item.amount.toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
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

      {/* Step 4: Gantt Chart */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Generated Gantt Chart
            </CardTitle>
            <CardDescription>
              {projectName} · {workSchedule.length} activities · {totalDurationWeeks} weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workSchedule.length > 0 ? (
              <GanttChart items={workSchedule} totalWeeks={totalDurationWeeks} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No schedule generated</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goBack} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="text-xs text-muted-foreground">
          Step {currentStep} of 4
        </div>

        {currentStep < 4 && (
          <Button onClick={goNext} disabled={!canGoNext() || (currentStep === 2 && isProcessing)}>
            {currentStep === 3 ? 'Generate Gantt' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}

        {currentStep === 4 && (
          <Button onClick={() => { setCurrentStep(1); setParsedItems([]); setWorkSchedule([]); setUploadedFile(null); setRawText(''); }}>
            Start Over
          </Button>
        )}
      </div>
    </div>
  );
}
