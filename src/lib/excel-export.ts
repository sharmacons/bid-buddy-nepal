import ExcelJS from 'exceljs';
import { WorkScheduleItem, BOQItem } from './types';
import { computeCriticalPath } from './critical-path';

// Color palette for Gantt bars
const BAR_COLORS = [
  '2563EB', '3B82F6', '0891B2', '0D9488', '16A34A',
  'D97706', 'DC2626', '7C3AED', 'CA8A04', '0E7490',
  'EF4444', '6D28D9',
];
const CRITICAL_COLOR = 'DC2626';
const HEADER_BG = '1E3A5F';
const HEADER_FG = 'FFFFFF';
const BORDER_COLOR = 'CCCCCC';
const LIGHT_BG = 'F0F4F8';
const CRITICAL_BG = 'FEE2E2';
const MAJOR_BG = 'EFF6FF';

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BORDER_COLOR } };
  return { top: side, bottom: side, left: side, right: side };
}

export async function exportWorkScheduleExcel(params: {
  projectName: string;
  employer: string;
  ifbNumber?: string;
  contractId?: string;
  workSchedule: WorkScheduleItem[];
  totalDurationWeeks: number;
}) {
  const { projectName, employer, ifbNumber, contractId, workSchedule, totalDurationWeeks } = params;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BidReady Nepal';
  wb.created = new Date();

  // ─── Sheet 1: Schedule Data Table ───
  const dataSheet = wb.addWorksheet('Work Schedule', {
    properties: { defaultRowHeight: 22 },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  const { criticalIds } = computeCriticalPath(workSchedule);

  // Project header rows
  dataSheet.mergeCells('A1:H1');
  const titleCell = dataSheet.getCell('A1');
  titleCell.value = projectName || 'Work Schedule';
  titleCell.font = { size: 16, bold: true, color: { argb: HEADER_BG } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dataSheet.getRow(1).height = 30;

  dataSheet.mergeCells('A2:H2');
  const subCell = dataSheet.getCell('A2');
  subCell.value = `Employer: ${employer || '—'}  |  IFB: ${ifbNumber || '—'}  |  Contract: ${contractId || '—'}`;
  subCell.font = { size: 10, color: { argb: '666666' } };
  subCell.alignment = { horizontal: 'center' };
  dataSheet.getRow(2).height = 20;

  // Column definitions
  dataSheet.columns = [
    { key: 'sn', width: 6 },
    { key: 'activity', width: 40 },
    { key: 'duration', width: 12 },
    { key: 'startWeek', width: 12 },
    { key: 'endWeek', width: 12 },
    { key: 'predecessors', width: 18 },
    { key: 'major', width: 10 },
    { key: 'critical', width: 10 },
  ];

  // Header row
  const headerRow = dataSheet.getRow(4);
  ['S.N.', 'Activity', 'Duration (wk)', 'Start Week', 'End Week', 'Predecessors', 'Major', 'Critical'].forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { size: 11, bold: true, color: { argb: HEADER_FG } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
  headerRow.height = 26;

  // Data rows
  workSchedule.forEach((item, idx) => {
    const isCritical = criticalIds.has(item.id);
    const predNames = (item.dependencies || [])
      .map(depId => { const pi = workSchedule.findIndex(w => w.id === depId); return pi >= 0 ? `${pi + 1}FS` : null; })
      .filter(Boolean).join(', ');

    const row = dataSheet.getRow(5 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = item.activity;
    row.getCell(3).value = item.duration;
    row.getCell(4).value = item.startWeek;
    row.getCell(5).value = item.startWeek + item.duration - 1;
    row.getCell(6).value = predNames || '—';
    row.getCell(7).value = item.isMajor ? '★ Yes' : '';
    row.getCell(8).value = isCritical ? '🔴 Yes' : '';

    // Styling
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', wrapText: c === 2, horizontal: c <= 2 ? 'left' : 'center' };
      cell.font = { size: 10, bold: isCritical || item.isMajor };
      if (isCritical) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CRITICAL_BG } };
      } else if (item.isMajor) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAJOR_BG } };
      } else if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
      }
    }
    row.height = 22;
  });

  // Summary row
  const sumRowIdx = 5 + workSchedule.length + 1;
  dataSheet.mergeCells(`A${sumRowIdx}:B${sumRowIdx}`);
  dataSheet.getCell(`A${sumRowIdx}`).value = `Total Activities: ${workSchedule.length}  |  Critical: ${criticalIds.size}  |  Duration: ${totalDurationWeeks} weeks`;
  dataSheet.getCell(`A${sumRowIdx}`).font = { size: 10, bold: true, color: { argb: HEADER_BG } };

  // Auto-filter
  dataSheet.autoFilter = { from: 'A4', to: `H${4 + workSchedule.length}` };

  // ─── Sheet 2: Gantt Bar Chart (visual) ───
  const ganttSheet = wb.addWorksheet('Gantt Chart', {
    properties: { defaultRowHeight: 24 },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  const totalMonths = Math.ceil(totalDurationWeeks / 4);

  // Column A = SN, B = Activity name, then one column per week
  ganttSheet.getColumn(1).width = 5;
  ganttSheet.getColumn(2).width = 35;
  for (let w = 0; w < totalDurationWeeks; w++) {
    ganttSheet.getColumn(3 + w).width = 3.5;
  }

  // Title
  ganttSheet.mergeCells(1, 1, 1, 2 + totalDurationWeeks);
  const ganttTitle = ganttSheet.getCell(1, 1);
  ganttTitle.value = `${projectName || 'Work Schedule'} — Gantt Chart`;
  ganttTitle.font = { size: 14, bold: true, color: { argb: HEADER_BG } };
  ganttTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  ganttSheet.getRow(1).height = 28;

  // Month headers (row 3)
  const monthRow = ganttSheet.getRow(3);
  monthRow.getCell(1).value = '#';
  monthRow.getCell(2).value = 'Activity';
  [monthRow.getCell(1), monthRow.getCell(2)].forEach(cell => {
    cell.font = { size: 10, bold: true, color: { argb: HEADER_FG } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.border = thinBorder();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  for (let m = 0; m < totalMonths; m++) {
    const startCol = 3 + m * 4;
    const endCol = Math.min(startCol + 3, 2 + totalDurationWeeks);
    if (endCol >= startCol) {
      ganttSheet.mergeCells(3, startCol, 3, endCol);
      const cell = ganttSheet.getCell(3, startCol);
      cell.value = `Month ${m + 1}`;
      cell.font = { size: 9, bold: true, color: { argb: HEADER_FG } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder();
    }
  }
  monthRow.height = 22;

  // Week sub-headers (row 4)
  const weekRow = ganttSheet.getRow(4);
  weekRow.getCell(1).value = '';
  weekRow.getCell(2).value = '';
  [weekRow.getCell(1), weekRow.getCell(2)].forEach(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.border = thinBorder();
  });
  for (let w = 0; w < totalDurationWeeks; w++) {
    const cell = weekRow.getCell(3 + w);
    cell.value = w + 1;
    cell.font = { size: 8, color: { argb: '666666' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder();
  }
  weekRow.height = 18;

  // Activity rows with colored bars
  workSchedule.forEach((item, idx) => {
    const rowNum = 5 + idx;
    const row = ganttSheet.getRow(rowNum);
    const isCritical = criticalIds.has(item.id);
    const barColor = isCritical ? CRITICAL_COLOR : BAR_COLORS[idx % BAR_COLORS.length];

    // SN column
    const snCell = row.getCell(1);
    snCell.value = idx + 1;
    snCell.font = { size: 9, bold: isCritical };
    snCell.alignment = { horizontal: 'center', vertical: 'middle' };
    snCell.border = thinBorder();
    if (isCritical) snCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CRITICAL_BG } };

    // Activity name
    const nameCell = row.getCell(2);
    nameCell.value = item.activity;
    nameCell.font = { size: 9, bold: isCritical || item.isMajor, color: { argb: isCritical ? 'B91C1C' : '1A1A1A' } };
    nameCell.alignment = { vertical: 'middle', wrapText: true };
    nameCell.border = thinBorder();
    if (isCritical) nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CRITICAL_BG } };
    else if (item.isMajor) nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAJOR_BG } };

    // Week cells — fill bar cells with color
    for (let w = 0; w < totalDurationWeeks; w++) {
      const cell = row.getCell(3 + w);
      const weekNum = w + 1;
      const isBar = weekNum >= item.startWeek && weekNum < item.startWeek + item.duration;

      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'hair', color: { argb: 'E2E8F0' } },
        right: { style: 'hair', color: { argb: 'E2E8F0' } },
      };

      if (isBar) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: barColor } };
        // Show duration text in the middle cell of the bar
        const barMiddle = item.startWeek + Math.floor(item.duration / 2) - 1;
        if (w === barMiddle) {
          cell.value = `${item.duration}w`;
          cell.font = { size: 7, bold: true, color: { argb: 'FFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      } else {
        // Light alternating background for non-bar cells
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
        }
      }
    }
    row.height = 24;
  });

  // Legend row
  const legendRowNum = 5 + workSchedule.length + 2;
  ganttSheet.mergeCells(legendRowNum, 1, legendRowNum, 6);
  const legendCell = ganttSheet.getCell(legendRowNum, 1);
  legendCell.value = '🔴 = Critical Path  |  ★ = Major Activity  |  Adjust row heights, column widths, and bar colors as needed';
  legendCell.font = { size: 9, italic: true, color: { argb: '666666' } };

  // ─── Sheet 3: Editable Config ───
  const configSheet = wb.addWorksheet('Chart Settings', {
    properties: { defaultRowHeight: 22 },
  });
  configSheet.getColumn(1).width = 25;
  configSheet.getColumn(2).width = 20;
  configSheet.getColumn(3).width = 40;

  const configTitle = configSheet.getCell('A1');
  configTitle.value = 'Chart Customization Settings';
  configTitle.font = { size: 14, bold: true, color: { argb: HEADER_BG } };
  configSheet.mergeCells('A1:C1');
  configSheet.getRow(1).height = 28;

  const configHeaders = ['Setting', 'Value', 'Instructions'];
  const configHeaderRow = configSheet.getRow(3);
  configHeaders.forEach((h, i) => {
    const cell = configHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { size: 10, bold: true, color: { argb: HEADER_FG } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.border = thinBorder();
  });

  const settings = [
    ['Bar Row Height', '24 px', 'Change row heights in Gantt Chart sheet (select rows → right-click → Row Height)'],
    ['Week Column Width', '3.5', 'Select week columns → right-click → Column Width. Wider = bigger bars'],
    ['Activity Column Width', '35', 'Adjust column B width in Gantt Chart sheet'],
    ['Bar Color (Activity 1)', BAR_COLORS[0], 'Select bar cells → Home → Fill Color to change bar colors'],
    ['Critical Path Color', CRITICAL_COLOR, 'Red cells indicate critical path — change fill color as needed'],
    ['Font Size (Activity)', '9', 'Select cells → change font size in Home tab'],
    ['Font Size (Duration Label)', '7', 'Duration labels shown in middle of bars on Gantt sheet'],
    ['Header Background', HEADER_BG, 'Change header row fill color as needed'],
    ['Total Weeks', String(totalDurationWeeks), 'Add/remove week columns to extend/shorten timeline'],
    ['Total Activities', String(workSchedule.length), 'Add/remove rows to add/remove activities'],
  ];

  settings.forEach(([setting, value, instruction], idx) => {
    const row = configSheet.getRow(4 + idx);
    row.getCell(1).value = setting;
    row.getCell(1).font = { size: 10, bold: true };
    row.getCell(2).value = value;
    row.getCell(2).font = { size: 10 };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).value = instruction;
    row.getCell(3).font = { size: 9, color: { argb: '666666' } };
    row.getCell(3).alignment = { wrapText: true };
    [1, 2, 3].forEach(c => { row.getCell(c).border = thinBorder(); });
    if (idx % 2 === 1) {
      [1, 2, 3].forEach(c => {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
      });
    }
    row.height = 30;
  });

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(projectName || 'Work-Schedule').replace(/[^a-zA-Z0-9]/g, '-')}_Gantt.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
