import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, Calculator, FileSpreadsheet, Settings, Layers, FileText } from 'lucide-react';
import {
  RATE_ANALYSIS_NORMS,
  STANDARD_MATERIALS,
  STANDARD_LABOR,
  STANDARD_EQUIPMENT,
  calculateRateAnalysis,
  type RateAnalysisResult,
  type MaterialRate,
} from '@/lib/rate-analysis-norms';
import { exportRateAnalysisExcel } from '@/lib/rate-analysis-export';
import { exportRateAnalysisPDF } from '@/lib/rate-analysis-pdf';

export default function RateAnalysis() {
  const { toast } = useToast();

  // Project name
  const [projectName, setProjectName] = useState('');

  // Global settings
  const [overheadPercent, setOverheadPercent] = useState(15);
  const [wastagePercent, setWastagePercent] = useState(2);

  // Material market rates (user input)
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>(
    () => STANDARD_MATERIALS.map(m => ({ ...m }))
  );

  // Labor rates
  const [laborRates, setLaborRates] = useState(
    () => STANDARD_LABOR.map(l => ({ ...l, rate: l.defaultRate }))
  );

  // Equipment rates
  const [equipmentRates, setEquipmentRates] = useState(
    () => STANDARD_EQUIPMENT.map(e => ({ ...e, rate: e.defaultRate }))
  );

  // Selected norms for analysis
  const [selectedNorms, setSelectedNorms] = useState<Set<string>>(new Set());

  // Group norms by category
  const groupedNorms = useMemo(() => {
    const groups: Record<string, typeof RATE_ANALYSIS_NORMS> = {};
    RATE_ANALYSIS_NORMS.forEach(n => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    });
    return groups;
  }, []);

  // Compute results
  const results: RateAnalysisResult[] = useMemo(() => {
    if (selectedNorms.size === 0) return [];
    const matMap = new Map(materialRates.map(m => [m.materialId, m.marketRate]));
    const labMap = new Map(laborRates.map(l => [l.role, l.rate]));
    const eqMap = new Map(equipmentRates.map(e => [e.equipment, e.rate]));

    return RATE_ANALYSIS_NORMS
      .filter(n => selectedNorms.has(n.id))
      .map(n => calculateRateAnalysis(n, matMap, labMap, eqMap, overheadPercent, wastagePercent));
  }, [selectedNorms, materialRates, laborRates, equipmentRates, overheadPercent, wastagePercent]);

  const handleMaterialRateChange = (idx: number, value: string) => {
    setMaterialRates(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], marketRate: parseFloat(value) || 0 };
      return updated;
    });
  };

  const handleLaborRateChange = (idx: number, value: string) => {
    setLaborRates(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], rate: parseFloat(value) || 0 };
      return updated;
    });
  };

  const handleEquipmentRateChange = (idx: number, value: string) => {
    setEquipmentRates(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], rate: parseFloat(value) || 0 };
      return updated;
    });
  };

  const toggleNorm = (id: string) => {
    setSelectedNorms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllCategory = (category: string) => {
    const norms = groupedNorms[category] || [];
    setSelectedNorms(prev => {
      const next = new Set(prev);
      const allSelected = norms.every(n => next.has(n.id));
      norms.forEach(n => allSelected ? next.delete(n.id) : next.add(n.id));
      return next;
    });
  };

  const handleExport = async () => {
    if (results.length === 0) {
      toast({ title: 'No items selected', description: 'Select work items and enter material rates first.', variant: 'destructive' });
      return;
    }
    const missingRates = materialRates.filter(m => {
      const needed = RATE_ANALYSIS_NORMS.filter(n => selectedNorms.has(n.id))
        .flatMap(n => n.materials.map(mat => mat.materialId));
      return needed.includes(m.materialId) && m.marketRate <= 0;
    });
    if (missingRates.length > 0) {
      toast({ title: 'Missing rates', description: `Enter market rates for: ${missingRates.map(m => m.material).join(', ')}`, variant: 'destructive' });
      return;
    }
    await exportRateAnalysisExcel({
      projectName,
      overheadPercent,
      wastagePercent,
      results,
      norms: RATE_ANALYSIS_NORMS.filter(n => selectedNorms.has(n.id)),
    });
    toast({ title: 'Excel exported!', description: 'Rate analysis downloaded as .xlsx' });
  };

  // Count materials needed for selected norms
  const neededMaterialIds = useMemo(() => {
    const ids = new Set<string>();
    RATE_ANALYSIS_NORMS.filter(n => selectedNorms.has(n.id))
      .forEach(n => n.materials.forEach(m => ids.add(m.materialId)));
    return ids;
  }, [selectedNorms]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground">Rate Analysis</h2>
          <p className="text-sm text-muted-foreground">दर विश्लेषण — DoR/DoLIDAR Standard Norms for Road, Bridge & Building Works</p>
        </div>
        <Button onClick={handleExport} disabled={results.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel (.xlsx)
        </Button>
      </div>

      {/* Project & Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" /> Project Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Project Name</Label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g., Kathmandu-Bhaktapur Road" />
            </div>
            <div>
              <Label>Overhead & Profit (%)</Label>
              <Input type="number" value={overheadPercent} onChange={e => setOverheadPercent(parseFloat(e.target.value) || 0)} min={0} max={50} />
              <p className="text-xs text-muted-foreground mt-1">Standard: 15% (PPMO)</p>
            </div>
            <div>
              <Label>Additional Wastage (%)</Label>
              <Input type="number" value={wastagePercent} onChange={e => setWastagePercent(parseFloat(e.target.value) || 0)} min={0} max={20} />
              <p className="text-xs text-muted-foreground mt-1">Added on top of material-specific wastage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="items" className="gap-1"><Layers className="h-3 w-3" /> Work Items</TabsTrigger>
          <TabsTrigger value="materials" className="gap-1">Materials</TabsTrigger>
          <TabsTrigger value="labor" className="gap-1">Labor</TabsTrigger>
          <TabsTrigger value="results" className="gap-1"><Calculator className="h-3 w-3" /> Results</TabsTrigger>
        </TabsList>

        {/* ── Work Items Selection ── */}
        <TabsContent value="items">
          <div className="space-y-4">
            {Object.entries(groupedNorms).map(([category, norms]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => selectAllCategory(category)}>
                      {norms.every(n => selectedNorms.has(n.id)) ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {norms.map(norm => (
                    <label key={norm.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedNorms.has(norm.id)}
                        onCheckedChange={() => toggleNorm(norm.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{norm.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">Unit: {norm.unit}</Badge>
                          <Badge variant="secondary" className="text-xs">{norm.materials.length} materials</Badge>
                          <Badge variant="secondary" className="text-xs">{norm.labor.length} labor</Badge>
                          {norm.equipment.length > 0 && (
                            <Badge variant="secondary" className="text-xs">{norm.equipment.length} equipment</Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedNorms.size > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              ✅ {selectedNorms.size} work items selected — go to <strong>Materials</strong> tab to enter market rates
            </p>
          )}
        </TabsContent>

        {/* ── Material Rates ── */}
        <TabsContent value="materials">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Market Rates of Raw Materials</CardTitle>
              <CardDescription>Enter current market rates (NPR). Items highlighted are needed for selected work items.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {materialRates.map((mat, idx) => {
                  const needed = neededMaterialIds.has(mat.materialId);
                  return (
                    <div key={mat.materialId} className={`flex items-center gap-3 p-2 rounded-lg border ${needed ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mat.material}</p>
                        <p className="text-xs text-muted-foreground">per {mat.unit}</p>
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          value={mat.marketRate || ''}
                          onChange={e => handleMaterialRateChange(idx, e.target.value)}
                          placeholder="NPR"
                          className="text-right h-8 text-sm"
                          min={0}
                        />
                      </div>
                      {needed && <Badge className="text-xs shrink-0">Required</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Equipment rates */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Equipment Rates</CardTitle>
              <CardDescription>Hourly/trip rates for construction equipment (NPR)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipmentRates.map((eq, idx) => (
                  <div key={eq.equipment} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">🚜 {eq.equipment}</p>
                      <p className="text-xs text-muted-foreground">per {eq.unit}</p>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        value={eq.rate || ''}
                        onChange={e => handleEquipmentRateChange(idx, e.target.value)}
                        placeholder="NPR"
                        className="text-right h-8 text-sm"
                        min={0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Labor Rates ── */}
        <TabsContent value="labor">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Labor Rates (per day)</CardTitle>
              <CardDescription>Daily wage rates in NPR. Defaults based on current market norms.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {laborRates.map((lab, idx) => (
                  <div key={lab.role} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">👷 {lab.role}</p>
                      <p className="text-xs text-muted-foreground">per {lab.unit}</p>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        value={lab.rate || ''}
                        onChange={e => handleLaborRateChange(idx, e.target.value)}
                        placeholder="NPR"
                        className="text-right h-8 text-sm"
                        min={0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Results ── */}
        <TabsContent value="results">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">No analysis yet</p>
                <p className="text-sm mt-1">Select work items, enter material rates, then come here to see results</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Rate Analysis Summary</CardTitle>
                    <Button onClick={handleExport} size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/70">
                        <th className="text-left p-2 border border-border font-medium">#</th>
                        <th className="text-left p-2 border border-border font-medium">Work Item</th>
                        <th className="text-left p-2 border border-border font-medium">Unit</th>
                        <th className="text-right p-2 border border-border font-medium">Material</th>
                        <th className="text-right p-2 border border-border font-medium">Labor</th>
                        <th className="text-right p-2 border border-border font-medium">Equipment</th>
                        <th className="text-right p-2 border border-border font-medium">OH ({overheadPercent}%)</th>
                        <th className="text-right p-2 border border-border font-medium font-bold">Total Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.normId} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <td className="p-2 border border-border">{i + 1}</td>
                          <td className="p-2 border border-border">{r.description}</td>
                          <td className="p-2 border border-border">{r.unit}</td>
                          <td className="p-2 border border-border text-right">{r.materialCost.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border border-border text-right">{r.laborCost.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border border-border text-right">{r.equipmentCost.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border border-border text-right">{r.overheadAmount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border border-border text-right font-bold">{r.totalRate.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Detailed breakdown cards */}
              {results.map((r) => (
                <Card key={r.normId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{r.description} <Badge variant="outline" className="ml-2">{r.unit}</Badge></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-1.5 border border-border">Item</th>
                            <th className="text-center p-1.5 border border-border">Unit</th>
                            <th className="text-right p-1.5 border border-border">Qty</th>
                            <th className="text-right p-1.5 border border-border">Rate</th>
                            <th className="text-right p-1.5 border border-border">Wastage</th>
                            <th className="text-right p-1.5 border border-border">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.breakdown.map((b, bi) => (
                            <tr key={bi} className={b.item.startsWith('👷') ? 'bg-green-50 dark:bg-green-950/20' : b.item.startsWith('🚜') ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}>
                              <td className="p-1.5 border border-border">{b.item}</td>
                              <td className="p-1.5 border border-border text-center">{b.unit}</td>
                              <td className="p-1.5 border border-border text-right">{b.quantity}</td>
                              <td className="p-1.5 border border-border text-right">{b.rate.toLocaleString()}</td>
                              <td className="p-1.5 border border-border text-right">{b.wastage > 0 ? `${b.wastage}%` : '—'}</td>
                              <td className="p-1.5 border border-border text-right font-medium">{b.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs">
                      <span className="text-muted-foreground">Material: <strong>NPR {r.materialCost.toLocaleString()}</strong></span>
                      <span className="text-muted-foreground">Labor: <strong>NPR {r.laborCost.toLocaleString()}</strong></span>
                      <span className="text-muted-foreground">Equipment: <strong>NPR {r.equipmentCost.toLocaleString()}</strong></span>
                      <span className="text-muted-foreground">Overhead: <strong>NPR {r.overheadAmount.toLocaleString()}</strong></span>
                      <span className="font-bold">Total: NPR {r.totalRate.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
