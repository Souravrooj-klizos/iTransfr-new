'use client';

import React, { useRef, useState } from 'react';
import { Upload, Check, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  accept?: string;
  required?: boolean;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({
  label,
  accept = 'image/*,.pdf',
  required = false,
  onFileSelect,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Simple validation could go here (size, type)
    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className='mb-6'>
      <label className='mb-2 block text-sm font-medium text-gray-700'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input
            ref={inputRef}
            type='file'
            accept={accept}
            onChange={handleChange}
            className='hidden'
          />
          <Upload className='mb-2 h-8 w-8 text-gray-400' />
          <p className='text-center text-sm text-gray-600'>
            <span className='font-medium text-blue-600'>Choose a file</span> or drag & drop it here.
          </p>
          <p className='mt-1 text-xs text-gray-500'>JPEG, PNG, and PDF formats, up to 50 MB.</p>
          <button
            type='button'
            className='mt-4 rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50'
          >
            Browse File
          </button>
        </div>
      ) : (
        <div className='flex items-center justify-between rounded-lg border bg-gray-50 p-4'>
          <div className='flex items-center gap-3 overflow-hidden'>
            <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100'>
              <FileText className='h-5 w-5 text-blue-600' />
            </div>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-gray-900'>{file.name}</p>
              <p className='flex items-center gap-1 text-xs text-green-600'>
                Uploaded Successfully
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className='rounded-full p-1 transition-colors hover:bg-gray-200'
          >
            <span className='rounded border border-gray-300 px-2 py-1 text-xs text-gray-500 hover:bg-white'>
              Change
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
