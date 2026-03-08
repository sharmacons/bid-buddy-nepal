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
import { BidType, BID_TYPE_LABELS } from '@/lib/types';
import { toast } from 'sonner';
import { FilePlus } from 'lucide-react';

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

  function handleCreate() {
    if (!projectName || !employer || !deadline) {
      toast.error('Please fill all required fields');
      return;
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
      jvPartners: [],
      runningContracts: [],
      workSchedule: [],
      ifbNumber,
      contractId,
    });
    toast.success('Bid created!');
    navigate(`/bid/${id}`);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FilePlus className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">New Bid</h1>
          <p className="text-sm text-muted-foreground">नयाँ बोलपत्र तयार गर्नुहोस्</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bid Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bid Type (बोलपत्र प्रकार) *</Label>
            <Select value={bidType} onValueChange={(v) => setBidType(v as BidType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BID_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Project Name (परियोजनाको नाम) *</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Upgrading of Baglung-Rakse-Doholi Road"
            />
          </div>

          <div className="space-y-2">
            <Label>Employer / Procuring Entity (नियोक्ता) *</Label>
            <Input
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="e.g., Road Infrastructure Development Office, Gulmi"
            />
          </div>

          <div className="space-y-2">
            <Label>Employer Address (नियोक्ताको ठेगाना)</Label>
            <Input
              value={employerAddress}
              onChange={(e) => setEmployerAddress(e.target.value)}
              placeholder="e.g., Gulmi, Nepal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>IFB Number (बोलपत्र नम्बर)</Label>
              <Input
                value={ifbNumber}
                onChange={(e) => setIfbNumber(e.target.value)}
                placeholder="e.g., 07/079-80"
              />
            </div>
            <div className="space-y-2">
              <Label>Contract ID (ठेक्का नम्बर)</Label>
              <Input
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder="e.g., RIDO/GUL/W/NCB/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Submission Deadline (अन्तिम मिति) *</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Joint Venture (संयुक्त उपक्रम)</Label>
              <p className="text-xs text-muted-foreground">Are you bidding as a JV?</p>
            </div>
            <Switch checked={isJV} onCheckedChange={setIsJV} />
          </div>

          <Button onClick={handleCreate} className="w-full gap-2">
            <FilePlus className="h-4 w-4" /> Create Bid & Start Preparing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
