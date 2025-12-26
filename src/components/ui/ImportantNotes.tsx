interface ImportantNotesProps {
  notes: string[];
  className?: string;
}

export function ImportantNotes({ notes, className = '' }: ImportantNotesProps) {
  return (
    <div className={`rounded-lg border border-amber-400 bg-orange-50/70 p-4 ${className}`}>
      <h3 className='mb-2 text-sm font-semibold text-amber-600'>Important Notes:</h3>
      <ul className='space-y-1'>
        {notes.map((note, index) => (
          <li key={index} className='flex items-start text-xs text-amber-600'>
            <span className='mr-2'>•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
