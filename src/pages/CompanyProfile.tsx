import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/storage';
import { CompanyProfile as CompanyProfileType } from '@/lib/types';
import { toast } from 'sonner';
import { Building2, Save, Users, User, Upload, X, Image } from 'lucide-react';

const DESIGNATION_OPTIONS = [
  'Managing Director (व्यवस्थापन सञ्चालक)',
  'Proprietor (प्रोप्राइटर)',
  'Partner (साझेदार)',
  'Director (सञ्चालक)',
  'Chairman (अध्यक्ष)',
  'General Manager (महाप्रबन्धक)',
];

const singleSchema = z.object({
  companyName: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  panVatNumber: z.string().min(1, 'Required'),
  registrationNumber: z.string().min(1, 'Required'),
  authorizedRepresentative: z.string().min(1, 'Required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Required' }),
  fatherName: z.string().min(1, 'Required'),
  grandfatherName: z.string().min(1, 'Required'),
  designation: z.string().min(1, 'Required'),
  contactPhone: z.string().min(1, 'Required'),
  contactEmail: z.string().email('Invalid email'),
});

const jvSchema = z.object({
  jvName: z.string().min(1, 'JV Name required'),
  jvAddress: z.string().min(1, 'JV Address required'),
  jvLeadCompanyName: z.string().min(1, 'Lead company name required'),
  jvLeadAddress: z.string().min(1, 'Required'),
  jvLeadPanVat: z.string().min(1, 'Required'),
  jvLeadRegistration: z.string().min(1, 'Required'),
  jvLeadRepresentative: z.string().min(1, 'Required'),
  jvLeadGender: z.enum(['male', 'female', 'other'], { required_error: 'Required' }),
  jvLeadFatherName: z.string().min(1, 'Required'),
  jvLeadGrandfatherName: z.string().min(1, 'Required'),
  jvLeadDesignation: z.string().min(1, 'Required'),
  jvLeadPhone: z.string().min(1, 'Required'),
  jvLeadEmail: z.string().email('Invalid email'),
});

function RepresentativeFields({ form, prefix, label }: { form: any; prefix: string; label: string }) {
  return (
    <>
      <div className="border-t pt-4 mt-4">
        <p className="text-sm font-semibold text-primary mb-3">👤 {label}</p>
      </div>
      <FormField control={form.control} name={`${prefix}Representative`} render={({ field }) => (
        <FormItem><FormLabel>Full Name (पूरा नाम) *</FormLabel><FormControl><Input placeholder="Sharada Sharma" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-3 gap-3">
        <FormField control={form.control} name={`${prefix}Gender`} render={({ field }) => (
          <FormItem>
            <FormLabel>Gender (लिङ्ग) *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="male">Mr. (श्रीमान)</SelectItem>
                <SelectItem value="female">Mrs./Ms. (श्रीमती)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={`${prefix}FatherName`} render={({ field }) => (
          <FormItem><FormLabel>Father's Name *</FormLabel><FormControl><Input placeholder="Tribendra Singh" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${prefix}GrandfatherName`} render={({ field }) => (
          <FormItem><FormLabel>Grandfather's Name *</FormLabel><FormControl><Input placeholder="Nim Bahadur" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name={`${prefix}Designation`} render={({ field }) => (
        <FormItem>
          <FormLabel>Designation / पद *</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger></FormControl>
            <SelectContent>
              {DESIGNATION_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name={`${prefix}Phone`} render={({ field }) => (
          <FormItem><FormLabel>Phone (सम्पर्क) *</FormLabel><FormControl><Input placeholder="9841158323" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${prefix}Email`} render={({ field }) => (
          <FormItem><FormLabel>Email (इमेल) *</FormLabel><FormControl><Input placeholder="info@company.com.np" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
    </>
  );
}

export default function CompanyProfile() {
  const existing = getCompanyProfile();
  const [bidMode, setBidMode] = useState<'single' | 'jv'>(existing?.bidMode || 'single');
  const [logoUrl, setLogoUrl] = useState<string>(existing?.logoUrl || '');
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Logo must be under 500KB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      toast.success('Logo uploaded! Save profile to keep it.');
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoUrl('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  const singleForm = useForm<z.infer<typeof singleSchema>>({
    resolver: zodResolver(singleSchema),
    defaultValues: {
      companyName: existing?.companyName || '',
      address: existing?.address || '',
      panVatNumber: existing?.panVatNumber || '',
      registrationNumber: existing?.registrationNumber || '',
      authorizedRepresentative: existing?.authorizedRepresentative || '',
      gender: existing?.gender || 'male',
      fatherName: existing?.fatherName || '',
      grandfatherName: existing?.grandfatherName || '',
      designation: existing?.designation || '',
      contactPhone: existing?.contactPhone || '',
      contactEmail: existing?.contactEmail || '',
    },
  });

  const jvForm = useForm<z.infer<typeof jvSchema>>({
    resolver: zodResolver(jvSchema),
    defaultValues: {
      jvName: existing?.jvName || '',
      jvAddress: existing?.jvAddress || '',
      jvLeadCompanyName: existing?.jvLeadCompanyName || '',
      jvLeadAddress: existing?.jvLeadAddress || '',
      jvLeadPanVat: existing?.jvLeadPanVat || '',
      jvLeadRegistration: existing?.jvLeadRegistration || '',
      jvLeadRepresentative: existing?.jvLeadRepresentative || '',
      jvLeadGender: existing?.jvLeadGender || 'male',
      jvLeadFatherName: existing?.jvLeadFatherName || '',
      jvLeadGrandfatherName: existing?.jvLeadGrandfatherName || '',
      jvLeadDesignation: existing?.jvLeadDesignation || '',
      jvLeadPhone: existing?.jvLeadPhone || '',
      jvLeadEmail: existing?.jvLeadEmail || '',
    },
  });

  function onSingleSubmit(data: z.infer<typeof singleSchema>) {
    saveCompanyProfile({
      bidMode: 'single',
      companyName: data.companyName,
      address: data.address,
      panVatNumber: data.panVatNumber,
      registrationNumber: data.registrationNumber,
      authorizedRepresentative: data.authorizedRepresentative,
      gender: data.gender,
      fatherName: data.fatherName,
      grandfatherName: data.grandfatherName,
      designation: data.designation,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      logoUrl: logoUrl || undefined,
    });
    toast.success('Company profile saved!');
  }

  function onJvSubmit(data: z.infer<typeof jvSchema>) {
    const profile: CompanyProfileType = {
      bidMode: 'jv',
      companyName: data.jvLeadCompanyName,
      address: data.jvLeadAddress,
      panVatNumber: data.jvLeadPanVat,
      registrationNumber: data.jvLeadRegistration,
      authorizedRepresentative: data.jvLeadRepresentative,
      gender: data.jvLeadGender,
      fatherName: data.jvLeadFatherName,
      grandfatherName: data.jvLeadGrandfatherName,
      designation: data.jvLeadDesignation,
      contactPhone: data.jvLeadPhone,
      contactEmail: data.jvLeadEmail,
      ...data,
    };
    saveCompanyProfile(profile);
    toast.success('JV profile saved!');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Company Profile</h1>
          <p className="text-sm text-muted-foreground">कम्पनी विवरण — saved to your browser</p>
        </div>
      </div>

      {/* Mode Selector */}
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-3">How are you bidding? (बोलपत्र कसरी पेश गर्नुहुन्छ?)</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBidMode('single')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${bidMode === 'single' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
            >
              <User className={`h-6 w-6 mb-2 ${bidMode === 'single' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-semibold text-sm">Single Entity (एकल)</p>
              <p className="text-[11px] text-muted-foreground mt-1">One company bidding alone</p>
            </button>
            <button
              type="button"
              onClick={() => setBidMode('jv')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${bidMode === 'jv' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
            >
              <Users className={`h-6 w-6 mb-2 ${bidMode === 'jv' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-semibold text-sm">Joint Venture (संयुक्त उपक्रम)</p>
              <p className="text-[11px] text-muted-foreground mt-1">Multiple companies bidding together</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Single Entity Form */}
      {bidMode === 'single' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Details (कम्पनी विवरण)</CardTitle>
            <CardDescription>These details auto-fill your bid templates and letterhead</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...singleForm}>
              <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
                <FormField control={singleForm.control} name="companyName" render={({ field }) => (
                  <FormItem><FormLabel>Company Name (कम्पनीको नाम) *</FormLabel><FormControl><Input placeholder="ABC Construction Pvt. Ltd." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={singleForm.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address (ठेगाना) *</FormLabel><FormControl><Input placeholder="Tulshipur-5, Dang" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={singleForm.control} name="panVatNumber" render={({ field }) => (
                    <FormItem><FormLabel>PAN/VAT (प्यान/भ्याट) *</FormLabel><FormControl><Input placeholder="305284884" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={singleForm.control} name="registrationNumber" render={({ field }) => (
                    <FormItem><FormLabel>Registration No. *</FormLabel><FormControl><Input placeholder="REG-12345" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <RepresentativeFields form={singleForm} prefix="authorized" label="Authorized Representative Details" />
                <Button type="submit" className="w-full gap-2">
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* JV Form */}
      {bidMode === 'jv' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Joint Venture Details (संयुक्त उपक्रम विवरण)</CardTitle>
              <CardDescription>JV name & address — JV PAN is issued only after contract award</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...jvForm}>
                <form onSubmit={jvForm.handleSubmit(onJvSubmit)} className="space-y-4">
                  <FormField control={jvForm.control} name="jvName" render={({ field }) => (
                    <FormItem><FormLabel>JV Name (संयुक्त उपक्रमको नाम) *</FormLabel><FormControl><Input placeholder="ABC-XYZ JV" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={jvForm.control} name="jvAddress" render={({ field }) => (
                    <FormItem><FormLabel>JV Address (ठेगाना) *</FormLabel><FormControl><Input placeholder="Kathmandu, Nepal" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                    ℹ️ JV does not have a PAN/VAT number at bidding stage. JV PAN is issued by IRD only after contract award.
                  </div>

                  <div className="border-t pt-4 mt-2">
                    <p className="text-sm font-semibold text-primary mb-3">🏢 Lead Partner Company Details</p>
                  </div>

                  <FormField control={jvForm.control} name="jvLeadCompanyName" render={({ field }) => (
                    <FormItem><FormLabel>Lead Company Name *</FormLabel><FormControl><Input placeholder="ABC Construction Pvt. Ltd." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={jvForm.control} name="jvLeadAddress" render={({ field }) => (
                    <FormItem><FormLabel>Lead Company Address *</FormLabel><FormControl><Input placeholder="Tulshipur-5, Dang" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={jvForm.control} name="jvLeadPanVat" render={({ field }) => (
                      <FormItem><FormLabel>Lead Company PAN/VAT *</FormLabel><FormControl><Input placeholder="305284884" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={jvForm.control} name="jvLeadRegistration" render={({ field }) => (
                      <FormItem><FormLabel>Lead Company Reg. No. *</FormLabel><FormControl><Input placeholder="REG-12345" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <RepresentativeFields form={jvForm} prefix="jvLead" label="Lead Partner's Authorized Representative" />

                  <Button type="submit" className="w-full gap-2">
                    <Save className="h-4 w-4" /> Save JV Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-4 text-sm text-muted-foreground">
              💡 <strong>JV Partner details</strong> (Partner 2, Partner 3) are entered when creating a bid in the <strong>New Bid</strong> page with JV share percentages and representative info.
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
