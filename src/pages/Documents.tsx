import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDocuments, saveDocument, deleteDocument } from '@/lib/storage';
import { DocumentTag, DOCUMENT_TAG_LABELS, StoredDocument } from '@/lib/types';
import { toast } from 'sonner';
import { FolderArchive, Upload, Trash2, FileIcon } from 'lucide-react';

export default function Documents() {
  const [docs, setDocs] = useState(() => getDocuments());
  const [tag, setTag] = useState<DocumentTag>('company-registration');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const doc: StoredDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: tag,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };
      saveDocument(doc);
      setDocs(getDocuments());
      toast.success(`${file.name} uploaded!`);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleDelete(id: string) {
    deleteDocument(id);
    setDocs(getDocuments());
    toast.success('Document deleted');
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FolderArchive className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Document Library</h1>
          <p className="text-sm text-muted-foreground">कागजात भण्डार — Store reusable certificates & documents</p>
        </div>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Select value={tag} onValueChange={(v) => setTag(v as DocumentTag)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TAG_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Upload File
            </Button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </div>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC — max 5MB. Files stored in browser.</p>
        </CardContent>
      </Card>

      {/* Document List */}
      {docs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No documents uploaded yet. Upload your certificates and reusable documents above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{DOCUMENT_TAG_LABELS[doc.type]}</Badge>
                    <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
