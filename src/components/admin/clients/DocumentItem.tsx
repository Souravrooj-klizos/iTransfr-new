'use client';

import { Button } from '@/components/ui/Button';
import { Check, Eye, FileText, Upload } from 'lucide-react';

interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
  status?: string;
}

interface DocumentItemProps {
  title: string;
  description?: string;
  document?: UploadedDocument;
  onUpload?: () => void;
  onDelete?: (documentId: string) => void;
  variant?: 'dashed' | 'solid';
}

export function DocumentItem({
  title,
  description,
  document,
  onUpload,
  onDelete,
  variant = 'dashed',
}: DocumentItemProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // If document exists, show uploaded state
  if (document) {
    return (
      <div
        className={`flex items-center justify-between p-3 ${
          variant === 'dashed'
            ? 'rounded-xl border border-green-200 bg-green-50/30'
            : 'py-3 border-b border-gray-100 last:border-b-0'
        }`}
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-green-100'>
            <FileText className='h-4 w-4 text-green-600' />
          </div>
          <div className='space-y-0.5'>
            <div className='flex items-center gap-2'>
              <h4 className='text-sm font-semibold text-gray-900'>{title}</h4>
              <Check className='h-4 w-4 text-green-500' />
            </div>
            {/* Clickable filename to preview */}
            <a
              href={document.fileUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
            >
              {document.fileName}
              {document.fileSize && ` • ${formatFileSize(document.fileSize)}`}
            </a>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {/* Preview button */}
          <a
            href={document.fileUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
          >
            <Eye className='h-3.5 w-3.5' />
          </a>
        </div>
      </div>
    );
  }

  // No document - show upload state
  return (
    <div
      className={`flex items-center justify-between p-3 ${
        variant === 'dashed'
          ? 'rounded-xl border-dashed border-gray-200 border'
          : 'py-3'
      }`}
    >
      <div className='space-y-1'>
        <h4 className='text-sm font-semibold text-gray-900'>{title}</h4>
        {description && <p className='text-xs font-normal text-gray-400'>{description}</p>}
      </div>
      <Button
        variant='outline'
        onClick={onUpload}
        className='flex h-8 cursor-pointer items-center gap-2 border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50'
      >
        <Upload className='h-4 w-4' />
        Upload File
      </Button>
    </div>
  );
}
