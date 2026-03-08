import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveBid } from '@/lib/storage';
import { getChecklistForType } from '@/lib/checklists';
import { BidType, BID_TYPE_LABELS, JVPartner, Gender } from '@/lib/types';
import { toast } from 'sonner';
import { FilePlus, Users, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

const DESIGNATION_OPTIONS = ['Managing Director', 'Proprietor', 'Partner', 'Director', 'Chairman', 'CEO', 'General Manager'];

function createEmptyPartner(): JVPartner {
  return {
    id: crypto.randomUUID(),
    legalName: '',
    country: 'Nepal',
    yearOfConstitution: '',
    address: '',
    panVatNumber: '',
    registrationNumber: '',
    authorizedRepresentative: '',
    gender: 'male',
    fatherName: '',
    grandfatherName: '',
    designation: '',
    contactPhone: '',
    contactEmail: '',
    sharePercentage: 0,
  };
}

export default function NewBid() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('type') as BidType | null;

  const [bidType, setBidType] = useState<BidType>(preselected || 'ncb-single');
  const [projectName, setProjectName] = useState('');
  const [employer, setEmployer] = useState('');
  const [employerAddress, setEmployerAddress] = useState('');
  const [deadline, setDeadline] = useState('');
  const [ifbNumber, setIfbNumber] = useState('');
  const [contractId, setContractId] = useState('');
  const [isJV, setIsJV] = useState(false);
  const [jvPartnerCount, setJvPartnerCount] = useState<number>(1);
  const [jvPartners, setJvPartners] = useState<JVPartner[]>([]);
  const [leadSharePercentage, setLeadSharePercentage] = useState<number>(0);

  function handleJVToggle(checked: boolean) {
    setIsJV(checked);
    if (checked && jvPartners.length === 0) {
      setJvPartners([createEmptyPartner()]);
      setJvPartnerCount(1);
      setLeadSharePercentage(0);
    }
  }

  function handlePartnerCountChange(count: string) {
    const num = Number(count);
    setJvPartnerCount(num);
    const current = [...jvPartners];
    while (current.length < num) current.push(createEmptyPartner());
    while (current.length > num) current.pop();
    setJvPartners(current);
  }

  function updatePartner(idx: number, field: keyof JVPartner, value: string | number) {
    setJvPartners(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  // Validation
  const totalPartnerShare = jvPartners.reduce((s, p) => s + (p.sharePercentage || 0), 0);
  const leadShare = isJV ? (leadSharePercentage || (100 - totalPartnerShare)) : 0;
  const totalShare = leadShare + totalPartnerShare;
  const allMin25 = jvPartners.every(p => !p.sharePercentage || p.sharePercentage >= 25);
  const leadMin25 = !isJV || leadShare >= 25;
  const hasOneMin40 = !isJV || leadShare >= 40 || jvPartners.some(p => p.sharePercentage >= 40);
  const totalIs100 = !isJV || totalShare === 100;
  const jvValid = !isJV || (allMin25 && leadMin25 && hasOneMin40 && totalIs100);

  function handleCreate() {
    if (!projectName || !employer || !deadline) {
      toast.error('Please fill all required fields');
      return;
    }
    if (isJV) {
      if (!jvValid) {
        toast.error('Please fix JV share validation errors before creating');
        return;
      }
      const hasEmptyNames = jvPartners.some(p => !p.legalName.trim());
      if (hasEmptyNames) {
        toast.error('Please fill in all JV partner company names');
        return;
      }
      const hasEmptyReps = jvPartners.some(p => !p.authorizedRepresentative.trim());
      if (hasEmptyReps) {
        toast.error('Please fill in all JV partner representative names');
        return;
      }
    }

    const id = crypto.randomUUID();
    saveBid({
      id,
      projectName,
      employer,
      employerAddress,
      bidType,
      status: 'preparing',
      submissionDeadline: deadline,
      createdAt: new Date().toISOString(),
      checklist: getChecklistForType(bidType),
      boqItems: [],
      isJV,
      jvPartners: isJV ? jvPartners : [],
      jvLeadPartner: isJV ? `lead-${leadShare}%` : undefined,
      runningContracts: [],
      workSchedule: [],
      ifbNumber,
      contractId,
    });
    toast.success('Bid created!');
    navigate(`/bid/${id}`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FilePlus className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">New Bid</h1>
          <p className="text-sm text-muted-foreground">नयाँ बोलपत्र तयार गर्नुहोस्</p>
        </div>
      </div>

      {/* Basic Bid Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bid Details (बोलपत्र विवरण)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bid Type (बोलपत्र प्रकार) *</Label>
            <Select value={bidType} onValueChange={(v) => setBidType(v as BidType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BID_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project Name (परियोजनाको नाम) *</Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Upgrading of Baglung-Rakse-Doholi Road" />
          </div>
          <div className="space-y-2">
            <Label>Employer / Procuring Entity (नियोक्ता) *</Label>
            <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g., Road Infrastructure Development Office, Gulmi" />
          </div>
          <div className="space-y-2">
            <Label>Employer Address (नियोक्ताको ठेगाना)</Label>
            <Input value={employerAddress} onChange={(e) => setEmployerAddress(e.target.value)} placeholder="e.g., Gulmi, Nepal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>IFB Number (बोलपत्र नम्बर)</Label>
              <Input value={ifbNumber} onChange={(e) => setIfbNumber(e.target.value)} placeholder="e.g., 07/079-80" />
            </div>
            <div className="space-y-2">
              <Label>Contract ID (ठेक्का नम्बर)</Label>
              <Input value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="e.g., RIDO/GUL/W/NCB/..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Submission Deadline (अन्तिम मिति) *</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* JV Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Bidding Type (एकल/संयुक्त उपक्रम)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <Label className="text-base font-semibold">Are you bidding as a Joint Venture (JV)?</Label>
              <p className="text-xs text-muted-foreground mt-1">संयुक्त उपक्रममा बोलपत्र पेश गर्नुहुन्छ?</p>
            </div>
            <Switch checked={isJV} onCheckedChange={handleJVToggle} />
          </div>

          {isJV && (
            <>
              <div className="space-y-2">
                <Label>Number of JV Partners (excluding your company as Lead) *</Label>
                <Select value={String(jvPartnerCount)} onValueChange={handlePartnerCountChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Partner (2 companies total)</SelectItem>
                    <SelectItem value="2">2 Partners (3 companies total — max)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Maximum 3 JV partners allowed (PPMO rule). Your company is the Lead Partner.</p>
              </div>

              {/* Lead Partner Share */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                <p className="text-sm font-semibold text-primary">🏢 Lead Partner — Your Company</p>
                <div className="space-y-2">
                  <Label className="text-xs">Lead Partner Share % *</Label>
                  <Input
                    type="number"
                    min={25}
                    max={75}
                    value={leadSharePercentage || ''}
                    onChange={(e) => setLeadSharePercentage(Number(e.target.value))}
                    placeholder="e.g., 50"
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground">Minimum 25%. At least one partner must have ≥40%.</p>
                </div>
              </div>

              {/* JV Partners */}
              {jvPartners.map((partner, idx) => (
                <Card key={partner.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      JV Partner {idx + 1} Details (साझेदार {idx + 1} विवरण)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Company Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Company Legal Name (कम्पनीको नाम) *</Label>
                        <Input className="h-9 text-sm" value={partner.legalName} onChange={(e) => updatePartner(idx, 'legalName', e.target.value)} placeholder="e.g., Blue Heights Construction Pvt. Ltd." />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Share % (न्यूनतम २५%) *</Label>
                        <Input className="h-9 text-sm" type="number" min={25} max={75} value={partner.sharePercentage || ''} onChange={(e) => updatePartner(idx, 'sharePercentage', Number(e.target.value))} placeholder="e.g., 40" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country (देश)</Label>
                        <Input className="h-9 text-sm" value={partner.country} onChange={(e) => updatePartner(idx, 'country', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Address (ठेगाना)</Label>
                        <Input className="h-9 text-sm" value={partner.address} onChange={(e) => updatePartner(idx, 'address', e.target.value)} placeholder="Tulshipur-16, Dang" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">PAN/VAT Number (Individual Company)</Label>
                        <Input className="h-9 text-sm" value={partner.panVatNumber} onChange={(e) => updatePartner(idx, 'panVatNumber', e.target.value)} placeholder="305284884" />
                        <p className="text-[10px] text-muted-foreground">Note: JV PAN is issued only after contract award. Enter each partner's own company PAN here.</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Registration Number</Label>
                        <Input className="h-9 text-sm" value={partner.registrationNumber} onChange={(e) => updatePartner(idx, 'registrationNumber', e.target.value)} placeholder="REG-12345" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Year of Constitution</Label>
                        <Input className="h-9 text-sm" value={partner.yearOfConstitution} onChange={(e) => updatePartner(idx, 'yearOfConstitution', e.target.value)} placeholder="2068" />
                      </div>
                    </div>

                    {/* Representative Details */}
                    <div className="border-t pt-3 mt-2">
                      <p className="text-xs font-semibold text-primary mb-3">👤 Authorized Representative (अधिकार प्राप्त प्रतिनिधि)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Full Name (पूरा नाम) *</Label>
                          <Input className="h-9 text-sm" value={partner.authorizedRepresentative} onChange={(e) => updatePartner(idx, 'authorizedRepresentative', e.target.value)} placeholder="Sushan Karki" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Gender (Mr./Mrs.) *</Label>
                          <Select value={partner.gender} onValueChange={(v) => updatePartner(idx, 'gender', v)}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Mr. (श्रीमान)</SelectItem>
                              <SelectItem value="female">Mrs./Ms. (श्रीमती)</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Father's Name (बुबाको नाम) *</Label>
                          <Input className="h-9 text-sm" value={partner.fatherName} onChange={(e) => updatePartner(idx, 'fatherName', e.target.value)} placeholder="Tribendra Singh Karki" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Grandfather's Name (हजुरबुबाको नाम) *</Label>
                          <Input className="h-9 text-sm" value={partner.grandfatherName} onChange={(e) => updatePartner(idx, 'grandfatherName', e.target.value)} placeholder="Nim Bahadur Karki" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Designation (पद) *</Label>
                          <Select value={partner.designation} onValueChange={(v) => updatePartner(idx, 'designation', v)}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DESIGNATION_OPTIONS.map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Phone (फोन)</Label>
                          <Input className="h-9 text-sm" value={partner.contactPhone} onChange={(e) => updatePartner(idx, 'contactPhone', e.target.value)} placeholder="9860774396" />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs">Email (इमेल)</Label>
                          <Input className="h-9 text-sm" value={partner.contactEmail} onChange={(e) => updatePartner(idx, 'contactEmail', e.target.value)} placeholder="company@gmail.com" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* JV Share Validation Summary */}
              <div className={`p-4 rounded-lg border space-y-2 ${jvValid ? 'border-accent/30 bg-accent/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <p className="text-sm font-semibold flex items-center gap-2">
                  {jvValid ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                  JV Share Summary
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-background text-center">
                    <p className="font-semibold">Lead Partner</p>
                    <p className={`text-lg font-bold ${leadShare >= 25 ? 'text-primary' : 'text-destructive'}`}>{leadShare}%</p>
                  </div>
                  {jvPartners.map((p, i) => (
                    <div key={p.id} className="p-2 rounded bg-background text-center">
                      <p className="font-semibold truncate">{p.legalName || `Partner ${i + 1}`}</p>
                      <p className={`text-lg font-bold ${p.sharePercentage >= 25 ? 'text-primary' : 'text-destructive'}`}>{p.sharePercentage || 0}%</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span>Total Share:</span>
                  <span className={`font-bold ${totalIs100 ? 'text-accent' : 'text-destructive'}`}>{totalShare}%{totalIs100 ? ' ✓' : ' (must be 100%)'}</span>
                </div>

                {/* Validation messages */}
                {!jvValid && (
                  <div className="space-y-1 pt-1">
                    {!leadMin25 && <p className="text-[11px] text-destructive">• Lead partner share must be at least 25%</p>}
                    {!allMin25 && <p className="text-[11px] text-destructive">• Each partner must have at least 25% share</p>}
                    {!hasOneMin40 && <p className="text-[11px] text-destructive">• At least one partner must have 40% or more share</p>}
                    {!totalIs100 && totalShare > 0 && <p className="text-[11px] text-destructive">• Total share must equal exactly 100%</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Button */}
      <Button onClick={handleCreate} className="w-full gap-2 h-12 text-base" disabled={isJV && !jvValid}>
        <FilePlus className="h-5 w-5" /> Create Bid & Start Preparing
      </Button>
    </div>
  );
}
