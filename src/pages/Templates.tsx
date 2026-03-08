import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getCompanyProfile } from '@/lib/storage';
import {
  letterOfBidTemplate, bidSecurityTemplate, powerOfAttorneyTemplate,
  bidderInfoELI1Template, runningContractsELI3Template,
  methodStatementTemplate, siteOrganizationTemplate, mobilizationScheduleTemplate,
} from '@/lib/templates';
import { toast } from 'sonner';
import { FileText, Copy, Printer } from 'lucide-react';

export default function Templates() {
  const profile = getCompanyProfile();

  const templates = [
    { title: 'Letter of Bid (बोलपत्र पत्र)', content: letterOfBidTemplate(profile) },
    { title: 'Bid Security — Bank Guarantee (बोलपत्र जमानत)', content: bidSecurityTemplate(profile) },
    { title: 'Power of Attorney (अख्तियारनामा)', content: powerOfAttorneyTemplate(profile) },
    { title: 'Bidder Information — ELI-1 (बोलपत्रदाता जानकारी)', content: bidderInfoELI1Template(profile) },
    { title: 'Running Contracts — ELI-3 (चालु ठेक्काहरू)', content: runningContractsELI3Template([]) },
    { title: 'Method Statement (कार्यविधि)', content: methodStatementTemplate() },
    { title: 'Site Organization (स्थलीय संगठन)', content: siteOrganizationTemplate(profile) },
    { title: 'Mobilization Schedule (परिचालन तालिका)', content: mobilizationScheduleTemplate() },
  ];

  function handlePrintAll() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups'); return; }
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>PPMO Standard Templates</title>
      <style>
        @page { margin: 2cm; size: A4; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
        .page-break { page-break-before: always; }
        pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
        h1 { text-align: center; font-size: 16pt; margin-bottom: 20pt; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <div class="no-print" style="text-align:center;padding:20px;background:#f0f0f0;margin-bottom:20px;">
        <button onclick="window.print()" style="padding:10px 30px;font-size:14pt;cursor:pointer;">🖨️ Print All Templates</button>
      </div>
      ${templates.map((t, i) => `${i > 0 ? '<div class="page-break"></div>' : ''}<h1>${t.title}</h1><pre>${t.content}</pre>`).join('')}
      </body></html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading">Document Templates</h1>
            <p className="text-sm text-muted-foreground">PPMO-standard templates — ready to print for any contractor</p>
          </div>
        </div>
        <Button onClick={handlePrintAll} className="gap-2">
          <Printer className="h-4 w-4" /> Print All
        </Button>
      </div>

      {!profile && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            ⚠️ Set up your <strong>Company Profile</strong> first to auto-fill templates with your details.
          </CardContent>
        </Card>
      )}

      {templates.map((tpl) => (
        <Card key={tpl.title}>
          <CardHeader>
            <CardTitle className="text-base">{tpl.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea className="font-mono text-xs min-h-[200px]" defaultValue={tpl.content} readOnly />
            <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={() => {
              navigator.clipboard.writeText(tpl.content);
              toast.success('Copied!');
            }}>
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
