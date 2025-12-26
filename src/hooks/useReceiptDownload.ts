/**
 * Receipt Download Hook
 *
 * Opens the receipt in a new tab where user can print to PDF.
 */

'use client';

import { useState } from 'react';

export function useReceiptDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadReceipt = async (transactionId: string, referenceNumber?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Open receipt in new tab - user can print to PDF from there
      const receiptUrl = `/api/receipts/${transactionId}`;
      window.open(receiptUrl, '_blank');

      return true;
    } catch (err: any) {
      console.error('[Receipt Download] Error:', err);
      setError(err.message || 'Failed to open receipt');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { downloadReceipt, loading, error };
}
