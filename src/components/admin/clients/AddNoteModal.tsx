'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/TextArea';
import { Plus } from 'lucide-react';

import React, { useState } from 'react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (note: { type: 'Email' | 'General'; content: string }) => void;
}

export function AddNoteModal({ isOpen, onClose, onAdd }: AddNoteModalProps) {
  const [type, setType] = useState<'Email' | 'General'>('General');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAdd({
      type,
      content,
    });

    // Reset and close
    setContent('');
    setType('General');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add Note' size='md' className='p-0'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium text-gray-700'>Note Type</label>
            <Select
              value={type}
              onChange={val => setType(val as 'Email' | 'General')}
              options={[
                { label: 'General', value: 'General' },
                { label: 'Email', value: 'Email' },
              ]}
              className='h-11 border-gray-200 focus:ring-blue-500'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-medium text-gray-700'>Content</label>
            <Textarea
              placeholder='Enter note details...'
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              className='min-h-[120px] w-full rounded-xl border-gray-200 p-4 focus:ring-blue-500'
            />
          </div>
        </div>

        <div className='pt-2'>
          <Button
            type='submit'
            className='bg-gradient-blue flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-medium text-white transition-all hover:bg-blue-700'
          >
            <Plus className='h-4 w-4' />
            Add Note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
