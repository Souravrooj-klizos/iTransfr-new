'use client';

import CompleteIcon from '@/components/icons/CompleteIcon';
import FailedIcon from '@/components/icons/FailedIcon';
import PendingIcon from '@/components/icons/PendingIcon';
import ProcessingIcon from '@/components/icons/ProcessingIcon';
import { useState } from 'react';

// Generic column definition
export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T, index?: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  showCheckbox?: boolean;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  selectedIds?: Set<string>;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  showCheckbox = false,
  onSelectionChange,
  selectedIds: controlledSelectedIds,
}: DataTableProps<T>) {
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());

  const selectedRows = controlledSelectedIds ?? internalSelectedRows;
  const setSelectedRows = (newSet: Set<string>) => {
    if (!controlledSelectedIds) {
      setInternalSelectedRows(newSet);
    }
    onSelectionChange?.(newSet);
  };

  const [selectAll, setSelectAll] = useState(false);

  // Sync selectAll state when selectedRows changes externally for floating action bar
  // This is a simple check: if all visible rows are selected
  if (controlledSelectedIds && data.length > 0 && selectedRows.size !== data.length && selectAll) {
    // If we have controlled IDs and they don't match data length, we might need to uncheck selectAll
    // However, exact sync is complex with pagination/filters.
    // For now, let's just ensure if selection is cleared externally, selectAll is cleared.
    if (selectedRows.size === 0) setSelectAll(false);
  } else if (
    controlledSelectedIds &&
    data.length > 0 &&
    selectedRows.size === data.length &&
    !selectAll
  ) {
    setSelectAll(true);
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      onSelectionChange?.(new Set());
    } else {
      const allIds = new Set(data.map(row => getRowId(row)));
      setSelectedRows(allIds);
      onSelectionChange?.(allIds);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === data.length);
    onSelectionChange?.(newSelected);
  };

  return (
    <div className='overflow-hidden rounded-lg border border-gray-200'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-gray-200 bg-gray-50'>
              {showCheckbox && (
                <th className='px-6 py-3 text-left'>
                  <input
                    type='checkbox'
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className='h-4 w-4 rounded border-gray-200 text-blue-600 focus:ring-blue-500'
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {data.map((row, rowIndex) => {
              const rowId = getRowId(row);
              return (
                <tr key={rowId} className='transition-colors hover:bg-gray-50'>
                  {showCheckbox && (
                    <td className='px-6 py-3'>
                      <input
                        type='checkbox'
                        checked={selectedRows.has(rowId)}
                        onChange={() => handleSelectRow(rowId)}
                        className='h-4 w-4 rounded border-gray-200 text-blue-600 focus:ring-blue-500'
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`px-6 py-3 whitespace-nowrap ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }`}
                    >
                      {column.render(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to get status icon
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return <CompleteIcon />;
    case 'Processing':
      return <ProcessingIcon />;
    case 'Failed':
      return <FailedIcon />;
    case 'Pending':
      return <PendingIcon />;
    default:
      return <ProcessingIcon />;
  }
};

// Helper function to get amount color
export const getAmountColor = (amountColor?: 'success' | 'error' | 'neutral') => {
  switch (amountColor) {
    case 'success':
      return 'var(--color-success-green)';
    case 'error':
      return 'var(--color-error-red)';
    default:
      return 'var(--color-gray-900)';
  }
};
