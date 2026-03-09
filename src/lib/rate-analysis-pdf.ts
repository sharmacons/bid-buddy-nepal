import { RateAnalysisResult, RateAnalysisNorm } from './rate-analysis-norms';
import { getCompanyProfile } from './storage';

/**
 * Export Rate Analysis as printable PDF (via browser print)
 * Nepal Government Standard Format with letterhead, project details, and signature blocks
 */
export function exportRateAnalysisPDF(params: {
  projectName: string;
  employer?: string;
  ifbNumber?: string;
  contractId?: string;
  overheadPercent: number;
  wastagePercent: number;
  results: RateAnalysisResult[];
  norms: RateAnalysisNorm[];
}) {
  const { projectName, employer, ifbNumber, contractId, overheadPercent, wastagePercent, results, norms } = params;
  const profile = getCompanyProfile();

  const co = profile?.companyName || '[Company Name]';
  const addr = profile?.address || '[Address]';
  const pan = profile?.panVatNumber || '[PAN/VAT]';
  const reg = profile?.registrationNumber || '[Reg. No.]';
  const phone = profile?.contactPhone || '[Phone]';
  const email = profile?.contactEmail || '[Email]';

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  // Group results by category
  const grouped: { category: string; items: { result: RateAnalysisResult; norm: RateAnalysisNorm }[] }[] = [];
  let currentCat = '';
  results.forEach(r => {
    const norm = norms.find(n => n.id === r.normId);
    if (!norm) return;
    const cat = norm.category;
    if (cat !== currentCat) {
      currentCat = cat;
      grouped.push({ category: cat, items: [] });
    }
    grouped[grouped.length - 1].items.push({ result: r, norm });
  });

  // Summary table
  let sn = 0;
  const summaryRows = grouped.map(g => {
    const catRow = `<tr class="cat-row"><td colspan="9"><strong>▸ ${g.category}</strong></td></tr>`;
    const itemRows = g.items.map(({ result }) => {
      sn++;
      return `<tr class="${sn % 2 === 0 ? 'alt-row' : ''}">
        <td class="center">${sn}</td>
        <td>${result.description}</td>
        <td class="center">${result.unit}</td>
        <td class="right">${fmt(result.materialCost)}</td>
        <td class="right">${fmt(result.laborCost)}</td>
        <td class="right">${fmt(result.equipmentCost)}</td>
        <td class="right">${fmt(result.subtotal)}</td>
        <td class="right">${fmt(result.overheadAmount)}</td>
        <td class="right"><strong>${fmt(result.totalRate)}</strong></td>
      </tr>`;
    }).join('');
    return catRow + itemRows;
  }).join('');

  const grandTotal = results.reduce((s, r) => s + r.totalRate, 0);

  // Detail pages — one per item
  const detailPages = results.map((result, idx) => {
    const norm = norms.find(n => n.id === result.normId);
    const breakdownRows = result.breakdown.map((b, bi) => {
      const cls = b.item.startsWith('👷') ? 'labor-row' : b.item.startsWith('🚜') ? 'equip-row' : 'mat-row';
      return `<tr class="${cls}">
        <td class="center">${bi + 1}</td>
        <td>${b.item}</td>
        <td class="center">${b.unit}</td>
        <td class="right">${b.quantity}</td>
        <td class="right">${fmt(b.rate)}</td>
        <td class="center">${b.wastage > 0 ? b.wastage + '%' : '—'}</td>
        <td class="right">${fmt(b.amount)}</td>
      </tr>`;
    }).join('');

    return `
      <div class="page-break"></div>
      <div class="letterhead">
        <div class="lh-row">
          <div class="lh-left">Reg. No: ${reg}</div>
          <div class="lh-center">
            <div class="lh-name">${co}</div>
            <div class="lh-addr">${addr}</div>
          </div>
          <div class="lh-right">PAN/VAT: ${pan}</div>
        </div>
        <div class="lh-line"></div>
      </div>
      <h2 class="detail-title">RATE ANALYSIS — ITEM NO. ${idx + 1}</h2>
      <table class="info-table">
        <tr><td class="info-label">Description:</td><td>${result.description}</td></tr>
        <tr><td class="info-label">Unit:</td><td>${result.unit}</td></tr>
        <tr><td class="info-label">Reference Norm:</td><td>${norm?.category || '—'} (DoR/DoLIDAR Standard)</td></tr>
      </table>

      <table class="detail-table">
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th>Particulars</th>
            <th style="width:60px;">Unit</th>
            <th style="width:60px;">Quantity</th>
            <th style="width:80px;">Rate (NPR)</th>
            <th style="width:60px;">Wastage</th>
            <th style="width:90px;">Amount (NPR)</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows}
        </tbody>
      </table>

      <table class="totals-table">
        <tr><td>A. Material Cost</td><td class="right">${fmt(result.materialCost)}</td></tr>
        <tr><td>B. Labor Cost</td><td class="right">${fmt(result.laborCost)}</td></tr>
        <tr><td>C. Equipment Cost</td><td class="right">${fmt(result.equipmentCost)}</td></tr>
        <tr class="subtotal"><td>D. Sub-Total (A+B+C)</td><td class="right">${fmt(result.subtotal)}</td></tr>
        <tr><td>E. Overhead & Profit (${result.overheadPercent}%)</td><td class="right">${fmt(result.overheadAmount)}</td></tr>
        <tr class="grand-total"><td><strong>F. TOTAL RATE PER ${result.unit.toUpperCase()}</strong></td><td class="right"><strong>NPR ${fmt(result.totalRate)}</strong></td></tr>
      </table>

      <div class="signature-block">
        <div class="sig-col">
          <div class="sig-line"></div>
          <p>Prepared By</p>
        </div>
        <div class="sig-col">
          <div class="sig-line"></div>
          <p>Checked By</p>
        </div>
        <div class="sig-col">
          <div class="sig-line"></div>
          <p>Approved By</p>
        </div>
      </div>
      <div class="footer">
        <strong>Ph: ${phone} &nbsp;|&nbsp; Email: ${email} &nbsp;|&nbsp; ${addr}</strong>
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<title>Rate Analysis — ${projectName || 'Project'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&display=swap');
  @page { size: A4; margin: 18mm 15mm 15mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; }

  /* Letterhead */
  .letterhead { padding-bottom: 6px; }
  .lh-row { display: flex; align-items: flex-end; justify-content: space-between; }
  .lh-left { font-size: 9px; color: #555; min-width: 90px; text-align: left; }
  .lh-center { text-align: center; flex: 1; }
  .lh-right { font-size: 9px; color: #555; min-width: 90px; text-align: right; font-weight: 600; }
  .lh-name { font-size: 20px; font-weight: 800; color: #1e3a5f; font-family: 'Mukta', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; }
  .lh-addr { font-size: 12px; font-weight: 600; color: #333; margin-top: 2px; }
  .lh-line { border-bottom: 3px double #1e3a5f; margin: 4px 0 14px; }

  /* Page title */
  .main-title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 10px 0 8px; }
  .detail-title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 8px 0; }

  /* Project info */
  .project-info { margin-bottom: 14px; }
  .info-table { width: 100%; border: none; margin-bottom: 10px; }
  .info-table td { border: none; padding: 2px 6px; font-size: 10pt; }
  .info-label { font-weight: bold; width: 140px; color: #333; }

  /* Summary table */
  .summary-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px; }
  .summary-table th { background: #1e3a5f; color: #fff; font-weight: 700; padding: 5px 4px; border: 1px solid #333; text-align: center; font-size: 8pt; }
  .summary-table td { border: 1px solid #666; padding: 3px 5px; }
  .summary-table .center { text-align: center; }
  .summary-table .right { text-align: right; }
  .cat-row td { background: #e2e8f0; font-size: 9pt; padding: 4px 6px !important; }
  .alt-row td { background: #f8fafc; }
  .total-row td { background: #1e3a5f; color: #fff; font-weight: bold; font-size: 10pt; padding: 5px !important; }

  /* Detail table */
  .detail-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
  .detail-table th { background: #1e3a5f; color: #fff; padding: 4px; border: 1px solid #333; font-size: 8pt; text-align: center; }
  .detail-table td { border: 1px solid #666; padding: 3px 5px; }
  .detail-table .center { text-align: center; }
  .detail-table .right { text-align: right; }
  .mat-row td { background: #fef3c7; }
  .labor-row td { background: #d1fae5; }
  .equip-row td { background: #e0e7ff; }

  /* Totals */
  .totals-table { width: 60%; margin-left: auto; border-collapse: collapse; font-size: 10pt; margin-bottom: 16px; }
  .totals-table td { padding: 3px 8px; border: 1px solid #999; }
  .totals-table .right { text-align: right; width: 120px; }
  .totals-table .subtotal td { background: #dbeafe; font-weight: 600; }
  .totals-table .grand-total td { background: #1e3a5f; color: #fff; font-size: 11pt; }

  /* Signature block */
  .signature-block { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
  .sig-col { text-align: center; width: 28%; }
  .sig-line { border-bottom: 1px solid #000; margin-bottom: 4px; height: 40px; }
  .sig-col p { font-size: 9pt; font-weight: 600; }

  /* Stamp box */
  .stamp-box { border: 1px dashed #999; width: 120px; height: 60px; margin: 20px auto 0; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #999; }

  /* Footer */
  .footer { text-align: center; font-size: 8pt; color: #333; padding: 8px 0; border-top: 1px solid #ccc; margin-top: 20px; position: relative; }

  .page-break { page-break-before: always; }
  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <!-- Page 1: Summary -->
  <div class="letterhead">
    <div class="lh-row">
      <div class="lh-left">Reg. No: ${reg}</div>
      <div class="lh-center">
        <div class="lh-name">${co}</div>
        <div class="lh-addr">${addr}</div>
      </div>
      <div class="lh-right">PAN/VAT: ${pan}</div>
    </div>
    <div class="lh-line"></div>
  </div>

  <h1 class="main-title">RATE ANALYSIS</h1>

  <table class="info-table">
    <tr><td class="info-label">Project Name:</td><td>${projectName || '[Project Name]'}</td></tr>
    ${employer ? `<tr><td class="info-label">Employer:</td><td>${employer}</td></tr>` : ''}
    ${ifbNumber ? `<tr><td class="info-label">IFB Number:</td><td>${ifbNumber}</td></tr>` : ''}
    ${contractId ? `<tr><td class="info-label">Contract ID:</td><td>${contractId}</td></tr>` : ''}
    <tr><td class="info-label">Overhead & Profit:</td><td>${overheadPercent}%</td></tr>
    <tr><td class="info-label">Add. Wastage:</td><td>${wastagePercent}%</td></tr>
    <tr><td class="info-label">Date:</td><td>${dateStr}</td></tr>
    <tr><td class="info-label">Total Items:</td><td>${results.length}</td></tr>
  </table>

  <table class="summary-table">
    <thead>
      <tr>
        <th style="width:30px;">S.N.</th>
        <th>Work Item Description</th>
        <th style="width:45px;">Unit</th>
        <th style="width:70px;">Material</th>
        <th style="width:65px;">Labor</th>
        <th style="width:65px;">Equip.</th>
        <th style="width:70px;">Subtotal</th>
        <th style="width:65px;">OH ${overheadPercent}%</th>
        <th style="width:80px;">Total Rate</th>
      </tr>
    </thead>
    <tbody>
      ${summaryRows}
      <tr class="total-row">
        <td colspan="8" class="right">GRAND TOTAL (Sum of all unit rates)</td>
        <td class="right">NPR ${fmt(grandTotal)}</td>
      </tr>
    </tbody>
  </table>

  <div class="signature-block">
    <div class="sig-col">
      <div class="sig-line"></div>
      <p>Prepared By</p>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <p>Checked By</p>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <p>Approved By</p>
    </div>
  </div>
  <div class="stamp-box">Company Stamp / Seal</div>
  <div class="footer">
    <strong>Ph: ${phone} &nbsp;|&nbsp; Email: ${email} &nbsp;|&nbsp; ${addr}</strong>
  </div>

  <!-- Detail Pages -->
  ${detailPages}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
