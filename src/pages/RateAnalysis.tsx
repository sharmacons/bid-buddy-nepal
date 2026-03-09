import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Download, Calculator, FileSpreadsheet, Settings, Layers, FileText, Search, HelpCircle, Plus, Trash2, ChevronDown, Info } from 'lucide-react';
import {
  RATE_ANALYSIS_NORMS,
  STANDARD_MATERIALS,
  STANDARD_LABOR,
  STANDARD_EQUIPMENT,
  calculateRateAnalysis,
  type RateAnalysisNorm,
  type RateAnalysisResult,
  type MaterialRate,
  type MaterialRequirement,
  type LaborRequirement,
  type EquipmentRequirement,
} from '@/lib/rate-analysis-norms';
import { exportRateAnalysisExcel } from '@/lib/rate-analysis-export';
import { exportRateAnalysisPDF } from '@/lib/rate-analysis-pdf';

const CUSTOM_NORMS_KEY = 'bidready-custom-norms';

function loadCustomNorms(): RateAnalysisNorm[] {
  try {
    const raw = localStorage.getItem(CUSTOM_NORMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomNorms(norms: RateAnalysisNorm[]) {
  localStorage.setItem(CUSTOM_NORMS_KEY, JSON.stringify(norms));
}

export default function RateAnalysis() {
  const { toast } = useToast();

  const [projectName, setProjectName] = useState('');
  const [overheadPercent, setOverheadPercent] = useState(15);
  const [wastagePercent, setWastagePercent] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNormId, setExpandedNormId] = useState<string | null>(null);

  const [materialRates, setMaterialRates] = useState<MaterialRate[]>(
    () => STANDARD_MATERIALS.map(m => ({ ...m }))
  );
  const [laborRates, setLaborRates] = useState(
    () => STANDARD_LABOR.map(l => ({ ...l, rate: l.defaultRate }))
  );
  const [equipmentRates, setEquipmentRates] = useState(
    () => STANDARD_EQUIPMENT.map(e => ({ ...e, rate: e.defaultRate }))
  );

  const [selectedNorms, setSelectedNorms] = useState<Set<string>>(new Set());
  const [customNorms, setCustomNorms] = useState<RateAnalysisNorm[]>(loadCustomNorms);

  // Custom norm form state
  const [newNorm, setNewNorm] = useState({
    description: '', category: '', unit: 'cu.m',
    materials: [] as MaterialRequirement[],
    labor: [] as LaborRequirement[],
    equipment: [] as EquipmentRequirement[],
  });

  // All norms (standard + custom)
  const allNorms = useMemo(() => [...RATE_ANALYSIS_NORMS, ...customNorms], [customNorms]);

  // Group norms by category (filtered by search)
  const groupedNorms = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? allNorms.filter(n =>
          n.description.toLowerCase().includes(query) ||
          n.category.toLowerCase().includes(query) ||
          n.unit.toLowerCase().includes(query) ||
          n.materials.some(m => m.material.toLowerCase().includes(query))
        )
      : allNorms;

    const groups: Record<string, RateAnalysisNorm[]> = {};
    filtered.forEach(n => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    });
    return groups;
  }, [allNorms, searchQuery]);

  // All categories for custom norm dropdown
  const allCategories = useMemo(() => {
    const cats = new Set(allNorms.map(n => n.category));
    return Array.from(cats).sort();
  }, [allNorms]);

  // Compute results
  const results: RateAnalysisResult[] = useMemo(() => {
    if (selectedNorms.size === 0) return [];
    const matMap = new Map(materialRates.map(m => [m.materialId, m.marketRate]));
    const labMap = new Map(laborRates.map(l => [l.role, l.rate]));
    const eqMap = new Map(equipmentRates.map(e => [e.equipment, e.rate]));

    return allNorms
      .filter(n => selectedNorms.has(n.id))
      .map(n => calculateRateAnalysis(n, matMap, labMap, eqMap, overheadPercent, wastagePercent));
  }, [selectedNorms, materialRates, laborRates, equipmentRates, overheadPercent, wastagePercent, allNorms]);

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
      const needed = allNorms.filter(n => selectedNorms.has(n.id))
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
      norms: allNorms.filter(n => selectedNorms.has(n.id)),
    });
    toast({ title: 'Excel exported!', description: 'Rate analysis downloaded as .xlsx' });
  };

  const handlePDFExport = () => {
    if (results.length === 0) {
      toast({ title: 'No items selected', description: 'Select work items and enter material rates first.', variant: 'destructive' });
      return;
    }
    exportRateAnalysisPDF({
      projectName,
      overheadPercent,
      wastagePercent,
      results,
      norms: allNorms.filter(n => selectedNorms.has(n.id)),
    });
    toast({ title: 'PDF ready!', description: 'Use browser Print → Save as PDF' });
  };

  const neededMaterialIds = useMemo(() => {
    const ids = new Set<string>();
    allNorms.filter(n => selectedNorms.has(n.id))
      .forEach(n => n.materials.forEach(m => ids.add(m.materialId)));
    return ids;
  }, [selectedNorms, allNorms]);

  // ── Custom Norm Handlers ──
  const addCustomNorm = () => {
    if (!newNorm.description.trim()) {
      toast({ title: 'Enter a description', variant: 'destructive' });
      return;
    }
    if (!newNorm.category.trim()) {
      toast({ title: 'Enter a category', variant: 'destructive' });
      return;
    }
    const norm: RateAnalysisNorm = {
      id: `custom-${Date.now()}`,
      category: newNorm.category,
      description: newNorm.description,
      unit: newNorm.unit,
      materials: newNorm.materials,
      labor: newNorm.labor,
      equipment: newNorm.equipment,
    };
    const updated = [...customNorms, norm];
    setCustomNorms(updated);
    saveCustomNorms(updated);
    setNewNorm({ description: '', category: '', unit: 'cu.m', materials: [], labor: [], equipment: [] });
    toast({ title: 'Custom norm added!', description: norm.description });
  };

  const deleteCustomNorm = (id: string) => {
    const updated = customNorms.filter(n => n.id !== id);
    setCustomNorms(updated);
    saveCustomNorms(updated);
    setSelectedNorms(prev => { const next = new Set(prev); next.delete(id); return next; });
    toast({ title: 'Custom norm deleted' });
  };

  const addMaterialToNorm = () => {
    setNewNorm(prev => ({
      ...prev,
      materials: [...prev.materials, { materialId: '', material: '', unit: 'kg', quantity: 0, wastageDefault: 3 }],
    }));
  };

  const addLaborToNorm = () => {
    setNewNorm(prev => ({
      ...prev,
      labor: [...prev.labor, { role: '', unit: 'day', quantity: 0 }],
    }));
  };

  const addEquipmentToNorm = () => {
    setNewNorm(prev => ({
      ...prev,
      equipment: [...prev.equipment, { equipment: '', unit: 'hr', quantity: 0 }],
    }));
  };

  const updateNewMaterial = (idx: number, field: string, value: string | number) => {
    setNewNorm(prev => {
      const mats = [...prev.materials];
      mats[idx] = { ...mats[idx], [field]: value, ...(field === 'material' ? { materialId: String(value).toLowerCase().replace(/\s+/g, '-') } : {}) };
      return { ...prev, materials: mats };
    });
  };

  const updateNewLabor = (idx: number, field: string, value: string | number) => {
    setNewNorm(prev => {
      const labs = [...prev.labor];
      labs[idx] = { ...labs[idx], [field]: value };
      return { ...prev, labor: labs };
    });
  };

  const updateNewEquipment = (idx: number, field: string, value: string | number) => {
    setNewNorm(prev => {
      const eqs = [...prev.equipment];
      eqs[idx] = { ...eqs[idx], [field]: value };
      return { ...prev, equipment: eqs };
    });
  };

  const removeNewMaterial = (idx: number) => {
    setNewNorm(prev => ({ ...prev, materials: prev.materials.filter((_, i) => i !== idx) }));
  };
  const removeNewLabor = (idx: number) => {
    setNewNorm(prev => ({ ...prev, labor: prev.labor.filter((_, i) => i !== idx) }));
  };
  const removeNewEquipment = (idx: number) => {
    setNewNorm(prev => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground">Rate Analysis</h2>
          <p className="text-sm text-muted-foreground">दर विश्लेषण — DoR/DoLIDAR Standard Norms for Road, Bridge & Building Works</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePDFExport} disabled={results.length === 0} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleExport} disabled={results.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Export Excel (.xlsx)
          </Button>
        </div>
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
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="items" className="gap-1"><Layers className="h-3 w-3" /> Work Items</TabsTrigger>
          <TabsTrigger value="materials" className="gap-1">Materials</TabsTrigger>
          <TabsTrigger value="labor" className="gap-1">Labor</TabsTrigger>
          <TabsTrigger value="custom" className="gap-1"><Plus className="h-3 w-3" /> Custom</TabsTrigger>
          <TabsTrigger value="results" className="gap-1"><Calculator className="h-3 w-3" /> Results</TabsTrigger>
        </TabsList>

        {/* ── Work Items Selection with Search ── */}
        <TabsContent value="items">
          {/* Search Bar */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search norms... e.g. 'RCC column', 'culvert', 'plastering', 'M20', 'brick'"
                  className="flex-1"
                />
                {searchQuery && (
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>Clear</Button>
                )}
              </div>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  Found {Object.values(groupedNorms).reduce((s, g) => s + g.length, 0)} norms matching "{searchQuery}"
                </p>
              )}
            </CardContent>
          </Card>

          {/* Help Info */}
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="p-3 flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>How to use:</strong> Search or browse norms below. Click <Info className="h-3 w-3 inline" /> to see material/labor/equipment breakdown for any norm. Select items you need, then go to Materials tab to enter rates.</p>
                <p>Can't find a norm? Use the <strong>Custom</strong> tab to add your own work items with custom material & labor requirements.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {Object.keys(groupedNorms).length === 0 && searchQuery && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No norms found for "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try different keywords or add a custom norm in the Custom tab</p>
                </CardContent>
              </Card>
            )}
            {Object.entries(groupedNorms).map(([category, norms]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{category} <Badge variant="secondary" className="ml-1 text-xs">{norms.length}</Badge></CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => selectAllCategory(category)}>
                      {norms.every(n => selectedNorms.has(n.id)) ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {norms.map(norm => (
                    <div key={norm.id} className="rounded-lg border border-border/50 overflow-hidden">
                      <div className="flex items-start gap-3 p-2 hover:bg-muted/50 cursor-pointer transition-colors">
                        <Checkbox
                          checked={selectedNorms.has(norm.id)}
                          onCheckedChange={() => toggleNorm(norm.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0" onClick={() => toggleNorm(norm.id)}>
                          <p className="text-sm font-medium">{norm.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">Unit: {norm.unit}</Badge>
                            <Badge variant="secondary" className="text-xs">{norm.materials.length} materials</Badge>
                            <Badge variant="secondary" className="text-xs">{norm.labor.length} labor</Badge>
                            {norm.equipment.length > 0 && (
                              <Badge variant="secondary" className="text-xs">{norm.equipment.length} equipment</Badge>
                            )}
                            {norm.id.startsWith('custom-') && (
                              <Badge className="text-xs bg-accent text-accent-foreground">Custom</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); setExpandedNormId(expandedNormId === norm.id ? null : norm.id); }}
                          title="View norm details"
                        >
                          <Info className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </div>

                      {/* Expandable norm detail */}
                      {expandedNormId === norm.id && (
                        <div className="bg-muted/30 border-t border-border/50 p-3 space-y-2">
                          <p className="text-xs font-semibold text-primary">Norm Details — {norm.description} (per {norm.unit})</p>
                          {norm.materials.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-1">📦 Materials Required:</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead><tr className="bg-amber-100 dark:bg-amber-950/30">
                                    <th className="text-left p-1 border border-border/50">Material</th>
                                    <th className="text-center p-1 border border-border/50">Unit</th>
                                    <th className="text-right p-1 border border-border/50">Qty</th>
                                    <th className="text-right p-1 border border-border/50">Wastage %</th>
                                  </tr></thead>
                                  <tbody>
                                    {norm.materials.map((m, mi) => (
                                      <tr key={mi} className="bg-amber-50/50 dark:bg-amber-950/10">
                                        <td className="p-1 border border-border/50">{m.material}</td>
                                        <td className="p-1 border border-border/50 text-center">{m.unit}</td>
                                        <td className="p-1 border border-border/50 text-right">{m.quantity}</td>
                                        <td className="p-1 border border-border/50 text-right">{m.wastageDefault}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {norm.labor.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-1">👷 Labor Required:</p>
                              <div className="flex flex-wrap gap-2">
                                {norm.labor.map((l, li) => (
                                  <Badge key={li} variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20">
                                    {l.role}: {l.quantity} {l.unit}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {norm.equipment.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-1">🚜 Equipment Required:</p>
                              <div className="flex flex-wrap gap-2">
                                {norm.equipment.map((e, ei) => (
                                  <Badge key={ei} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">
                                    {e.equipment}: {e.quantity} {e.unit}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

        {/* ── Custom Norms Tab ── */}
        <TabsContent value="custom">
          <div className="space-y-4">
            {/* Existing custom norms */}
            {customNorms.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your Custom Norms ({customNorms.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {customNorms.map(norm => (
                    <div key={norm.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium">{norm.description}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">{norm.category}</Badge>
                          <Badge variant="outline" className="text-xs">{norm.unit}</Badge>
                          <Badge variant="secondary" className="text-xs">{norm.materials.length} mat</Badge>
                          <Badge variant="secondary" className="text-xs">{norm.labor.length} labor</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => deleteCustomNorm(norm.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Add new custom norm */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Custom Norm
                </CardTitle>
                <CardDescription>Create your own work item with custom material, labor, and equipment requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Description *</Label>
                    <Input
                      value={newNorm.description}
                      onChange={e => setNewNorm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., RCC Retaining Wall M25"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category *</Label>
                    <Input
                      value={newNorm.category}
                      onChange={e => setNewNorm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Building Structural"
                      list="norm-categories"
                    />
                    <datalist id="norm-categories">
                      {allCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <Label className="text-xs">Unit *</Label>
                    <Select value={newNorm.unit} onValueChange={v => setNewNorm(prev => ({ ...prev, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['cu.m', 'sq.m', 'r.m', 'nos', 'kg', 'litre', 'bag', 'set', 'l.s'].map(u =>
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold">📦 Materials</Label>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={addMaterialToNorm}>
                      <Plus className="h-3 w-3" /> Add Material
                    </Button>
                  </div>
                  {newNorm.materials.map((m, mi) => (
                    <div key={mi} className="grid grid-cols-5 gap-2 mb-2 items-end">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input className="h-7 text-xs" value={m.material} onChange={e => updateNewMaterial(mi, 'material', e.target.value)} placeholder="Cement" />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input className="h-7 text-xs" value={m.unit} onChange={e => updateNewMaterial(mi, 'unit', e.target.value)} placeholder="bag" />
                      </div>
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input className="h-7 text-xs" type="number" value={m.quantity || ''} onChange={e => updateNewMaterial(mi, 'quantity', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">Wastage %</Label>
                        <Input className="h-7 text-xs" type="number" value={m.wastageDefault || ''} onChange={e => updateNewMaterial(mi, 'wastageDefault', parseFloat(e.target.value) || 0)} />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeNewMaterial(mi)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Labor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold">👷 Labor</Label>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={addLaborToNorm}>
                      <Plus className="h-3 w-3" /> Add Labor
                    </Button>
                  </div>
                  {newNorm.labor.map((l, li) => (
                    <div key={li} className="grid grid-cols-4 gap-2 mb-2 items-end">
                      <div>
                        <Label className="text-xs">Role</Label>
                        <Input className="h-7 text-xs" value={l.role} onChange={e => updateNewLabor(li, 'role', e.target.value)} placeholder="Skilled Mason" />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input className="h-7 text-xs" value={l.unit} onChange={e => updateNewLabor(li, 'unit', e.target.value)} placeholder="day" />
                      </div>
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input className="h-7 text-xs" type="number" value={l.quantity || ''} onChange={e => updateNewLabor(li, 'quantity', parseFloat(e.target.value) || 0)} />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeNewLabor(li)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Equipment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold">🚜 Equipment</Label>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={addEquipmentToNorm}>
                      <Plus className="h-3 w-3" /> Add Equipment
                    </Button>
                  </div>
                  {newNorm.equipment.map((e, ei) => (
                    <div key={ei} className="grid grid-cols-4 gap-2 mb-2 items-end">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input className="h-7 text-xs" value={e.equipment} onChange={ev => updateNewEquipment(ei, 'equipment', ev.target.value)} placeholder="Concrete Mixer" />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input className="h-7 text-xs" value={e.unit} onChange={ev => updateNewEquipment(ei, 'unit', ev.target.value)} placeholder="hr" />
                      </div>
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input className="h-7 text-xs" type="number" value={e.quantity || ''} onChange={ev => updateNewEquipment(ei, 'quantity', parseFloat(ev.target.value) || 0)} />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeNewEquipment(ei)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={addCustomNorm} className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" /> Add Custom Norm
                </Button>
              </CardContent>
            </Card>
          </div>
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
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Rate Analysis Summary</CardTitle>
                    <div className="ml-auto flex gap-2">
                      <Button onClick={handlePDFExport} size="sm" variant="outline" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button onClick={handleExport} size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Excel
                      </Button>
                    </div>
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
