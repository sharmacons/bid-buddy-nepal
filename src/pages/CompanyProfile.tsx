import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/storage';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';

const DESIGNATION_OPTIONS = [
  'Managing Director (व्यवस्थापन सञ्चालक)',
  'Proprietor (प्रोप्राइटर)',
  'Partner (साझेदार)',
  'Director (सञ्चालक)',
  'Chairman (अध्यक्ष)',
  'General Manager (महाप्रबन्धक)',
];

const schema = z.object({
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

export default function CompanyProfile() {
  const existing = getCompanyProfile();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: existing || {
      companyName: '',
      address: '',
      panVatNumber: '',
      registrationNumber: '',
      authorizedRepresentative: '',
      gender: 'male' as const,
      fatherName: '',
      grandfatherName: '',
      designation: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  function onSubmit(data: z.infer<typeof schema>) {
    saveCompanyProfile(data as import('@/lib/types').CompanyProfile);
    toast.success('Company profile saved!');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Company Profile</h1>
          <p className="text-sm text-muted-foreground">कम्पनी विवरण — saved to your browser</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Details</CardTitle>
          <CardDescription>These details auto-fill your bid templates and letterhead</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Company Name */}
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel>Company Name (कम्पनीको नाम) *</FormLabel><FormControl><Input placeholder="ABC Construction Pvt. Ltd." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (ठेगाना) *</FormLabel><FormControl><Input placeholder="Tulshipur-5, Dang" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="panVatNumber" render={({ field }) => (
                  <FormItem><FormLabel>PAN/VAT (प्यान/भ्याट) *</FormLabel><FormControl><Input placeholder="305284884" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                  <FormItem><FormLabel>Registration No. (दर्ता नम्बर) *</FormLabel><FormControl><Input placeholder="REG-12345" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold text-primary mb-3">👤 Authorized Representative Details</p>
              </div>

              <FormField control={form.control} name="authorizedRepresentative" render={({ field }) => (
                <FormItem><FormLabel>Full Name (पूरा नाम) *</FormLabel><FormControl><Input placeholder="Sharada Sharma" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="gender" render={({ field }) => (
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
                <FormField control={form.control} name="fatherName" render={({ field }) => (
                  <FormItem><FormLabel>Father's Name (बुबाको नाम) *</FormLabel><FormControl><Input placeholder="Tribendra Singh" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="grandfatherName" render={({ field }) => (
                  <FormItem><FormLabel>Grandfather's Name (हजुरबुबाको नाम) *</FormLabel><FormControl><Input placeholder="Nim Bahadur" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="designation" render={({ field }) => (
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
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                  <FormItem><FormLabel>Contact Phone (सम्पर्क) *</FormLabel><FormControl><Input placeholder="9841158323" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem><FormLabel>Email (इमेल) *</FormLabel><FormControl><Input placeholder="info@company.com.np" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full gap-2">
                <Save className="h-4 w-4" /> Save Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
