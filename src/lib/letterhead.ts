import { CompanyProfile } from './types';

/**
 * Generate HTML letterhead block for print documents
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
      <div class="letterhead-logo">
        ${profile?.logoUrl 
          ? `<img src="${profile.logoUrl}" alt="Logo" class="letterhead-logo-img" />`
          : `<div class="letterhead-logo-placeholder">${co.charAt(0)}</div>`
        }
      </div>
      <div class="letterhead-info">
        <div class="letterhead-name">${co}</div>
        <div class="letterhead-details">
          ${addr}<br/>
          PAN/VAT: ${pan} | Reg. No: ${reg}<br/>
          Ph: ${phone} | Email: ${email}
        </div>
      </div>
    </div>
    <div class="letterhead-line"></div>
  `;
}

/**
 * CSS styles for letterhead (to be included in print HTML)
 */
export const LETTERHEAD_CSS = `
  .letterhead {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 10px;
  }
  .letterhead-logo-placeholder {
    width: 60px;
    height: 60px;
    background: #1e3a5f;
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
    font-family: 'Mukta', sans-serif;
  }
  .letterhead-logo-img {
    width: 60px;
    height: 60px;
    object-fit: contain;
    border-radius: 4px;
  }
  .letterhead-info {
    flex: 1;
  }
  .letterhead-name {
    font-size: 18px;
    font-weight: bold;
    color: #1e3a5f;
    font-family: 'Mukta', sans-serif;
    line-height: 1.2;
  }
  .letterhead-details {
    font-size: 10px;
    color: #555;
    line-height: 1.5;
    margin-top: 2px;
  }
  .letterhead-line {
    border-bottom: 3px double #1e3a5f;
    margin-bottom: 16px;
  }
`;

/**
 * Full A4 print document wrapper with letterhead
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
  @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700&display=swap');
  @page { size: A4${isLandscape ? ' landscape' : ''}; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
  ${LETTERHEAD_CSS}
  pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
  h1.doc-title { text-align: center; font-size: 14pt; margin: 16px 0 12px; font-weight: bold; }
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
 * Generate multi-document print package with letterhead on each page
 */
export function generatePrintPackageHTML(params: {
  profile: CompanyProfile | null;
  projectName: string;
  documents: Array<{ title: string; content: string }>;
}): string {
  const { profile, projectName, documents } = params;
  
  const pages = documents.map((doc, i) => {
    const letterhead = generateLetterheadHTML(profile);
    return `
      ${i > 0 ? '<div class="page-break"></div>' : ''}
      ${letterhead}
      <h1 class="doc-title">${doc.title}</h1>
      <pre>${doc.content}</pre>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<title>Bid Documents - ${projectName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700&display=swap');
  @page { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
  ${LETTERHEAD_CSS}
  pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
  h1.doc-title { text-align: center; font-size: 14pt; margin: 16px 0 12px; font-weight: bold; }
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
    <button onclick="window.print()" style="padding:12px 40px;font-size:14pt;cursor:pointer;background:#1e3a5f;color:white;border:none;border-radius:6px;">
      🖨️ Print All Documents (${documents.length} pages)
    </button>
  </div>
  ${pages}
</body>
</html>`;
}
