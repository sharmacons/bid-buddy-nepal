import ExcelJS from 'exceljs';
import { RateAnalysisResult, RateAnalysisNorm } from './rate-analysis-norms';

const HEADER_BG = '1E3A5F';
const HEADER_FG = 'FFFFFF';
const BORDER_COLOR = 'CCCCCC';
const LIGHT_BG = 'F0F4F8';
const SUBTOTAL_BG = 'DBEAFE';
const TOTAL_BG = '1E40AF';
const MAT_BG = 'FEF3C7';
const LABOR_BG = 'D1FAE5';
const EQUIP_BG = 'E0E7FF';

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BORDER_COLOR } };
  return { top: side, bottom: side, left: side, right: side };
}

export async function exportRateAnalysisExcel(params: {
  projectName: string;
  overheadPercent: number;
  wastagePercent: number;
  results: RateAnalysisResult[];
  norms: RateAnalysisNorm[];
}) {
  const { projectName, overheadPercent, wastagePercent, results, norms } = params;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BidReady Nepal';
  wb.created = new Date();

  // ─── Sheet 1: Rate Summary ───
  const summarySheet = wb.addWorksheet('Rate Summary', {
    properties: { defaultRowHeight: 22 },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  summarySheet.columns = [
    { key: 'sn', width: 6 },
    { key: 'description', width: 45 },
    { key: 'unit', width: 10 },
    { key: 'materialCost', width: 16 },
    { key: 'laborCost', width: 16 },
    { key: 'equipmentCost', width: 16 },
    { key: 'subtotal', width: 16 },
    { key: 'overhead', width: 16 },
    { key: 'totalRate', width: 18 },
  ];

  // Title
  summarySheet.mergeCells('A1:I1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `Rate Analysis — ${projectName || 'Project'}`;
  titleCell.font = { size: 16, bold: true, color: { argb: HEADER_BG } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.mergeCells('A2:I2');
  const subCell = summarySheet.getCell('A2');
  subCell.value = `Based on DoR/DoLIDAR Standard Norms  |  Overhead: ${overheadPercent}%  |  Additional Wastage: ${wastagePercent}%`;
  subCell.font = { size: 10, color: { argb: '666666' } };
  subCell.alignment = { horizontal: 'center' };
  summarySheet.getRow(2).height = 20;

  // Headers
  const headerRow = summarySheet.getRow(4);
  ['S.N.', 'Work Item Description', 'Unit', 'Material (NPR)', 'Labor (NPR)', 'Equipment (NPR)', 'Subtotal (NPR)', `Overhead ${overheadPercent}%`, 'Total Rate (NPR)'].forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { size: 10, bold: true, color: { argb: HEADER_FG } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
  headerRow.height = 30;

  // Data rows grouped by category
  let currentCategory = '';
  let rowIdx = 5;
  let sn = 0;
  let grandTotal = 0;

  results.forEach((result) => {
    const norm = norms.find(n => n.id === result.normId);
    const category = norm?.category || 'Other';

    // Category header
    if (category !== currentCategory) {
      currentCategory = category;
      summarySheet.mergeCells(`A${rowIdx}:I${rowIdx}`);
      const catCell = summarySheet.getCell(`A${rowIdx}`);
      catCell.value = `▸ ${category}`;
      catCell.font = { size: 11, bold: true, color: { argb: HEADER_BG } };
      catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
      catCell.border = thinBorder();
      summarySheet.getRow(rowIdx).height = 24;
      rowIdx++;
    }

    sn++;
    const row = summarySheet.getRow(rowIdx);
    row.getCell(1).value = sn;
    row.getCell(2).value = result.description;
    row.getCell(3).value = result.unit;
    row.getCell(4).value = result.materialCost;
    row.getCell(5).value = result.laborCost;
    row.getCell(6).value = result.equipmentCost;
    row.getCell(7).value = result.subtotal;
    row.getCell(8).value = result.overheadAmount;
    row.getCell(9).value = result.totalRate;
    grandTotal += result.totalRate;

    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', wrapText: c === 2, horizontal: c <= 3 ? (c === 1 ? 'center' : 'left') : 'right' };
      cell.font = { size: 10 };
      if (c >= 4) cell.numFmt = '#,##0.00';
      if (sn % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
      }
    }
    row.height = 22;
    rowIdx++;
  });

  // Grand total
  summarySheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
  const totalRow = summarySheet.getRow(rowIdx);
  totalRow.getCell(1).value = 'GRAND TOTAL (all items per unit)';
  totalRow.getCell(1).font = { size: 12, bold: true, color: { argb: 'FFFFFF' } };
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(9).value = grandTotal;
  totalRow.getCell(9).font = { size: 12, bold: true, color: { argb: 'FFFFFF' } };
  totalRow.getCell(9).numFmt = '#,##0.00';
  totalRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
  for (let c = 1; c <= 9; c++) {
    totalRow.getCell(c).border = thinBorder();
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
  }
  totalRow.height = 28;

  summarySheet.autoFilter = { from: 'A4', to: `I${rowIdx - 1}` };

  // ─── Sheet 2: Detailed Breakdown per item ───
  results.forEach((result, resultIdx) => {
    const sheetName = `${resultIdx + 1}. ${result.description}`.substring(0, 31); // Excel 31 char limit
    const detailSheet = wb.addWorksheet(sheetName, {
      properties: { defaultRowHeight: 20 },
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
    });

    detailSheet.columns = [
      { key: 'sn', width: 5 },
      { key: 'item', width: 35 },
      { key: 'unit', width: 10 },
      { key: 'qty', width: 10 },
      { key: 'rate', width: 14 },
      { key: 'wastage', width: 12 },
      { key: 'amount', width: 16 },
    ];

    // Title
    detailSheet.mergeCells('A1:G1');
    const dTitle = detailSheet.getCell('A1');
    dTitle.value = `Rate Analysis: ${result.description}`;
    dTitle.font = { size: 13, bold: true, color: { argb: HEADER_BG } };
    dTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    detailSheet.getRow(1).height = 28;

    detailSheet.mergeCells('A2:G2');
    const dSub = detailSheet.getCell('A2');
    dSub.value = `Unit: ${result.unit}  |  Overhead: ${result.overheadPercent}%  |  Wastage: ${result.wastagePercent}% (additional)`;
    dSub.font = { size: 9, color: { argb: '666666' } };
    dSub.alignment = { horizontal: 'center' };

    // Header
    const dHeader = detailSheet.getRow(4);
    ['#', 'Item', 'Unit', 'Qty', 'Rate (NPR)', 'Wastage %', 'Amount (NPR)'].forEach((h, i) => {
      const cell = dHeader.getCell(i + 1);
      cell.value = h;
      cell.font = { size: 10, bold: true, color: { argb: HEADER_FG } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder();
    });
    dHeader.height = 24;

    let dRow = 5;
    result.breakdown.forEach((b, bIdx) => {
      const row = detailSheet.getRow(dRow);
      row.getCell(1).value = bIdx + 1;
      row.getCell(2).value = b.item;
      row.getCell(3).value = b.unit;
      row.getCell(4).value = b.quantity;
      row.getCell(5).value = b.rate;
      row.getCell(6).value = b.wastage > 0 ? `${b.wastage}%` : '—';
      row.getCell(7).value = b.amount;

      // Color code by type
      const isLabor = b.item.startsWith('👷');
      const isEquip = b.item.startsWith('🚜');
      const bgColor = isLabor ? LABOR_BG : isEquip ? EQUIP_BG : MAT_BG;

      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder();
        cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? (c === 1 ? 'center' : 'left') : 'right' };
        cell.font = { size: 9 };
        if (c === 5 || c === 7) cell.numFmt = '#,##0.00';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }
      row.height = 20;
      dRow++;
    });

    // Subtotals
    const sections = [
      { label: 'Material Cost', value: result.materialCost },
      { label: 'Labor Cost', value: result.laborCost },
      { label: 'Equipment Cost', value: result.equipmentCost },
      { label: 'Subtotal', value: result.subtotal },
      { label: `Overhead (${result.overheadPercent}%)`, value: result.overheadAmount },
      { label: 'TOTAL RATE PER UNIT', value: result.totalRate },
    ];

    dRow++;
    sections.forEach((s, si) => {
      const row = detailSheet.getRow(dRow);
      detailSheet.mergeCells(`A${dRow}:F${dRow}`);
      row.getCell(1).value = s.label;
      row.getCell(1).font = { size: si === sections.length - 1 ? 12 : 10, bold: true, color: { argb: si === sections.length - 1 ? 'FFFFFF' : HEADER_BG } };
      row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(7).value = s.value;
      row.getCell(7).font = { size: si === sections.length - 1 ? 12 : 10, bold: true, color: { argb: si === sections.length - 1 ? 'FFFFFF' : HEADER_BG } };
      row.getCell(7).numFmt = '#,##0.00';
      row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
      for (let c = 1; c <= 7; c++) {
        row.getCell(c).border = thinBorder();
        if (si === sections.length - 1) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
        } else if (si >= 3) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTOTAL_BG } };
        }
      }
      row.height = si === sections.length - 1 ? 28 : 22;
      dRow++;
    });
  });

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(projectName || 'Rate-Analysis').replace(/[^a-zA-Z0-9]/g, '-')}_Rate-Analysis.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
