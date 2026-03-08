import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getCompanyProfile, getBids } from '@/lib/storage';
import { BidData } from '@/lib/types';
import {
  letterOfBidTemplate, bidSecurityTemplate, powerOfAttorneyTemplate,
  declarationTemplate, bidderInfoELI1Template, runningContractsELI3Template,
  methodStatementTemplate, siteOrganizationTemplate, mobilizationScheduleTemplate,
  jvAgreementTemplate, jvPowerOfAttorneyTemplate, jvInfoELI2Template,
  constructionScheduleTemplate,
} from '@/lib/templates';
import { detectActivitiesFromBOQ, generateWorkSchedule } from '@/lib/work-schedule';
import { generatePrintPackageHTML } from '@/lib/letterhead';
import { toast } from 'sonner';
import { FileText, Copy, Printer, AlertTriangle, FolderOpen } from 'lucide-react';

export default function Templates() {
  const profile = getCompanyProfile();
  const bids = getBids();
  const [selectedBidId, setSelectedBidId] = useState<string>('');

  const selectedBid = useMemo(() => bids.find(b => b.id === selectedBidId) || null, [bids, selectedBidId]);

  const templates = useMemo(() => {
    const bid = selectedBid;
    const docs: { title: string; content: string }[] = [
      { title: 'Letter of Bid (बोलपत्र पत्र)', content: letterOfBidTemplate(profile, bid || undefined) },
      { title: 'Bid Security — Bank Guarantee (बोलपत्र जमानत)', content: bidSecurityTemplate(profile, bid || undefined) },
      { title: 'Power of Attorney (अख्तियारनामा)', content: powerOfAttorneyTemplate(profile, bid || undefined) },
      { title: 'Declaration of Undertaking (घोषणा पत्र)', content: declarationTemplate(profile, bid || undefined) },
      { title: 'Bidder Information — ELI-1 (बोलपत्रदाता जानकारी)', content: bidderInfoELI1Template(profile) },
      {
        title: 'Running Contracts — ELI-3 (चालु ठेक्काहरू)',
        content: runningContractsELI3Template(
          bid?.runningContracts?.map(c => ({
            name: c.name, sourceOfFund: c.sourceOfFund, dateOfAcceptance: c.dateOfAcceptance,
            status: c.status, takingOverDate: c.takingOverDate,
          })) || []
        ),
      },
      { title: 'Method Statement (कार्यविधि)', content: methodStatementTemplate(bid || undefined) },
      { title: 'Site Organization (स्थलीय संगठन)', content: siteOrganizationTemplate(profile, bid || undefined) },
      { title: 'Mobilization Schedule (परिचालन तालिका)', content: mobilizationScheduleTemplate(bid || undefined) },
    ];

    // Work schedule — auto-generate from BOQ if not manually set
    const workSchedule = (() => {
      if (bid?.workSchedule && bid.workSchedule.length > 0) return bid.workSchedule;
      if (bid?.boqItems && bid.boqItems.length > 0) {
        const detected = detectActivitiesFromBOQ(bid.boqItems);
        return generateWorkSchedule(detected, bid.totalDurationWeeks || 24);
      }
      return [];
    })();

    if (workSchedule.length > 0) {
      docs.push({
        title: 'Construction Schedule / Bar Chart',
        content: constructionScheduleTemplate(workSchedule, bid?.totalDurationWeeks || 24),
      });
    }

    // JV-specific documents — auto-switch
    if (bid?.isJV && bid.jvPartners && bid.jvPartners.length > 0) {
      bid.jvPartners.forEach((p, i) => {
        docs.push({
          title: `JV Partner ${i + 1} — ELI-2: ${p.legalName || 'Partner'}`,
          content: jvInfoELI2Template(p, profile?.companyName || bid.projectName),
        });
        const partnerProfile = {
          bidMode: 'single' as const, companyName: p.legalName, address: p.address, panVatNumber: p.panVatNumber,
          registrationNumber: p.registrationNumber, authorizedRepresentative: p.authorizedRepresentative,
          gender: p.gender, fatherName: p.fatherName, grandfatherName: p.grandfatherName,
          designation: p.designation, contactPhone: p.contactPhone, contactEmail: p.contactEmail,
        };
        docs.push({
          title: `Declaration — ${p.legalName || `Partner ${i + 1}`}`,
          content: declarationTemplate(partnerProfile, bid),
        });
      });
      docs.push({
        title: 'Joint Venture Agreement (संयुक्त उपक्रम सम्झौता)',
        content: jvAgreementTemplate(profile, bid.jvPartners, bid),
      });
      docs.push({
        title: 'JV Power of Attorney (संयुक्त उपक्रम अख्तियारनामा)',
        content: jvPowerOfAttorneyTemplate(profile, bid.jvPartners, bid),
      });
    }

    return docs;
  }, [profile, selectedBid]);

  function handlePrintAll() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups'); return; }
    printWindow.document.write(generatePrintPackageHTML({
      profile,
      projectName: selectedBid?.projectName || 'PPMO Standard Templates',
      documents: templates,
      workSchedule: selectedBid?.workSchedule,
      totalDurationWeeks: selectedBid?.totalDurationWeeks || 24,
    }));
    printWindow.document.close();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading">Document Templates</h1>
            <p className="text-sm text-muted-foreground">PPMO-standard templates — auto-filled from your bid data</p>
          </div>
        </div>
        <Button onClick={handlePrintAll} className="gap-2">
          <Printer className="h-4 w-4" /> Print All
        </Button>
      </div>

      {/* Bid Selector */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Select a Bid to Auto-Fill Templates</Label>
          </div>
          <Select value={selectedBidId} onValueChange={setSelectedBidId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a bid to populate all templates..." />
            </SelectTrigger>
            <SelectContent>
              {bids.length === 0 ? (
                <SelectItem value="none" disabled>No bids created yet</SelectItem>
              ) : (
                bids.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.projectName} — {b.employer} {b.isJV ? '(JV)' : '(Single)'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedBid && (
            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p><strong>Project:</strong> {selectedBid.projectName}</p>
              <p><strong>Employer:</strong> {selectedBid.employer}{selectedBid.employerAddress ? `, ${selectedBid.employerAddress}` : ''}</p>
              {selectedBid.ifbNumber && <p><strong>IFB:</strong> {selectedBid.ifbNumber}</p>}
              {selectedBid.bidAmount && <p><strong>Bid Amount:</strong> NPR {Number(selectedBid.bidAmount).toLocaleString()}</p>}
              {selectedBid.isJV && <p><strong>JV Partners:</strong> {selectedBid.jvPartners.length} partner(s) + Lead</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {!profile && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            Set up your <strong>Company Profile</strong> first to auto-fill templates with your details.
          </CardContent>
        </Card>
      )}

      {!selectedBid && bids.length > 0 && (
        <Card className="border-muted">
          <CardContent className="p-4 text-sm text-muted-foreground text-center">
            👆 Select a bid above to auto-fill all templates with project details, employer info, amounts, and JV data.
          </CardContent>
        </Card>
      )}

      {selectedBid?.isJV && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent shrink-0" />
            <span>JV bid detected — JV Agreement, JV Power of Attorney, and per-partner ELI-2 & Declaration documents are included below.</span>
          </CardContent>
        </Card>
      )}

      {templates.map((tpl) => (
        <Card key={tpl.title}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {tpl.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea className="font-mono text-xs min-h-[200px]" defaultValue={tpl.content} readOnly key={tpl.content.slice(0, 50)} />
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
