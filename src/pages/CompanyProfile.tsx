import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/storage';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';

const schema = z.object({
  companyName: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  panVatNumber: z.string().min(1, 'Required'),
  registrationNumber: z.string().min(1, 'Required'),
  authorizedRepresentative: z.string().min(1, 'Required'),
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
      contactPhone: '',
      contactEmail: '',
    },
  });

  function onSubmit(data: z.infer<typeof schema>) {
    saveCompanyProfile(data as import('@/lib/types').CompanyProfile);
    toast.success('Company profile saved!');
  }

  const fields = [
    { name: 'companyName' as const, label: 'Company Name (कम्पनीको नाम)', placeholder: 'ABC Construction Pvt. Ltd.' },
    { name: 'address' as const, label: 'Address (ठेगाना)', placeholder: 'Kathmandu, Nepal' },
    { name: 'panVatNumber' as const, label: 'PAN/VAT Number (प्यान/भ्याट नम्बर)', placeholder: '123456789' },
    { name: 'registrationNumber' as const, label: 'Registration Number (दर्ता नम्बर)', placeholder: 'REG-12345' },
    { name: 'authorizedRepresentative' as const, label: 'Authorized Representative (अधिकृत प्रतिनिधि)', placeholder: 'Ram Bahadur Shrestha' },
    { name: 'contactPhone' as const, label: 'Contact Phone (सम्पर्क फोन)', placeholder: '+977-1-XXXXXXX' },
    { name: 'contactEmail' as const, label: 'Contact Email (इमेल)', placeholder: 'info@company.com.np' },
  ];

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
          <CardDescription>These details auto-fill your bid templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{f.label}</FormLabel>
                      <FormControl>
                        <Input placeholder={f.placeholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
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
