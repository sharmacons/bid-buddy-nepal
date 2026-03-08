import { CompanyProfile } from './types';

/**
 * Generate centered international-format letterhead HTML
 */
export function generateLetterheadHTML(profile: CompanyProfile | null): string {
  const co = profile?.companyName || '[Company Name / कम्पनीको नाम]';
  const addr = profile?.address || '[Address / ठेगाना]';
  const pan = profile?.panVatNumber || '[PAN/VAT]';
  const reg = profile?.registrationNumber || '[Reg. No.]';
  const phone = profile?.contactPhone || '[Phone]';
  const email = profile?.contactEmail || '[Email]';

  return `
    <div class="letterhead">
      ${profile?.logoUrl 
        ? `<img src="${profile.logoUrl}" alt="Logo" class="letterhead-logo-img" />`
        : `<div class="letterhead-logo-placeholder">${co.charAt(0)}</div>`
      }
      <div class="letterhead-name">${co}</div>
      <div class="letterhead-address">${addr}</div>
      <div class="letterhead-meta">PAN/VAT: ${pan} &nbsp;|&nbsp; Reg. No: ${reg}</div>
      <div class="letterhead-meta">Ph: ${phone} &nbsp;|&nbsp; Email: ${email}</div>
    </div>
    <div class="letterhead-line"></div>
  `;
}

/**
 * CSS styles for centered international letterhead
 */
export const LETTERHEAD_CSS = `
  .letterhead {
    text-align: center;
    padding-bottom: 12px;
  }
  .letterhead-logo-placeholder {
    width: 72px;
    height: 72px;
    background: #1e3a5f;
    color: white;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    font-family: 'Mukta', sans-serif;
    margin-bottom: 6px;
  }
  .letterhead-logo-img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border-radius: 6px;
    margin-bottom: 6px;
  }
  .letterhead-name {
    font-size: 22px;
    font-weight: 800;
    color: #1e3a5f;
    font-family: 'Mukta', sans-serif;
    line-height: 1.2;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .letterhead-address {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-top: 3px;
    line-height: 1.4;
  }
  .letterhead-meta {
    font-size: 10px;
    color: #666;
    line-height: 1.5;
  }
  .letterhead-line {
    border-bottom: 3px double #1e3a5f;
    margin-bottom: 18px;
    margin-top: 4px;
  }
`;

/**
 * Full A4 print document wrapper with centered letterhead
 */
export function wrapDocumentWithLetterhead(params: {
  profile: CompanyProfile | null;
  title: string;
  content: string;
  isLandscape?: boolean;
}): string {
  const { profile, title, content, isLandscape } = params;
  const letterhead = generateLetterheadHTML(profile);

  return `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&display=swap');
  @page { size: A4${isLandscape ? ' landscape' : ''}; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
  ${LETTERHEAD_CSS}
  pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
  h1.doc-title { text-align: center; font-size: 14pt; margin: 16px 0 12px; font-weight: bold; text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  td, th { border: 1px solid #000; padding: 4pt 8pt; text-align: left; font-size: 11pt; }
  .page-break { page-break-before: always; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #888; padding: 8px 15mm; }
  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  ${letterhead}
  <h1 class="doc-title">${title}</h1>
  <pre>${content}</pre>
</body>
</html>`;
}

/**
 * Generate Gantt chart HTML for work schedule with color coding and flow lines
 */
function generateGanttChartHTML(
  workSchedule: Array<{ activity: string; duration: number; startWeek: number; isMajor?: boolean }>,
  totalDurationWeeks: number,
): string {
  if (!workSchedule || workSchedule.length === 0) return '';

  const maxWeek = Math.max(...workSchedule.map(i => i.startWeek + i.duration - 1), totalDurationWeeks, 1);
  const totalMonths = Math.ceil(maxWeek / 4);

  // Color palette for activities — flow-coded by construction phase
  const PHASE_COLORS: Record<string, string> = {
    'mobilization': '#0d9488',
    'clearance': '#0d9488',
    'survey': '#06b6d4',
    'excavation': '#b45309',
    'earthwork': '#b45309',
    'embankment': '#ca8a04',
    'sub-base': '#d97706',
    'base': '#ea580c',
    'bituminous': '#1e3a5f',
    'asphalt': '#1e3a5f',
    'concrete': '#7c3aed',
    'rcc': '#7c3aed',
    'reinforcement': '#9333ea',
    'formwork': '#a855f7',
    'drain': '#2563eb',
    'culvert': '#1d4ed8',
    'bridge': '#dc2626',
    'retaining': '#64748b',
    'gabion': '#78716c',
    'masonry': '#92400e',
    'bio': '#16a34a',
    'road furniture': '#f59e0b',
    'sign': '#f59e0b',
    'painting': '#ec4899',
    'demobilization': '#6b7280',
  };

  function getColor(activity: string): string {
    const lower = activity.toLowerCase();
    for (const [key, color] of Object.entries(PHASE_COLORS)) {
      if (lower.includes(key)) return color;
    }
    return '#475569';
  }

  // Month headers
  const monthHeaders = Array.from({ length: totalMonths }, (_, i) =>
    `<th class="gantt-month-hdr">M${i + 1}<br><span style="font-size:7px;font-weight:normal;color:#888;">Wk${i*4+1}-${(i+1)*4}</span></th>`
  ).join('');

  // Table rows with colored bars and flow connector lines
  const tableRows = workSchedule.map((item, idx) => {
    const color = getColor(item.activity);
    const monthCells = Array.from({ length: totalMonths }, (_, m) => {
      const mStart = m * 4 + 1;
      const mEnd = (m + 1) * 4;
      const actStart = item.startWeek;
      const actEnd = item.startWeek + item.duration - 1;
      const overlap = actStart <= mEnd && actEnd >= mStart;

      // Calculate bar position within month cell
      if (overlap) {
        const cellStart = Math.max(actStart, mStart);
        const cellEnd = Math.min(actEnd, mEnd);
        const leftPct = ((cellStart - mStart) / 4) * 100;
        const widthPct = ((cellEnd - cellStart + 1) / 4) * 100;
        return `<td class="gantt-cell">
          <div class="gantt-bar" style="background:${color};left:${leftPct}%;width:${widthPct}%;opacity:${item.isMajor ? '1' : '0.7'};">
            ${leftPct === 0 && item.isMajor ? `<span class="gantt-bar-label">${item.duration}w</span>` : ''}
          </div>
        </td>`;
      }
      return `<td class="gantt-cell"></td>`;
    }).join('');

    return `<tr class="${item.isMajor ? 'gantt-major-row' : ''}">
      <td class="gantt-sn">${idx + 1}</td>
      <td class="gantt-activity" style="border-left: 4px solid ${color};">
        ${item.isMajor ? '<strong>' : ''}${item.activity}${item.isMajor ? '</strong>' : ''}
      </td>
      <td class="gantt-dur">${item.startWeek}</td>
      <td class="gantt-dur">${item.duration}w</td>
      <td class="gantt-dur">${item.startWeek + item.duration - 1}</td>
      ${monthCells}
    </tr>`;
  }).join('');

  // Flow indicator: connecting line SVG
  const svgHeight = workSchedule.length * 28 + 10;
  const flowLines = workSchedule.map((item, idx) => {
    if (idx === 0) return '';
    const prev = workSchedule[idx - 1];
    const prevEnd = prev.startWeek + prev.duration - 1;
    const currStart = item.startWeek;
    if (currStart <= prevEnd + 2) {
      const y1 = idx * 28 - 4;
      const y2 = idx * 28 + 14;
      return `<line x1="8" y1="${y1}" x2="8" y2="${y2}" stroke="#1e3a5f" stroke-width="2" stroke-dasharray="4,2"/>
              <polygon points="4,${y2} 12,${y2} 8,${y2+6}" fill="#1e3a5f"/>`;
    }
    return '';
  }).join('');

  return `
    <div class="gantt-container">
      <div class="gantt-flow-col">
        <svg width="16" height="${svgHeight}" style="display:block;">
          ${flowLines}
        </svg>
      </div>
      <div class="gantt-table-col">
        <table class="gantt-table">
          <thead>
            <tr>
              <th class="gantt-hdr" style="width:28px;">S.N.</th>
              <th class="gantt-hdr" style="min-width:180px;text-align:left;">Description of Activity</th>
              <th class="gantt-hdr" style="width:38px;">Start</th>
              <th class="gantt-hdr" style="width:38px;">Dur.</th>
              <th class="gantt-hdr" style="width:38px;">End</th>
              ${monthHeaders}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
    <div class="gantt-legend">
      <div class="gantt-legend-title">Legend — Color-Coded by Construction Phase:</div>
      <div class="gantt-legend-items">
        <span><i style="background:#0d9488;"></i> Mobilization</span>
        <span><i style="background:#b45309;"></i> Earthwork</span>
        <span><i style="background:#ea580c;"></i> Pavement Layers</span>
        <span><i style="background:#1e3a5f;"></i> Bituminous</span>
        <span><i style="background:#7c3aed;"></i> Concrete/RCC</span>
        <span><i style="background:#2563eb;"></i> Drainage</span>
        <span><i style="background:#dc2626;"></i> Bridge</span>
        <span><i style="background:#16a34a;"></i> Bio-Engineering</span>
        <span><i style="background:#6b7280;"></i> Demobilization</span>
      </div>
      <div style="font-size:8px;color:#888;margin-top:4px;">
        ● Bold rows = Major items &nbsp; | &nbsp; ▼ Arrow lines = Work flow sequence &nbsp; | &nbsp; Each column = 1 month (4 weeks)
      </div>
    </div>
  `;
}

/**
 * Generate mobilization schedule Gantt HTML
 */
function generateMobilizationGanttHTML(): string {
  const items = [
    { activity: 'Site Office Setup & Camp', weeks: [1, 2], color: '#0d9488' },
    { activity: 'Survey & Setting Out', weeks: [1, 2, 3], color: '#06b6d4' },
    { activity: 'Equipment Mobilization', weeks: [2, 3, 4], color: '#b45309' },
    { activity: 'Material Procurement (Initial)', weeks: [2, 3, 4], color: '#ea580c' },
    { activity: 'Labor Camp & Welfare Setup', weeks: [1, 2], color: '#7c3aed' },
    { activity: 'Laboratory Setup', weeks: [3, 4], color: '#2563eb' },
    { activity: 'Safety Arrangements', weeks: [1, 2, 3], color: '#dc2626' },
    { activity: 'Commencement of Main Works', weeks: [4], color: '#1e3a5f' },
  ];

  const rows = items.map((item, idx) => {
    const cells = [1, 2, 3, 4].map(w => {
      const active = item.weeks.includes(w);
      return `<td class="gantt-cell">${active ? `<div class="gantt-bar" style="background:${item.color};left:0;width:100%;"></div>` : ''}</td>`;
    }).join('');
    return `<tr>
      <td class="gantt-sn">${idx + 1}</td>
      <td class="gantt-activity" style="border-left:4px solid ${item.color};">${item.activity}</td>
      ${cells}
    </tr>`;
  }).join('');

  return `
    <table class="gantt-table">
      <thead>
        <tr>
          <th class="gantt-hdr" style="width:28px;">S.N.</th>
          <th class="gantt-hdr" style="min-width:200px;text-align:left;">Mobilization Item</th>
          <th class="gantt-month-hdr">Week 1</th>
          <th class="gantt-month-hdr">Week 2</th>
          <th class="gantt-month-hdr">Week 3</th>
          <th class="gantt-month-hdr">Week 4</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="font-size:9px;color:#666;margin-top:6px;">
      Note: Mobilization to be completed within the commencement period specified in the contract.
    </div>
  `;
}

/**
 * CSS for Gantt charts
 */
const GANTT_CSS = `
  .gantt-container { display: flex; gap: 0; }
  .gantt-flow-col { width: 18px; padding-top: 32px; flex-shrink: 0; }
  .gantt-table-col { flex: 1; overflow-x: auto; }
  .gantt-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .gantt-table th, .gantt-table td { border: 1px solid #ccc; }
  .gantt-hdr { background: #1e3a5f; color: white; font-weight: 700; padding: 5px 4px; font-size: 8px; text-align: center; }
  .gantt-month-hdr { background: #eef2f7; color: #1e3a5f; font-weight: 700; padding: 4px 2px; font-size: 8px; text-align: center; min-width: 32px; }
  .gantt-sn { text-align: center; padding: 3px; font-size: 8px; width: 28px; }
  .gantt-activity { padding: 3px 6px; font-size: 9px; white-space: nowrap; }
  .gantt-dur { text-align: center; padding: 3px; font-size: 8px; }
  .gantt-cell { padding: 0; position: relative; height: 22px; }
  .gantt-bar { position: absolute; height: 14px; top: 4px; border-radius: 2px; }
  .gantt-bar-label { font-size: 7px; color: white; padding-left: 3px; line-height: 14px; }
  .gantt-major-row { background: #f0f7ff; }
  .gantt-legend { margin-top: 10px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
  .gantt-legend-title { font-size: 9px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }
  .gantt-legend-items { display: flex; flex-wrap: wrap; gap: 10px; font-size: 8px; color: #555; }
  .gantt-legend-items i { display: inline-block; width: 12px; height: 8px; border-radius: 1px; vertical-align: middle; margin-right: 3px; }
`;

/**
 * Generate multi-document print package — each document on separate A4 page
 * Includes proper Gantt work schedule and mobilization schedule
 */
export function generatePrintPackageHTML(params: {
  profile: CompanyProfile | null;
  projectName: string;
  documents: Array<{ title: string; content: string }>;
  workSchedule?: Array<{ activity: string; duration: number; startWeek: number; isMajor?: boolean }>;
  totalDurationWeeks?: number;
}): string {
  const { profile, projectName, documents, workSchedule, totalDurationWeeks } = params;

  // Determine if Gantt needs landscape (>6 months)
  const ganttMonths = workSchedule && workSchedule.length > 0
    ? Math.ceil(Math.max(...workSchedule.map(i => i.startWeek + i.duration - 1), totalDurationWeeks || 24) / 4)
    : 0;
  const needsLandscape = ganttMonths > 6;

  const pages = documents.map((doc, i) => {
    const letterhead = generateLetterheadHTML(profile);
    return `
      ${i > 0 ? '<div class="page-break"></div>' : ''}
      ${letterhead}
      <h1 class="doc-title">${doc.title}</h1>
      <pre>${doc.content}</pre>
    `;
  });

  // Add Gantt work schedule page if data available
  if (workSchedule && workSchedule.length > 0) {
    const letterhead = generateLetterheadHTML(profile);
    const ganttHTML = generateGanttChartHTML(workSchedule, totalDurationWeeks || 24);
    pages.push(`
      <div class="page-break ${needsLandscape ? 'landscape-page' : ''}"></div>
      ${letterhead}
      <h1 class="doc-title">CONSTRUCTION WORK SCHEDULE — BAR CHART<br><span style="font-size:11pt;font-weight:normal;">(निर्माण कार्य तालिका / बार चार्ट)</span></h1>
      <div style="font-size:10px;text-align:center;color:#555;margin-bottom:10px;">
        Project: <strong>${projectName}</strong> &nbsp;|&nbsp; Total Duration: <strong>${totalDurationWeeks || 24} weeks (${ganttMonths} months)</strong>
        ${needsLandscape ? '&nbsp;|&nbsp; <em>Landscape A4</em>' : ''}
      </div>
      ${ganttHTML}
    `);
  }

  // Add mobilization schedule page (revert to portrait)
  {
    const letterhead = generateLetterheadHTML(profile);
    const mobHTML = generateMobilizationGanttHTML();
    pages.push(`
      <div class="page-break ${needsLandscape ? 'portrait-page' : ''}"></div>
      ${letterhead}
      <h1 class="doc-title">MOBILIZATION SCHEDULE<br><span style="font-size:11pt;font-weight:normal;">(परिचालन तालिका)</span></h1>
      <div style="font-size:10px;text-align:center;color:#555;margin-bottom:10px;">
        Project: <strong>${projectName}</strong>
      </div>
      ${mobHTML}
    `);
  }

  return `<!DOCTYPE html>
<html>
<head>
<title>Bid Documents — ${projectName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&display=swap');
  @page { size: A4; margin: 20mm 15mm; }
  @page landscape { size: A4 landscape; margin: 12mm 10mm; }
  @page portrait { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .landscape-page { page: landscape; }
  .portrait-page { page: portrait; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
  ${LETTERHEAD_CSS}
  ${GANTT_CSS}
  pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
  h1.doc-title { text-align: center; font-size: 14pt; margin: 16px 0 12px; font-weight: bold; text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  td, th { border: 1px solid #000; padding: 4pt 8pt; text-align: left; font-size: 11pt; }
  .page-break { page-break-before: always; }
  .no-print { text-align: center; padding: 20px; background: #f5f5f5; margin-bottom: 20px; }
  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding:14px 48px;font-size:14pt;cursor:pointer;background:#1e3a5f;color:white;border:none;border-radius:6px;font-weight:bold;">
      🖨️ Print All Documents (${pages.length} pages)
    </button>
    <p style="margin-top:8px;font-size:11px;color:#666;">Each document prints on a separate A4 page with company letterhead</p>
  </div>
  ${pages.join('')}
</body>
</html>`;
}
