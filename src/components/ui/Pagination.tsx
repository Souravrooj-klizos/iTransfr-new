import { Select } from '@/components/ui/Select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: string;
  onItemsPerPageChange?: (value: string) => void;
  itemsPerPageOptions?: { value: string; label: string }[];
  showItemsPerPage?: boolean;
  className?: string;
  renderLeft?: React.ReactNode;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = '10',
  onItemsPerPageChange,
  itemsPerPageOptions = [
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
  ],
  showItemsPerPage = true,
  className = '',
  renderLeft,
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          '...',
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row ${className}`}
    >
      {/* Left side: Results info */}
      <div className='flex-1'>{renderLeft}</div>

      {/* Center: Page numbers */}
      <div className='flex flex-1 items-center justify-center gap-2'>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white'
          aria-label='Previous page'
        >
          <ChevronLeft className='h-4 w-4' />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => (typeof page === 'number' ? onPageChange(page) : undefined)}
            disabled={page === '...'}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-gradient-blue text-white shadow-sm'
                : page === '...'
                  ? 'cursor-default text-gray-400'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white'
          aria-label='Next page'
        >
          <ChevronRight className='h-4 w-4' />
        </button>
      </div>

      {/* Right side: Items per page */}
      <div className='flex flex-1 items-center justify-end gap-2'>
        {showItemsPerPage && onItemsPerPageChange && (
          <>
            <span className='text-sm text-gray-600'>View per Page</span>
            <Select
              options={itemsPerPageOptions}
              value={itemsPerPage}
              onChange={onItemsPerPageChange}
              className='w-18'
              dropdownClassName='min-w-[80px]'
              direction='up'
            />
          </>
        )}
      </div>
    </div>
  );
}
