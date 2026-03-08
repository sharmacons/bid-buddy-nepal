import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getCompanyProfile } from '@/lib/storage';
import { letterOfBidTemplate, bidSecurityTemplate, powerOfAttorneyTemplate } from '@/lib/templates';
import { toast } from 'sonner';
import { FileText, Copy } from 'lucide-react';

export default function Templates() {
  const profile = getCompanyProfile();

  const templates = [
    { title: 'Letter of Bid (बोलपत्र पत्र)', content: letterOfBidTemplate(profile) },
    { title: 'Bid Security — Bank Guarantee (बोलपत्र जमानत)', content: bidSecurityTemplate(profile) },
    { title: 'Power of Attorney (अख्तियारनामा)', content: powerOfAttorneyTemplate(profile) },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Document Templates</h1>
          <p className="text-sm text-muted-foreground">PPMO-standard templates pre-filled with your company details</p>
        </div>
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
            <Textarea
              className="font-mono text-xs min-h-[200px]"
              defaultValue={tpl.content}
              readOnly
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={() => {
                navigator.clipboard.writeText(tpl.content);
                toast.success('Copied!');
              }}
            >
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
