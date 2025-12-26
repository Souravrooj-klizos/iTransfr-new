'use client';

import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { Check, Circle } from 'lucide-react';

interface Step5Props {
  formData: any;
  updateFormData: (data: any) => void;
  onSubmit: () => void;
}

export function Step5KYC({ formData, updateFormData, onSubmit }: Step5Props) {
  const toast = useToast();

  const documents = [
    { id: 'passport', label: 'Passport copy' },
    { id: 'addressProof', label: 'Proof of address' },
    { id: 'photoId', label: 'Photo ID' },
  ];

  const isComplete = formData.passportFile && formData.addressProofFile && formData.photoIdFile;

  const handleSubmit = () => {
    if (!formData.passportFile) {
      toast.error('Missing Document', 'Please upload your passport copy');
      return;
    }
    if (!formData.addressProofFile) {
      toast.error('Missing Document', 'Please upload your proof of address');
      return;
    }
    if (!formData.photoIdFile) {
      toast.error('Missing Document', 'Please upload your photo ID');
      return;
    }

    onSubmit();
  };

  return (
    <div className='flex min-h-[600px] gap-8'>
      {/* Left Sidebar - Progress */}
      <div className='hidden w-1/3 border-r pr-6 md:flex md:flex-col'>
        <div className='flex-1'>
          <h2 className='mb-6 text-xl font-semibold text-gray-900'>Verify your KYC details</h2>
          <p className='mb-6 text-sm text-gray-600'>Documents that you will need to upload:</p>
          <div className='space-y-4'>
            {documents.map(doc => (
              <div key={doc.id} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-700'>{doc.label}</span>
                </div>
                {formData[`${doc.id}File`] ? (
                  <span className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500'>
                    <Check className='h-3 w-3 text-white' />
                  </span>
                ) : (
                  <Circle className='h-5 w-5 text-gray-300' />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Button at bottom of left sidebar */}
        <div className='mt-auto pt-6'>
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className='h-11 w-full cursor-pointer rounded-[10px] bg-gradient-to-b from-[#588CFF] to-[#2462EB] font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Upload & Continue
          </button>
        </div>
      </div>

      {/* Right Side - Upload Forms */}
      <div className='flex-1'>
        <div className='space-y-6'>
          <FileUpload
            label='Upload your Passport'
            onFileSelect={file => updateFormData({ passportFile: file })}
          />

          <FileUpload
            label='Upload your Proof of Address'
            onFileSelect={file => updateFormData({ addressProofFile: file })}
          />

          <FileUpload
            label='Upload your Photo ID'
            onFileSelect={file => updateFormData({ photoIdFile: file })}
          />
        </div>
      </div>
    </div>
  );
}
