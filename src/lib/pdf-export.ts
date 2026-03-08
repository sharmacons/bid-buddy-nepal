import { NRB_PRICE_INDEX_DATA, PriceAdjustmentCoefficients, PriceAdjustmentResult, NRBPriceIndex } from './price-index';
import { WorkScheduleItem } from './types';
import { computeCriticalPath } from './critical-path';

export function exportPriceAdjustmentPDF(params: {
  projectName: string;
  employer: string;
  ifbNumber: string;
  contractId: string;
  baseYear: string;
  currentYear: string;
  coefficients: PriceAdjustmentCoefficients;
  coeffPresetLabel: string;
  result: PriceAdjustmentResult;
  originalAmount: number;
}) {
  const {
    projectName, employer, ifbNumber, contractId,
    baseYear, currentYear, coefficients, coeffPresetLabel,
    result, originalAmount,
  } = params;

  const baseIdx = NRB_PRICE_INDEX_DATA.find(d => d.fiscalYear === baseYear)!;
  const currIdx = NRB_PRICE_INDEX_DATA.find(d => d.fiscalYear === currentYear)!;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Price Adjustment Report - ${projectName || 'Bid Document'}</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; }
  .header { text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; color: #1e3a5f; margin-bottom: 2px; }
  .header h2 { font-size: 13px; color: #444; font-weight: normal; }
  .header .subtitle { font-size: 10px; color: #888; margin-top: 4px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 12px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
  .info-row { display: flex; gap: 8px; }
  .info-label { font-weight: 600; min-width: 140px; color: #555; }
  .info-value { color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; }
  th { background: #eef2f7; font-weight: 600; color: #1e3a5f; text-align: center; }
  td { text-align: right; }
  td:first-child { text-align: left; }
  .highlight-row { background: #e8f0fe; font-weight: bold; }
  .formula-box { background: #f5f7fa; border: 1px solid #d0d7e0; border-radius: 4px; padding: 10px; margin: 8px 0; font-family: 'Courier New', monospace; font-size: 11px; }
  .result-box { background: #1e3a5f; color: white; border-radius: 6px; padding: 16px; text-align: center; margin: 12px 0; }
  .result-box .factor { font-size: 36px; font-weight: bold; }
  .result-box .percent { font-size: 14px; margin-top: 4px; }
  .breakdown-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 10px 0; }
  .breakdown-item { text-align: center; background: #f5f7fa; border-radius: 4px; padding: 8px 4px; }
  .breakdown-item .label { font-size: 9px; color: #666; }
  .breakdown-item .value { font-size: 13px; font-weight: bold; color: #1e3a5f; }
  .amount-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px; }
  .amount-row.total { border-bottom: 2px solid #1e3a5f; font-weight: bold; font-size: 13px; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9px; color: #888; text-align: center; }
  .note-box { background: #fff8e1; border: 1px solid #ffe082; border-radius: 4px; padding: 8px; margin-top: 10px; font-size: 10px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <h1>PRICE ADJUSTMENT CALCULATION REPORT</h1>
    <h2>मूल्य समायोजन गणना प्रतिवेदन</h2>
    <div class="subtitle">As per Public Procurement Act, 2063 (Section 55) & Public Procurement Rules, 2064 (Rule 119)</div>
  </div>

  <div class="section">
    <div class="section-title">1. Project Information</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Project Name:</span><span class="info-value">${projectName || '—'}</span></div>
      <div class="info-row"><span class="info-label">Employer:</span><span class="info-value">${employer || '—'}</span></div>
      <div class="info-row"><span class="info-label">IFB Number:</span><span class="info-value">${ifbNumber || '—'}</span></div>
      <div class="info-row"><span class="info-label">Contract ID:</span><span class="info-value">${contractId || '—'}</span></div>
      <div class="info-row"><span class="info-label">Report Date:</span><span class="info-value">${today}</span></div>
      <div class="info-row"><span class="info-label">Work Type:</span><span class="info-value">${coeffPresetLabel}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Price Adjustment Formula</div>
    <div class="formula-box">
      <strong>Pn = a + b × (Ln/Lo) + c × (Mn/Mo) + d × (En/Eo) + e × (Fn/Fo)</strong><br><br>
      Where:<br>
      &nbsp;&nbsp;a = Fixed / Non-adjustable portion = <strong>${coefficients.a}</strong><br>
      &nbsp;&nbsp;b = Labor coefficient = <strong>${coefficients.b}</strong><br>
      &nbsp;&nbsp;c = Construction Materials coefficient = <strong>${coefficients.c}</strong><br>
      &nbsp;&nbsp;d = Equipment coefficient = <strong>${coefficients.d}</strong><br>
      &nbsp;&nbsp;e = Fuel / Energy coefficient = <strong>${coefficients.e}</strong><br>
      &nbsp;&nbsp;Sum (a+b+c+d+e) = <strong>${(coefficients.a + coefficients.b + coefficients.c + coefficients.d + coefficients.e).toFixed(2)}</strong>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Nepal Rastra Bank Price Index Table (Base Year: 2080/81 BS = 100)</div>
    <table>
      <thead>
        <tr>
          <th>Fiscal Year (BS)</th>
          <th>AD Equivalent</th>
          <th>Overall CPI</th>
          <th>Food</th>
          <th>Non-Food</th>
          <th>Construction</th>
          <th>Labor</th>
          <th>Fuel</th>
        </tr>
      </thead>
      <tbody>
        ${NRB_PRICE_INDEX_DATA.map(d => `
          <tr class="${(d.fiscalYear === baseYear || d.fiscalYear === currentYear) ? 'highlight-row' : ''}">
            <td>${d.fiscalYear}${d.fiscalYear === baseYear ? ' (Base)' : ''}${d.fiscalYear === currentYear ? ' (Current)' : ''}</td>
            <td style="text-align:center">${d.fiscalYearAD}</td>
            <td>${d.overall.toFixed(1)}</td>
            <td>${d.food.toFixed(1)}</td>
            <td>${d.nonFood.toFixed(1)}</td>
            <td>${d.construction.toFixed(1)}</td>
            <td>${d.labor.toFixed(1)}</td>
            <td>${d.fuel.toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p style="font-size:9px;color:#888;margin-top:4px;">Source: Nepal Rastra Bank CPI Data & Sectoral Reports</p>
  </div>

  <div class="section">
    <div class="section-title">4. Calculation</div>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Coefficient</th>
          <th>Base Index (${baseYear})</th>
          <th>Current Index (${currentYear})</th>
          <th>Ratio (Cn/Co)</th>
          <th>Weighted Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Fixed (a)</td>
          <td>${coefficients.a}</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>${result.breakDown.fixed}</td>
        </tr>
        <tr>
          <td>Labor (b)</td>
          <td>${coefficients.b}</td>
          <td>${baseIdx.labor.toFixed(1)}</td>
          <td>${currIdx.labor.toFixed(1)}</td>
          <td>${(currIdx.labor / baseIdx.labor).toFixed(4)}</td>
          <td>${result.breakDown.labor}</td>
        </tr>
        <tr>
          <td>Materials (c)</td>
          <td>${coefficients.c}</td>
          <td>${baseIdx.construction.toFixed(1)}</td>
          <td>${currIdx.construction.toFixed(1)}</td>
          <td>${(currIdx.construction / baseIdx.construction).toFixed(4)}</td>
          <td>${result.breakDown.materials}</td>
        </tr>
        <tr>
          <td>Equipment (d)</td>
          <td>${coefficients.d}</td>
          <td>${baseIdx.overall.toFixed(1)}</td>
          <td>${currIdx.overall.toFixed(1)}</td>
          <td>${(currIdx.overall / baseIdx.overall).toFixed(4)}</td>
          <td>${result.breakDown.equipment}</td>
        </tr>
        <tr>
          <td>Fuel (e)</td>
          <td>${coefficients.e}</td>
          <td>${baseIdx.fuel.toFixed(1)}</td>
          <td>${currIdx.fuel.toFixed(1)}</td>
          <td>${(currIdx.fuel / baseIdx.fuel).toFixed(4)}</td>
          <td>${result.breakDown.fuel}</td>
        </tr>
        <tr class="highlight-row">
          <td colspan="5" style="text-align:right"><strong>Multiplying Factor (Pn) =</strong></td>
          <td><strong>${result.multiplyingFactor}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">5. Result Summary</div>
    <div class="result-box">
      <div style="font-size:11px;">Multiplying Factor (Pn)</div>
      <div class="factor">${result.multiplyingFactor}</div>
      <div class="percent">Price Adjustment: ${result.adjustmentPercent > 0 ? '+' : ''}${result.adjustmentPercent}%</div>
    </div>

    <div class="breakdown-grid">
      <div class="breakdown-item"><div class="label">Fixed</div><div class="value">${result.breakDown.fixed}</div></div>
      <div class="breakdown-item"><div class="label">Labor</div><div class="value">${result.breakDown.labor}</div></div>
      <div class="breakdown-item"><div class="label">Materials</div><div class="value">${result.breakDown.materials}</div></div>
      <div class="breakdown-item"><div class="label">Equipment</div><div class="value">${result.breakDown.equipment}</div></div>
      <div class="breakdown-item"><div class="label">Fuel</div><div class="value">${result.breakDown.fuel}</div></div>
    </div>

    <div class="amount-row">
      <span>Original Contract Amount:</span>
      <span>NPR ${originalAmount.toLocaleString('en-NP')}</span>
    </div>
    <div class="amount-row">
      <span>Price Adjustment (${result.adjustmentPercent > 0 ? '+' : ''}${result.adjustmentPercent}%):</span>
      <span>NPR ${(result.adjustedAmount - originalAmount).toLocaleString('en-NP')}</span>
    </div>
    <div class="amount-row total">
      <span>Adjusted Amount:</span>
      <span>NPR ${result.adjustedAmount.toLocaleString('en-NP')}</span>
    </div>

    ${Math.abs(result.adjustmentPercent) > 25 ? `
    <div class="note-box" style="background:#ffebee;border-color:#ef9a9a;">
      ⚠️ <strong>Warning:</strong> Price adjustment exceeds 25% cap per PPR Rule 119(3). 
      Contract may be subject to termination or renegotiation by the procuring entity.
    </div>
    ` : ''}

    <div class="note-box">
      <strong>Notes:</strong><br>
      • Price adjustment applies only to contracts exceeding 12 months duration (PPA Section 55).<br>
      • First 10% of price change is absorbed by the contractor; adjustment applies to amount beyond 10% threshold.<br>
      • Maximum allowable price adjustment is 25% of the original contract amount (PPR Rule 119(3)).<br>
      • Lump sum contracts are excluded from price adjustment provisions.<br>
      • Price adjustment is not applicable if delay is attributable to the contractor.
    </div>
  </div>

  <div class="footer">
    <p>Generated by BidReady Nepal — बोलपत्र तयारी सहायक | ${today}</p>
    <p>This report is for reference only. Verify all calculations with official NRB publications and contract documents.</p>
  </div>
</body>
</html>`);

  win.document.close();
  setTimeout(() => win.print(), 500);
}

const GANTT_COLORS = [
  '#1e3a5f', '#2563eb', '#16a34a', '#ea580c',
  '#be185d', '#7c3aed', '#0d9488', '#ca8a04',
];

const CRITICAL_COLOR = '#dc2626';

export function exportWorkSchedulePDF(params: {
  projectName: string;
  employer: string;
  ifbNumber: string;
  contractId: string;
  workSchedule: WorkScheduleItem[];
  totalDurationWeeks: number;
}) {
  const { projectName, employer, ifbNumber, contractId, workSchedule, totalDurationWeeks } = params;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const maxWeek = Math.max(...workSchedule.map(i => i.startWeek + i.duration - 1), totalDurationWeeks, 1);
  const totalMonths = Math.ceil(maxWeek / 4);

  // Compute critical path
  const { criticalIds } = computeCriticalPath(workSchedule);

  const win = window.open('', '_blank');
  if (!win) return;

  // Build table rows
  const tableRows = workSchedule.map((item, idx) => {
    const isCritical = criticalIds.has(item.id);
    const color = isCritical ? CRITICAL_COLOR : GANTT_COLORS[idx % GANTT_COLORS.length];
    const monthCells = Array.from({ length: totalMonths }, (_, m) => {
      const mStart = m * 4 + 1;
      const mEnd = (m + 1) * 4;
      const actStart = item.startWeek;
      const actEnd = item.startWeek + item.duration - 1;
      const overlap = actStart <= mEnd && actEnd >= mStart;
      const barBorder = isCritical ? 'border:1.5px solid #991b1b;' : '';
      return `<td style="padding:0;position:relative;height:22px;">
        ${overlap ? `<div style="background:${color};height:14px;margin:4px 1px;border-radius:2px;opacity:${isCritical ? '1' : item.isMajor ? '1' : '0.6'};${barBorder}"></div>` : ''}
      </td>`;
    }).join('');

    const criticalMarker = isCritical ? '⚡ ' : '';
    const rowBg = isCritical ? 'background:#fef2f2;' : '';

    return `<tr style="${rowBg}">
      <td style="text-align:center;padding:3px 4px;font-size:9px;">${idx + 1}</td>
      <td style="padding:3px 6px;font-size:9px;white-space:nowrap;${item.isMajor || isCritical ? 'font-weight:bold;' : ''}${isCritical ? 'color:#991b1b;' : ''}">${criticalMarker}${item.isMajor && !isCritical ? '● ' : ''}${item.activity}</td>
      <td style="text-align:center;padding:3px 4px;font-size:9px;">${item.startWeek}</td>
      <td style="text-align:center;padding:3px 4px;font-size:9px;">${item.duration}</td>
      <td style="text-align:center;padding:3px 4px;font-size:9px;">${item.startWeek + item.duration - 1}</td>
      ${monthCells}
    </tr>`;
  }).join('');

  // Month headers
  const monthHeaders = Array.from({ length: totalMonths }, (_, i) =>
    `<th style="padding:3px 2px;font-size:8px;min-width:28px;text-align:center;">M${i + 1}</th>`
  ).join('');

  const criticalCount = criticalIds.size;

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Work Schedule - ${projectName || 'Bid Document'}</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 10px; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 10px; margin-bottom: 12px; }
  .header h1 { font-size: 16px; color: #1e3a5f; }
  .header h2 { font-size: 11px; color: #444; font-weight: normal; margin-top: 2px; }
  .info-row { display: flex; gap: 24px; margin-bottom: 8px; flex-wrap: wrap; }
  .info-item { font-size: 10px; }
  .info-item strong { color: #1e3a5f; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #bbb; }
  th { background: #eef2f7; color: #1e3a5f; font-weight: 600; padding: 4px; font-size: 9px; }
  tr:nth-child(even) { background: #f9fafb; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 8px; color: #888; text-align: center; }
  .legend { margin-top: 8px; font-size: 9px; color: #555; display: flex; gap: 16px; flex-wrap: wrap; }
  .legend span { display: flex; align-items: center; gap: 4px; }
  .legend .dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <h1>CONSTRUCTION WORK SCHEDULE / BAR CHART</h1>
    <h2>Critical Path Method (CPM) Analysis</h2>
  </div>

  <div class="info-row">
    <div class="info-item"><strong>Project:</strong> ${projectName || '—'}</div>
    <div class="info-item"><strong>Employer:</strong> ${employer || '—'}</div>
    <div class="info-item"><strong>IFB No:</strong> ${ifbNumber || '—'}</div>
    <div class="info-item"><strong>Contract ID:</strong> ${contractId || '—'}</div>
    <div class="info-item"><strong>Total Duration:</strong> ${maxWeek} weeks (${totalMonths} months)</div>
    <div class="info-item"><strong>Critical Activities:</strong> ${criticalCount} of ${workSchedule.length}</div>
    <div class="info-item"><strong>Date:</strong> ${today}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:24px;">S.N.</th>
        <th style="min-width:160px;text-align:left;padding-left:6px;">Description of Activity</th>
        <th style="width:36px;">Start<br>(wk)</th>
        <th style="width:36px;">Dur.<br>(wk)</th>
        <th style="width:36px;">End<br>(wk)</th>
        ${monthHeaders}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="legend">
    <span><span class="dot" style="background:${CRITICAL_COLOR};border:1.5px solid #991b1b;"></span> <strong>Critical Path (${criticalCount})</strong></span>
    <span><span class="dot" style="background:#1e3a5f;"></span> Major Item (● marked)</span>
    <span><span class="dot" style="background:#1e3a5f;opacity:0.5;"></span> Minor Item</span>
    <span>⚡ = Zero float | Each column = 1 month (4 weeks)</span>
  </div>

  <div class="footer">
    Generated by BidReady Nepal | ${today}<br>
    This work schedule is indicative and subject to site conditions, weather, and resource availability.
  </div>
</body>
</html>`);

  win.document.close();
  setTimeout(() => win.print(), 500);
}
