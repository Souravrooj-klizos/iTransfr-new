import { useToast } from '@/components/ui/Toast';
import { DOCUMENT_TYPES } from '@/lib/validations/client';
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

// Metadata for display purposes
const DOC_METADATA: Record<string, { title: string; subtitle: string }> = {
  // Personal
  passport: { title: 'Passport', subtitle: 'Valid government-issued passport' },
  driversLicenseFront: { title: "Driver's License (Front)", subtitle: 'Front of your license' },
  driversLicenseBack: { title: "Driver's License (Back)", subtitle: 'Back of your license' },
  idCard: { title: 'ID Card (Front)', subtitle: 'Government issued ID card' },
  idCardBack: { title: 'ID Card (Back)', subtitle: 'Back of ID card' },
  proofOfAddress: { title: 'Proof of Address', subtitle: 'Utility bill, bank statement, etc.' },
  selfie: { title: 'Selfie', subtitle: 'Photo of yourself holding your ID' },

  // Business/Fintech
  formationDocument: { title: 'Formation Document', subtitle: 'Articles of Incorporation or Operating Agreement' },
  proofOfRegistration: { title: 'Proof of Registration', subtitle: 'Certificate of Good Standing' },
  msbCert: { title: 'MSB Certificate', subtitle: 'Money Services Business Registration' },

  // Optional / Extra (Not strictly in DOCUMENT_TYPES but might be used)
  proofOfOwnership: { title: 'Proof of Ownership', subtitle: 'Operating Agreement, Bylaws, or Cap Table' },
  bankStatement: { title: 'Bank Statement', subtitle: 'Within 90 days' },
  taxIdVerification: { title: 'Tax ID Verification', subtitle: 'IRS Letter 147C, W-9, or equivalent' },
};

export function Step7DocumentUpload({ formData = {}, onChange, sessionId, errors = {} }: Step7Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadField, setActiveUploadField] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const documents = formData.documents || [];
  const accountType = (formData.accountType || 'business').toUpperCase(); // PERSONAL, BUSINESS, FINTECH

  // Determine which documents to show based on strict validation rules
  // We accept 'PERSONAL', 'BUSINESS', 'FINTECH' keys.
  // Fallback to BUSINESS if unknown.
  const requiredDocTypes = DOCUMENT_TYPES[accountType as keyof typeof DOCUMENT_TYPES] || DOCUMENT_TYPES.BUSINESS;

  // For Business/Fintech, we might also want to show the common optional docs that were previously hardcoded
  // if you want to keep them available.
  // If the user wants "strict rendering based on account type", we mainly focus on what is in DOCUMENT_TYPES.
  // However, often business logic requires more than just the validation minimums.
  // I will append the optional business docs if it's a business/fintech account,
  // but distinct them or just merge them if that's the desired UX.
  // For now, I will stick to what is in DOCUMENT_TYPES to solve the checking error,
  // plus append the standard extra business docs if it's not Personal, as they are likely useful.

  const additionalBusinessDocs = ['proofOfOwnership', 'bankStatement', 'taxIdVerification'];

  const displayDocs: string[] = [...requiredDocTypes];
  if (accountType !== 'PERSONAL') {
     // Add the extra business docs that aren't strict validation failures but are good to collect
     // Check if they aren't already in the list to avoid dupes
     additionalBusinessDocs.forEach(doc => {
         if (!displayDocs.includes(doc)) {
             displayDocs.push(doc);
         }
     });
  }

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

    if (!file || !fieldId || !sessionId) return;

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
      uploadFormData.append('sessionId', sessionId);

      const response = await fetch('/api/admin/client/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Add to documents list via onChange
      // Remove existing doc of same type if exists
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
            Upload File
          </>
        )}
      </button>
    );
  };

  const getDocTitle = (id: string) => DOC_METADATA[id]?.title || id;
  const getDocSubtitle = (id: string) => DOC_METADATA[id]?.subtitle || 'Required document';

  return (
    <div className='space-y-8'>
      {/* Hidden File Input */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileSelect}
        className='hidden'
        accept='.pdf,.jpg,.jpeg,.png'
      />

      {/* Dynamic Document Sections based on Account Type */}
      <section className='space-y-6 pr-2'>
        <h3 className='text-sm font-semibold text-gray-700'>
          {accountType === 'PERSONAL' ? 'Personal Documents' : 'Business Documents'}
        </h3>
        <div className='space-y-4'>
          {displayDocs.map(docId => {
               const uploadedDoc = getDocument(docId);
               return (
                   <div
                   key={docId}
                   className={`flex items-center justify-between rounded-lg border-2 border-dashed p-4 transition-colors ${
                       uploadedDoc ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:bg-gray-50/50'
                   }`}
                   >
                   <div className='space-y-0.5'>
                       <h4 className='text-sm font-medium text-gray-900'>{getDocTitle(docId)}</h4>
                       {uploadedDoc ? (
                            <p className='flex items-center gap-1 text-xs text-green-600'>
                            <Check className='h-3 w-3' />
                            {uploadedDoc.fileName}
                          </p>
                       ) : (
                           <p className='text-xs text-gray-500'>{getDocSubtitle(docId)}</p>
                       )}
                   </div>
                   {renderUploadButton(docId)}
                   </div>
               );
             })}
        </div>
      </section>

      {/* Note Section */}
      <div className='mb-2 rounded-lg border border-orange-100 bg-orange-50 p-4'>
        <p className='text-xs leading-relaxed text-yellow-600'>
          <span className='font-semibold'>Notes:</span> Documents can also be uploaded after
          client creation from the client detail page. Accepted formats: PDF, JPG, PNG. Max
          size: 10MB per file.
        </p>
      </div>
    </div>
  );
}
