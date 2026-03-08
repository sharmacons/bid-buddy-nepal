import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BOQItem } from './types';

export interface ExtractedBidInfo {
  projectName?: string;
  employer?: string;
  employerAddress?: string;
  ifbNumber?: string;
  contractId?: string;
  submissionDeadline?: string;
  bidValidity?: string;
  completionPeriod?: string;
  commencementDays?: string;
  bidSecurityAmount?: string;
  performanceSecurityPercent?: string;
  estimatedCost?: string;
  isJV?: boolean;
  boqItems?: Array<{ description: string; unit?: string; quantity?: number }>;
}

export interface AIScheduleActivity {
  name: string;
  duration: number;
  predecessors: number[];
  isMajor: boolean;
  linkType?: 'FS' | 'SS' | 'FF' | 'SF';
  lag?: number;
  boqItemIndices?: number[];
}

export interface AIScheduleResult {
  activities: AIScheduleActivity[];
  summary: string;
}

export interface FullAnalysisResult {
  projectName?: string;
  employer?: string;
  employerAddress?: string;
  district?: string;
  ifbNumber?: string;
  contractId?: string;
  lotNumber?: string;
  sourceOfFund?: string;
  bidType?: string;
  submissionDeadline?: string;
  bidOpeningDate?: string;
  preBidMeetingDate?: string;
  siteVisitDate?: string;
  estimatedCost?: string;
  bidSecurityAmount?: string;
  bidValidity?: string;
  completionPeriod?: string;
  commencementDays?: string;
  performanceSecurityPercent?: string;
  defectLiabilityPeriod?: string;
  isJV?: boolean;
  maxJVPartners?: number;
  minimumExperienceYears?: number;
  minimumTurnover?: string;
  earnestMoney?: string;
  boqItems?: Array<{ sn?: string; description: string; unit?: string; quantity?: number; rate?: number; amount?: number }>;
  specialConditions?: string[];
  summary?: string;
}

export async function extractBidInfo(text: string): Promise<ExtractedBidInfo | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: { type: 'extract-bid-info', text },
    });
    if (error) throw error;
    if (data?.error) {
      toast.error(data.error);
      return null;
    }
    return data?.result || null;
  } catch (e: any) {
    console.error('AI extract error:', e);
    toast.error('AI extraction failed. Please fill fields manually.');
    return null;
  }
}

export async function generateAISchedule(
  boqItems: BOQItem[],
  projectContext: { projectName?: string; totalDurationWeeks?: number }
): Promise<AIScheduleResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: {
        type: 'generate-schedule',
        text: boqItems.map(item => ({
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          amount: item.amount,
        })),
        projectContext: {
          projectName: projectContext.projectName,
          totalDurationWeeks: projectContext.totalDurationWeeks || 24,
        },
      },
    });
    if (error) throw error;
    if (data?.error) {
      toast.error(data.error);
      return null;
    }
    return data?.result || null;
  } catch (e: any) {
    console.error('AI schedule error:', e);
    toast.error('AI schedule generation failed. Using manual generation.');
    return null;
  }
}

export async function suggestContent(
  type: 'suggest-methodology' | 'suggest-site-organization' | 'suggest-mobilization',
  text: string,
  projectContext?: { projectName?: string; bidType?: string; bidAmount?: string; completionPeriod?: string; commencementDays?: string }
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: { type, text, projectContext },
    });
    if (error) throw error;
    if (data?.error) {
      toast.error(data.error);
      return null;
    }
    return data?.result || null;
  } catch (e: any) {
    console.error('AI suggest error:', e);
    toast.error('AI suggestion failed. Please write content manually.');
    return null;
  }
}
