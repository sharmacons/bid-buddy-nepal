import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBids } from '@/lib/storage';
import { generateCashFlowProjection, CashFlowProjection } from '@/lib/cash-flow';
import { detectActivitiesFromBOQ, generateWorkSchedule } from '@/lib/work-schedule';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';
import { TrendingUp, Download, FolderOpen, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import ExcelJS from 'exceljs';

export default function CashFlow() {
  const bids = getBids();
  const [selectedBidId, setSelectedBidId] = useState('');
  const [advancePercent, setAdvancePercent] = useState(10);
  const [retentionPercent, setRetentionPercent] = useState(5);

  const selectedBid = useMemo(() => bids.find(b => b.id === selectedBidId) || null, [bids, selectedBidId]);

  const projection: CashFlowProjection | null = useMemo(() => {
    if (!selectedBid || !selectedBid.boqItems || selectedBid.boqItems.length === 0) return null;

    let schedule = selectedBid.workSchedule;
    if (!schedule || schedule.length === 0) {
      const detected = detectActivitiesFromBOQ(selectedBid.boqItems);
      schedule = generateWorkSchedule(detected, selectedBid.totalDurationWeeks || 24);
    }

    return generateCashFlowProjection({
      boqItems: selectedBid.boqItems,
      workSchedule: schedule,
      totalDurationWeeks: selectedBid.totalDurationWeeks || 24,
      advancePercent,
      retentionPercent,
    });
  }, [selectedBid, advancePercent, retentionPercent]);

  const fmt = (n: number) => `NPR ${n.toLocaleString('en-IN')}`;
  const fmtShort = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  const handleExportPDF = () => {
    if (!projection || !selectedBid) return;
    const html = generateCashFlowPrintHTML(projection, selectedBid.projectName, selectedBid.employer, advancePercent, retentionPercent);
    const w = window.open('', '_blank');
    if (!w) { toast.error('Please allow popups'); return; }
    w.document.write(html);
    w.document.close();
    toast.success('PDF ready — use Print → Save as PDF');
  };

  const handleExportExcel = async () => {
    if (!projection || !selectedBid) return;
    await exportCashFlowExcel(projection, selectedBid.projectName, advancePercent, retentionPercent);
    toast.success('Excel exported!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading">Cash Flow Projection</h1>
            <p className="text-sm text-muted-foreground">नगद प्रवाह प्रक्षेपण — Monthly & Quarterly forecast from BOQ & work schedule</p>
          </div>
        </div>
        {projection && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Excel
            </Button>
          </div>
        )}
      </div>

      {/* Bid selector */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Select Bid for Cash Flow</Label>
          </div>
          <Select value={selectedBidId} onValueChange={setSelectedBidId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a bid with BOQ data..." />
            </SelectTrigger>
            <SelectContent>
              {bids.filter(b => b.boqItems && b.boqItems.length > 0).length === 0 ? (
                <SelectItem value="none" disabled>No bids with BOQ data yet</SelectItem>
              ) : (
                bids.filter(b => b.boqItems && b.boqItems.length > 0).map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.projectName} — NPR {b.boqItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedBid && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <Label className="text-xs">Mobilization Advance (%)</Label>
                <Input type="number" value={advancePercent} onChange={e => setAdvancePercent(parseFloat(e.target.value) || 0)} min={0} max={20} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Retention (%)</Label>
                <Input type="number" value={retentionPercent} onChange={e => setRetentionPercent(parseFloat(e.target.value) || 0)} min={0} max={10} className="h-8" />
              </div>
              <div className="text-xs text-muted-foreground pt-4">
                <strong>Duration:</strong> {selectedBid.totalDurationWeeks || 24} weeks ({projection?.totalDurationMonths || 0} months)
              </div>
              <div className="text-xs text-muted-foreground pt-4">
                <strong>Total Budget:</strong> {fmt(projection?.totalBudget || 0)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedBid && bids.length > 0 && (
        <Card className="border-muted">
          <CardContent className="py-8 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Select a bid with BOQ data to generate cash flow projection</p>
          </CardContent>
        </Card>
      )}

      {projection && (
        <Tabs defaultValue="scurve" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="scurve" className="gap-1"><TrendingUp className="h-3 w-3" /> S-Curve</TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1"><Calendar className="h-3 w-3" /> Monthly</TabsTrigger>
            <TabsTrigger value="quarterly" className="gap-1"><DollarSign className="h-3 w-3" /> Quarterly</TabsTrigger>
          </TabsList>

          {/* S-Curve Chart */}
          <TabsContent value="scurve">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">S-Curve — Cumulative Expenditure</CardTitle>
                <CardDescription>Planned cumulative expenditure over project duration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projection.sCurveData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={fmtShort} className="text-xs" tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [fmt(value), 'Cumulative']}
                        labelFormatter={(l) => l}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <defs>
                        <linearGradient id="scurveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="cumPlanned" stroke="hsl(var(--primary))" fill="url(#scurveGrad)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex justify-center gap-6 text-xs text-muted-foreground">
                  <span>Total: <strong>{fmt(projection.totalBudget)}</strong></span>
                  <span>Duration: <strong>{projection.totalDurationMonths} months</strong></span>
                  <span>Advance: <strong>{advancePercent}%</strong></span>
                  <span>Retention: <strong>{retentionPercent}%</strong></span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Table */}
          <TabsContent value="monthly">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Monthly Cash Flow Forecast</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/70">
                      <th className="p-2 border border-border text-left font-medium">Month</th>
                      <th className="p-2 border border-border text-right font-medium">Planned (NPR)</th>
                      <th className="p-2 border border-border text-right font-medium">Cumulative (NPR)</th>
                      <th className="p-2 border border-border text-right font-medium">Advance</th>
                      <th className="p-2 border border-border text-right font-medium">Retention</th>
                      <th className="p-2 border border-border text-right font-medium">Net Payment</th>
                      <th className="p-2 border border-border text-right font-medium">% Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.months.map((m, i) => {
                      const pct = projection.totalBudget > 0 ? (m.cumPlanned / projection.totalBudget * 100).toFixed(1) : '0';
                      return (
                        <tr key={m.month} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <td className="p-2 border border-border font-medium">{m.label}</td>
                          <td className="p-2 border border-border text-right">{m.planned.toLocaleString()}</td>
                          <td className="p-2 border border-border text-right">{m.cumPlanned.toLocaleString()}</td>
                          <td className="p-2 border border-border text-right">{(m.advance || 0) > 0 ? m.advance?.toLocaleString() : '—'}</td>
                          <td className="p-2 border border-border text-right">{(m.retention || 0).toLocaleString()}</td>
                          <td className="p-2 border border-border text-right font-medium">{(m.netPayment || 0).toLocaleString()}</td>
                          <td className="p-2 border border-border text-right">{pct}%</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-primary/10 font-bold">
                      <td className="p-2 border border-border">TOTAL</td>
                      <td className="p-2 border border-border text-right">{projection.totalBudget.toLocaleString()}</td>
                      <td className="p-2 border border-border text-right">{projection.totalBudget.toLocaleString()}</td>
                      <td className="p-2 border border-border text-right">{Math.round(projection.totalBudget * advancePercent / 100).toLocaleString()}</td>
                      <td className="p-2 border border-border text-right">{Math.round(projection.totalBudget * retentionPercent / 100).toLocaleString()}</td>
                      <td className="p-2 border border-border text-right">—</td>
                      <td className="p-2 border border-border text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quarterly Summary */}
          <TabsContent value="quarterly">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quarterly Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/70">
                      <th className="p-2 border border-border text-left font-medium">Quarter</th>
                      <th className="p-2 border border-border text-left font-medium">Months</th>
                      <th className="p-2 border border-border text-right font-medium">Planned (NPR)</th>
                      <th className="p-2 border border-border text-right font-medium">Cumulative (NPR)</th>
                      <th className="p-2 border border-border text-right font-medium">% of Total</th>
                      <th className="p-2 border border-border text-right font-medium">% Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.quarters.map((q, i) => {
                      const pctOfTotal = projection.totalBudget > 0 ? (q.planned / projection.totalBudget * 100).toFixed(1) : '0';
                      const pctComplete = projection.totalBudget > 0 ? (q.cumPlanned / projection.totalBudget * 100).toFixed(1) : '0';
                      return (
                        <tr key={q.quarter} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <td className="p-2 border border-border font-semibold">{q.label}</td>
                          <td className="p-2 border border-border text-muted-foreground">{q.months.map(m => m.label).join(', ')}</td>
                          <td className="p-2 border border-border text-right">{q.planned.toLocaleString()}</td>
                          <td className="p-2 border border-border text-right">{q.cumPlanned.toLocaleString()}</td>
                          <td className="p-2 border border-border text-right">{pctOfTotal}%</td>
                          <td className="p-2 border border-border text-right font-medium">{pctComplete}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Quarter bar chart */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quarterly Expenditure Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projection.quarters.map(q => ({
                      label: q.label,
                      planned: q.planned,
                      cumPlanned: q.cumPlanned,
                    }))} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [fmt(value)]} contentStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="planned" stroke="hsl(var(--primary))" strokeWidth={2} name="Quarterly" />
                      <Line type="monotone" dataKey="cumPlanned" stroke="hsl(var(--accent-foreground))" strokeWidth={2} strokeDasharray="5 5" name="Cumulative" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// ─── PDF EXPORT ───
// ═══════════════════════════════════════════
function generateCashFlowPrintHTML(
  projection: CashFlowProjection,
  projectName: string,
  employer: string,
  advancePercent: number,
  retentionPercent: number,
): string {
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const monthRows = projection.months.map((m, i) => {
    const pct = projection.totalBudget > 0 ? (m.cumPlanned / projection.totalBudget * 100).toFixed(1) : '0';
    return `<tr class="${i % 2 ? 'alt' : ''}">
      <td>${m.label}</td>
      <td class="r">${fmt(m.planned)}</td>
      <td class="r">${fmt(m.cumPlanned)}</td>
      <td class="r">${(m.advance || 0) > 0 ? fmt(m.advance!) : '—'}</td>
      <td class="r">${fmt(m.retention || 0)}</td>
      <td class="r"><strong>${fmt(m.netPayment || 0)}</strong></td>
      <td class="r">${pct}%</td>
    </tr>`;
  }).join('');

  const qRows = projection.quarters.map((q, i) => {
    const pctT = projection.totalBudget > 0 ? (q.planned / projection.totalBudget * 100).toFixed(1) : '0';
    const pctC = projection.totalBudget > 0 ? (q.cumPlanned / projection.totalBudget * 100).toFixed(1) : '0';
    return `<tr class="${i % 2 ? 'alt' : ''}">
      <td><strong>${q.label}</strong></td>
      <td>${q.months.map(m => m.label).join(', ')}</td>
      <td class="r">${fmt(q.planned)}</td>
      <td class="r">${fmt(q.cumPlanned)}</td>
      <td class="r">${pctT}%</td>
      <td class="r">${pctC}%</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><title>Cash Flow — ${projectName}</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  body { font-family: 'Times New Roman', serif; font-size: 10pt; }
  h1 { text-align: center; font-size: 14pt; text-decoration: underline; margin: 10px 0; }
  h2 { font-size: 12pt; margin: 16px 0 8px; }
  .info td { padding: 2px 8px; font-size: 10pt; border: none; }
  .info .lbl { font-weight: bold; width: 140px; }
  table.data { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px; }
  table.data th { background: #1e3a5f; color: #fff; padding: 4px; border: 1px solid #333; text-align: center; font-size: 8pt; }
  table.data td { border: 1px solid #666; padding: 3px 5px; }
  .r { text-align: right; }
  .alt td { background: #f8fafc; }
  .total td { background: #1e3a5f; color: #fff; font-weight: bold; }
  .sig { display: flex; justify-content: space-between; margin-top: 30px; }
  .sig div { text-align: center; width: 28%; }
  .sig-line { border-bottom: 1px solid #000; height: 35px; margin-bottom: 4px; }
  .sig p { font-size: 9pt; font-weight: 600; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<h1>CASH FLOW PROJECTION</h1>
<table class="info"><tr><td class="lbl">Project:</td><td>${projectName}</td></tr>
<tr><td class="lbl">Employer:</td><td>${employer}</td></tr>
<tr><td class="lbl">Total Budget:</td><td>NPR ${fmt(projection.totalBudget)}</td></tr>
<tr><td class="lbl">Duration:</td><td>${projection.totalDurationMonths} months</td></tr>
<tr><td class="lbl">Advance:</td><td>${advancePercent}%</td></tr>
<tr><td class="lbl">Retention:</td><td>${retentionPercent}%</td></tr>
<tr><td class="lbl">Date:</td><td>${dateStr}</td></tr></table>

<h2>Monthly Cash Flow</h2>
<table class="data"><thead><tr>
  <th>Month</th><th>Planned (NPR)</th><th>Cumulative</th><th>Advance</th><th>Retention</th><th>Net Payment</th><th>% Complete</th>
</tr></thead><tbody>${monthRows}
<tr class="total"><td>TOTAL</td><td class="r">${fmt(projection.totalBudget)}</td><td class="r">${fmt(projection.totalBudget)}</td>
<td class="r">${fmt(projection.totalBudget * advancePercent / 100)}</td><td class="r">${fmt(projection.totalBudget * retentionPercent / 100)}</td><td class="r">—</td><td class="r">100%</td></tr>
</tbody></table>

<h2>Quarterly Summary</h2>
<table class="data"><thead><tr>
  <th>Quarter</th><th>Months</th><th>Planned</th><th>Cumulative</th><th>% of Total</th><th>% Complete</th>
</tr></thead><tbody>${qRows}</tbody></table>

<div class="sig"><div><div class="sig-line"></div><p>Prepared By</p></div>
<div><div class="sig-line"></div><p>Checked By</p></div>
<div><div class="sig-line"></div><p>Approved By</p></div></div>
</body></html>`;
}

// ═══════════════════════════════════════════
// ─── EXCEL EXPORT ───
// ═══════════════════════════════════════════
async function exportCashFlowExcel(
  projection: CashFlowProjection,
  projectName: string,
  advancePercent: number,
  retentionPercent: number,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BidReady Nepal';

  const ws = wb.addWorksheet('Cash Flow', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = [
    { key: 'month', width: 12 },
    { key: 'planned', width: 16 },
    { key: 'cumPlanned', width: 16 },
    { key: 'advance', width: 14 },
    { key: 'retention', width: 14 },
    { key: 'netPayment', width: 16 },
    { key: 'pctComplete', width: 12 },
  ];

  ws.mergeCells('A1:G1');
  ws.getCell('A1').value = `Cash Flow Projection — ${projectName || 'Project'}`;
  ws.getCell('A1').font = { size: 14, bold: true };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  const hdr = ws.getRow(3);
  ['Month', 'Planned (NPR)', 'Cumulative', 'Advance', 'Retention', 'Net Payment', '% Complete'].forEach((h, i) => {
    const cell = hdr.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
    cell.alignment = { horizontal: 'center' };
  });

  projection.months.forEach((m, i) => {
    const row = ws.getRow(4 + i);
    row.getCell(1).value = m.label;
    row.getCell(2).value = m.planned;
    row.getCell(3).value = m.cumPlanned;
    row.getCell(4).value = m.advance || 0;
    row.getCell(5).value = m.retention || 0;
    row.getCell(6).value = m.netPayment || 0;
    row.getCell(7).value = projection.totalBudget > 0 ? m.cumPlanned / projection.totalBudget : 0;
    row.getCell(7).numFmt = '0.0%';
    [2, 3, 4, 5, 6].forEach(c => { row.getCell(c).numFmt = '#,##0'; });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(projectName || 'CashFlow').replace(/[^a-zA-Z0-9]/g, '-')}_CashFlow.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
