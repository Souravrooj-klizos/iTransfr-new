'use client';

import DeleteIcon from '@/components/icons/DeleteIcon';
import { Button } from '@/components/ui/Button';
import { adminClientApi } from '@/lib/api/admin-client';
import { FileText, Mail, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AddNoteModal } from './AddNoteModal';

interface Note {
  id: string;
  type: 'Email' | 'General';
  content: string;
  timestamp: string;
}

interface ClientNotesProps {
  clientId: string;
}

export function ClientNotes({ clientId }: ClientNotesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against duplicate fetch calls (React StrictMode)
  const hasFetched = useRef(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await adminClientApi.getNotes(clientId);
      if (response.success) {
        setNotes(response.notes);
      } else {
        setError('Failed to load notes');
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Error loading notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotes();
    }
  }, [clientId]);

  const handleDelete = async (id: string) => {
    try {
      // Optimistic update
      const previousNotes = [...notes];
      setNotes(notes.filter(note => note.id !== id));

      const response = await adminClientApi.deleteNote(clientId, id);
      if (!response.success) {
        // Revert if failed
        setNotes(previousNotes);
        // Could show toast error here
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleAddNote = async (newNote: { type: 'Email' | 'General'; content: string }) => {
    try {
      const response = await adminClientApi.createNote(clientId, newNote);
      if (response.success) {
        setNotes([response.note, ...notes]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className='flex items-center justify-center p-12 rounded-xl border border-gray-200 bg-white'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 rounded-xl border border-gray-200 bg-white p-6'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
        <h2 className='text-lg font-semibold text-gray-900'>Notes ({notes.length})</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className='bg-gradient-blue flex h-10 cursor-pointer items-center gap-2 rounded-lg border-none px-4 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90'
        >
          <Plus className='h-4 w-4' />
          Add Note
        </Button>
      </div>

      {/* Notes List */}
      <div className='space-y-2'>
        {notes.length > 0 ? (
          notes.map(note => (
            <div
              key={note.id}
              className='flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm'
            >
              <div className='flex items-center gap-4'>
                {/* Icon Circle */}
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50'>
                  {note.type === 'Email' ? (
                    <Mail className='h-5 w-5 text-blue-500' />
                  ) : (
                    <FileText className='h-5 w-5 text-blue-500' />
                  )}
                </div>

                {/* Content */}
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='rounded border border-gray-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 uppercase'>
                      {note.type}
                    </span>
                    <span className='text-xs font-medium text-gray-400'>{note.timestamp}</span>
                  </div>
                  <p className='text-sm font-medium text-gray-800'>{note.content}</p>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleDelete(note.id)}
                className='flex cursor-pointer items-center gap-2 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50'
              >
                <DeleteIcon />
                Delete
              </button>
            </div>
          ))
        ) : (
          <div className='flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/30 p-8 text-center'>
            <p className='text-sm text-gray-500 italic'>No notes found for this client.</p>
          </div>
        )}
      </div>

      <AddNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNote}
      />
    </div>
  );
}
