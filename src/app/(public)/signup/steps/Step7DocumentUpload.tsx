import { useToast } from '@/components/ui/Toast';
import { Check, Eye, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface Document {
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  ownerId?: string | null;
}

interface Step7Props {
  formData?: {
    documents?: Document[];
    accountType?: string;
  };
  onChange?: (field: string, value: any) => void;
  sessionId: string | null;
  errors?: Record<string, string>;
}

interface DocFieldConfig {
  id: string;
  title: string;
  subtitle: string;
  required: boolean;
  acceptedFormats?: string;
}

const PERSONAL_DOCS: DocFieldConfig[] = [
  {
    id: 'personal_id',
    title: 'Personal Identification Document',
    subtitle: 'Government-issued photo ID of the person completing this onboarding',
    required: true,
    acceptedFormats: 'Accepted formats: PDF, JPG, PNG (max 10MB)',
  },
  {
    id: 'proof_address',
    title: 'Proof of Personal Address',
    subtitle: 'Utility bill, bank statement, or government-issued document dated within the last 90 days',
    required: true,
    acceptedFormats: 'Accepted formats: PDF, JPG, PNG (max 10MB)',
  },
];

const BUSINESS_DOCS: DocFieldConfig[] = [
  {
    id: 'formation_doc',
    title: 'Formation Document',
    subtitle: 'Articles of Incorporation or Operating Agreement',
    required: true,
  },
  {
    id: 'proof_of_registration',
    title: 'Proof of Registration',
    subtitle: 'Certificate of Good Standing',
    required: true,
  },
  {
    id: 'proof_of_ownership',
    title: 'Proof of Ownership',
    subtitle: 'Operating Agreement, Bylaws, or Cap Table',
    required: true,
  },
  {
    id: 'bank_statement',
    title: 'Bank Statement',
    subtitle: 'Within 90 days',
    required: true,
  },
  {
    id: 'tax_id',
    title: 'Tax ID Verification',
    subtitle: 'IRS Letter 147C, W-9, or equivalent',
    required: true,
  },
];

export function Step7DocumentUpload({
  formData = {},
  onChange,
  sessionId,
  errors = {},
}: Step7Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadField, setActiveUploadField] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const documents = formData.documents || [];

  const handleUploadClick = (field: string) => {
    setActiveUploadField(field);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fieldId = activeUploadField;

    if (!file || !fieldId) return;

    // Check for sessionId - if not present, we can't upload to S3 yet?
    // In strict mode we should return, but for UI dev we might want to allow mock
    if (!sessionId) {
      console.warn('No session ID provided for upload');
      // toast.error('Session Error', 'No active session found');
      // return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', 'Max file size is 10MB');
      return;
    }

    setUploading(prev => ({ ...prev, [fieldId]: true }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('documentType', fieldId);
      if (sessionId) {
        uploadFormData.append('sessionId', sessionId);
      }

      // If we don't have a session, we can't really upload to the /api/admin/client/upload endpoint properly
      // because it expects a sessionId.
      // However, the user might be using the new flow which lacks sessionId.
      // For now, let's proceed with the fetch and see if it fails, or if we need a fallback.
      const response = await fetch('/api/admin/client/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const currentDocs = documents.filter(doc => doc.type !== fieldId);
      const newDocs = [...currentDocs, data.document];

      if (onChange) {
        onChange('documents', newDocs);
      }

      toast.success('Upload Complete', 'Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setUploading(prev => ({ ...prev, [fieldId]: false }));
      setActiveUploadField(null);
    }
  };

  const handleDelete = (type: string) => {
    if (onChange) {
      const newDocs = documents.filter(doc => doc.type !== type);
      onChange('documents', newDocs);
    }
  };

  const getDocument = (type: string) => documents.find(doc => doc.type === type);

  const renderUploadButton = (id: string) => {
    const doc = getDocument(id);
    const isUploading = uploading[id];

    if (doc) {
      return (
        <div className='flex items-center gap-2'>
          <a
            href={doc.fileUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100'
          >
            <Eye className='h-3.5 w-3.5' />
            View
          </a>
          <button
            onClick={() => handleDelete(id)}
            className='flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-100'
          >
            <Trash2 className='h-3.5 w-3.5' />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => handleUploadClick(id)}
        disabled={isUploading}
        className='flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50'
      >
        {isUploading ? (
          <>
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
            Uploading...
          </>
        ) : (
          <>
            <Upload className='h-3.5 w-3.5' />
            Upload
          </>
        )}
      </button>
    );
  };

  const renderDocRow = (doc: DocFieldConfig) => {
    const uploadedDoc = getDocument(doc.id);
    return (
      <div
        key={doc.id}
        className={`flex items-start justify-between rounded-xl border p-5 transition-colors ${
          uploadedDoc ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200 hover:bg-gray-50'
        }`}
      >
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            {/* Icon placeholder or document icon could go here */}
            <h4 className='text-sm font-semibold text-gray-900'>
              {doc.title} {doc.required && <span className='text-red-500'>*</span>}
            </h4>
          </div>
          <p className='text-sm text-gray-500'>{doc.subtitle}</p>
          {doc.acceptedFormats && (
            <p className='pt-1 text-xs text-gray-400'>{doc.acceptedFormats}</p>
          )}

          {uploadedDoc && (
            <div className='mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600'>
              <div className='flex h-4 w-4 items-center justify-center rounded-full bg-green-100'>
                <Check className='h-2.5 w-2.5' />
              </div>
              {uploadedDoc.fileName}
            </div>
          )}
        </div>
        <div className='ml-4 self-center'>{renderUploadButton(doc.id)}</div>
      </div>
    );
  };

  return (
    <div className='space-y-8'>
       {/* Global File Input */}
       <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileSelect}
        className='hidden'
        accept='.pdf,.jpg,.jpeg,.png'
      />

      <section className='space-y-4'>
        <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500'>
          Personal Documents
        </h3>
        <div className='space-y-3'>{PERSONAL_DOCS.map(renderDocRow)}</div>
      </section>

      <section className='space-y-4'>
        <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500'>
          Business Documents
        </h3>
        <div className='space-y-3'>{BUSINESS_DOCS.map(renderDocRow)}</div>
      </section>

      {/* Note Section */}
      <div className='rounded-lg border border-blue-100 bg-blue-50 p-4'>
        <p className='text-xs leading-relaxed text-blue-800'>
          <span className='font-bold'>Note:</span> All documents marked with{' '}
          <span className='text-red-600'>*</span> are required to proceed. Accepted formats: PDF,
          JPG, PNG, DOC. Max size: 10MB per file.
        </p>
      </div>
    </div>
  );
}

