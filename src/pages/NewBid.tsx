import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [deadline, setDeadline] = useState('');

  function handleCreate() {
    if (!projectName || !employer || !deadline) {
      toast.error('Please fill all fields');
      return;
    }
    const id = crypto.randomUUID();
    saveBid({
      id,
      projectName,
      employer,
      bidType,
      status: 'preparing',
      submissionDeadline: deadline,
      createdAt: new Date().toISOString(),
      checklist: getChecklistForType(bidType),
      boqItems: [],
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
            <Label>Bid Type (बोलपत्र प्रकार)</Label>
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
            <Label>Project Name (परियोजनाको नाम)</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Road Construction - Kathmandu Ring Road Section"
            />
          </div>

          <div className="space-y-2">
            <Label>Employer / Procuring Entity (नियोक्ता)</Label>
            <Input
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="e.g., Department of Roads"
            />
          </div>

          <div className="space-y-2">
            <Label>Submission Deadline (बोलपत्र पेश गर्ने अन्तिम मिति)</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <Button onClick={handleCreate} className="w-full gap-2">
            <FilePlus className="h-4 w-4" /> Create Bid & Start Preparing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
