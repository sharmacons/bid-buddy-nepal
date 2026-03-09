import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCompanyProfile, getBids } from '@/lib/storage';
import { BidData } from '@/lib/types';
import {
  letterOfBidTemplate, letterOfPriceBidTemplate, bidSecurityTemplate, powerOfAttorneyTemplate,
  declarationTemplate, bidderInfoELI1Template, runningContractsELI3Template,
  methodStatementTemplate, siteOrganizationTemplate, mobilizationScheduleTemplate,
  jvAgreementTemplate, jvPowerOfAttorneyTemplate, jvInfoELI2Template,
  constructionScheduleTemplate,
} from '@/lib/templates';
import { detectActivitiesFromBOQ, generateWorkSchedule } from '@/lib/work-schedule';
import { generatePrintPackageHTML } from '@/lib/letterhead';
import { exportWorkSchedulePDF } from '@/lib/pdf-export';
import { exportWorkScheduleExcel } from '@/lib/excel-export';
import GanttChart from '@/components/GanttChart';
import { WorkScheduleItem } from '@/lib/types';
import { toast } from 'sonner';
import { FileText, Copy, Printer, AlertTriangle, FolderOpen, Calendar, Download, BarChart3, ClipboardList } from 'lucide-react';

export default function Templates() {
  const profile = getCompanyProfile();
  const bids = getBids();
  const [selectedBidId, setSelectedBidId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  const selectedBid = useMemo(() => bids.find(b => b.id === selectedBidId) || null, [bids, selectedBidId]);

  const workScheduleItems: WorkScheduleItem[] = useMemo(() => {
    const bid = selectedBid;
    if (bid?.workSchedule && bid.workSchedule.length > 0) return bid.workSchedule;
    if (bid?.boqItems && bid.boqItems.length > 0) {
      const detected = detectActivitiesFromBOQ(bid.boqItems);
      return generateWorkSchedule(detected, bid.totalDurationWeeks || 24);
    }
    return [];
  }, [selectedBid]);

  const templates = useMemo(() => {
    const bid = selectedBid;
    const docs: { title: string; content: string }[] = [
      { title: 'Letter of Bid (Technical Envelope)', content: letterOfBidTemplate(profile, bid || undefined) },
      { title: 'Letter of Price Bid (Financial Envelope)', content: letterOfPriceBidTemplate(profile, bid || undefined) },
      { title: 'Bid Security — Bank Guarantee', content: bidSecurityTemplate(profile, bid || undefined) },
      { title: 'Power of Attorney', content: powerOfAttorneyTemplate(profile, bid || undefined) },
      { title: 'Declaration of Undertaking', content: declarationTemplate(profile, bid || undefined) },
      { title: 'Bidder Information — ELI-1', content: bidderInfoELI1Template(profile) },
      {
        title: 'Running Contracts — ELI-3',
        content: runningContractsELI3Template(
          bid?.runningContracts?.map(c => ({
            name: c.name, sourceOfFund: c.sourceOfFund, dateOfAcceptance: c.dateOfAcceptance,
            status: c.status, takingOverDate: c.takingOverDate,
          })) || []
        ),
      },
      { title: 'Method Statement', content: methodStatementTemplate(bid || undefined) },
      { title: 'Site Organization', content: siteOrganizationTemplate(profile, bid || undefined) },
      { title: 'Mobilization Schedule', content: mobilizationScheduleTemplate(bid || undefined) },
    ];

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
      docs.push({ title: 'Joint Venture Agreement', content: jvAgreementTemplate(profile, bid.jvPartners, bid) });
      docs.push({ title: 'JV Power of Attorney', content: jvPowerOfAttorneyTemplate(profile, bid.jvPartners, bid) });
    }

    return docs;
  }, [profile, selectedBid, workScheduleItems]);

  function handlePrintAll() {
    const workSchedule = (() => {
      if (selectedBid?.workSchedule && selectedBid.workSchedule.length > 0) return selectedBid.workSchedule;
      if (selectedBid?.boqItems && selectedBid.boqItems.length > 0) {
        const detected = detectActivitiesFromBOQ(selectedBid.boqItems);
        return generateWorkSchedule(detected, selectedBid.totalDurationWeeks || 24);
      }
      return undefined;
    })();
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups'); return; }
    printWindow.document.write(generatePrintPackageHTML({
      profile, projectName: selectedBid?.projectName || 'PPMO Standard Templates',
      documents: templates, workSchedule, totalDurationWeeks: selectedBid?.totalDurationWeeks || 24,
    }));
    printWindow.document.close();
  }

  function handlePrintSingle(content: string, title: string) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups'); return; }
    printWindow.document.write(generatePrintPackageHTML({
      profile, projectName: selectedBid?.projectName || title,
      documents: [{ title, content }], totalDurationWeeks: selectedBid?.totalDurationWeeks || 24,
    }));
    printWindow.document.close();
  }

  const currentDoc = templates[selectedDocIndex] || templates[0];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
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
            <SelectTrigger><SelectValue placeholder="Choose a bid to populate all templates..." /></SelectTrigger>
            <SelectContent>
              {bids.length === 0 ? (
                <SelectItem value="none" disabled>No bids created yet</SelectItem>
              ) : (
                bids.map(b => <SelectItem key={b.id} value={b.id}>{b.projectName} — {b.employer} {b.isJV ? '(JV)' : '(Single)'}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          {selectedBid && (
            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p><strong>Project:</strong> {selectedBid.projectName}</p>
              <p><strong>Employer:</strong> {selectedBid.employer}{selectedBid.employerAddress ? `, ${selectedBid.employerAddress}` : ''}</p>
              {selectedBid.ifbNumber && <p><strong>IFB:</strong> {selectedBid.ifbNumber}</p>}
              {selectedBid.bidAmount && <p><strong>Bid Amount:</strong> NPR {Number(selectedBid.bidAmount).toLocaleString()}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {!profile && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            Set up your <strong>Company Profile</strong> first to auto-fill templates.
          </CardContent>
        </Card>
      )}

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Bid Documents</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Scheduling</TabsTrigger>
          <TabsTrigger value="wbs" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> WBS / Gantt</TabsTrigger>
        </TabsList>

        {/* ═══ BID DOCUMENTS TAB ═══ */}
        <TabsContent value="documents" className="mt-4">
          <div className="grid md:grid-cols-[260px_1fr] gap-4">
            {/* Document list sidebar */}
            <Card className="h-fit">
              <CardContent className="p-2">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-0.5">
                    {templates.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDocIndex(i)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                          selectedDocIndex === i
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Document preview — exact PPMO format */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {currentDoc.title}
                </CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                    navigator.clipboard.writeText(currentDoc.content);
                    toast.success('Copied!');
                  }}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handlePrintSingle(currentDoc.content, currentDoc.title)}>
                    <Printer className="h-3 w-3" /> Print
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {/* A4-like document preview */}
                  <div className="bg-white border border-border shadow-sm mx-auto max-w-[210mm] p-[25mm_20mm] min-h-[297mm]"
                    style={{
                      fontFamily: "'Source Sans 3', 'Mukta', serif",
                      fontSize: '11pt',
                      lineHeight: '1.6',
                      color: '#111',
                    }}
                  >
                    <pre className="whitespace-pre-wrap font-[inherit] text-[inherit] leading-[inherit] m-0 p-0"
                      style={{ tabSize: 4 }}
                    >
                      {currentDoc.content}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ SCHEDULING TAB ═══ */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          {workScheduleItems.length > 0 ? (
            <>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Construction Schedule</CardTitle>
                    <CardDescription>{selectedBid?.projectName || 'Project'} · {workScheduleItems.length} activities · {selectedBid?.totalDurationWeeks || 24} weeks</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                      exportWorkSchedulePDF({
                        projectName: selectedBid?.projectName || '', employer: selectedBid?.employer || '',
                        ifbNumber: selectedBid?.ifbNumber || '', contractId: selectedBid?.contractId || '',
                        workSchedule: workScheduleItems, totalDurationWeeks: selectedBid?.totalDurationWeeks || 24,
                      });
                    }}><Download className="h-3 w-3" /> PDF</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                      exportWorkScheduleExcel({
                        projectName: selectedBid?.projectName || '', employer: selectedBid?.employer || '',
                        ifbNumber: selectedBid?.ifbNumber || '', contractId: selectedBid?.contractId || '',
                        workSchedule: workScheduleItems, totalDurationWeeks: selectedBid?.totalDurationWeeks || 24,
                        boqItems: selectedBid?.boqItems,
                      });
                    }}><Download className="h-3 w-3" /> Excel</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Schedule table */}
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-10">SN</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Activity</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-20">Duration</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-20">Start</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-20">End</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-16">Major</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workScheduleItems.map((item, i) => (
                            <tr key={item.id} className="border-t border-border hover:bg-muted/20">
                              <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                              <td className="px-3 py-2 font-medium">{item.activity}</td>
                              <td className="px-3 py-2 text-center tabular-nums">{item.duration}w</td>
                              <td className="px-3 py-2 text-center tabular-nums">W{item.startWeek}</td>
                              <td className="px-3 py-2 text-center tabular-nums">W{item.startWeek + item.duration - 1}</td>
                              <td className="px-3 py-2 text-center">{item.isMajor ? '★' : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bar chart text format */}
                  <Card className="bg-white border">
                    <CardContent className="p-6">
                      <ScrollArea className="h-[400px]">
                        <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed" style={{ color: '#111' }}>
                          {constructionScheduleTemplate(workScheduleItems, selectedBid?.totalDurationWeeks || 24)}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">No schedule data available</p>
                <p className="text-xs mt-1">Select a bid with BOQ items to auto-generate the construction schedule.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ WBS / GANTT TAB ═══ */}
        <TabsContent value="wbs" className="mt-4 space-y-4">
          {workScheduleItems.length > 0 ? (
            <>
              {/* WBS breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Work Breakdown Structure (WBS)</CardTitle>
                  <CardDescription>Hierarchical breakdown of project activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 pl-2">
                    <div className="font-semibold text-sm text-foreground mb-2">
                      📁 {selectedBid?.projectName || 'Project'}
                    </div>
                    {(() => {
                      // Group by major/minor
                      const majorItems = workScheduleItems.filter(i => i.isMajor);
                      const minorItems = workScheduleItems.filter(i => !i.isMajor);
                      return (
                        <>
                          <div className="ml-4 space-y-0.5">
                            <div className="font-medium text-xs text-primary mb-1">📂 Major Activities ({majorItems.length})</div>
                            {majorItems.map((item, i) => (
                              <div key={item.id} className="ml-4 flex items-center gap-2 text-xs py-1 border-l-2 border-primary/30 pl-3">
                                <span className="text-muted-foreground">{i + 1}.</span>
                                <span className="font-medium">{item.activity}</span>
                                <span className="text-muted-foreground ml-auto tabular-nums">W{item.startWeek}–W{item.startWeek + item.duration - 1} ({item.duration}w)</span>
                              </div>
                            ))}
                          </div>
                          {minorItems.length > 0 && (
                            <div className="ml-4 space-y-0.5 mt-2">
                              <div className="font-medium text-xs text-muted-foreground mb-1">📂 Supporting Activities ({minorItems.length})</div>
                              {minorItems.map((item, i) => (
                                <div key={item.id} className="ml-4 flex items-center gap-2 text-xs py-1 border-l-2 border-muted pl-3">
                                  <span className="text-muted-foreground">{i + 1}.</span>
                                  <span>{item.activity}</span>
                                  <span className="text-muted-foreground ml-auto tabular-nums">W{item.startWeek}–W{item.startWeek + item.duration - 1} ({item.duration}w)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Visual Gantt */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Gantt Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChart items={workScheduleItems} totalWeeks={selectedBid?.totalDurationWeeks || 24} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">No WBS data available</p>
                <p className="text-xs mt-1">Select a bid with BOQ items to generate the Work Breakdown Structure.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
