/**
 * PDF Receipt Templates - Simple HTML-based version
 *
 * Generates professional PDF receipts using simple HTML string
 * that can be converted to PDF using various methods.
 */

// =====================================================
// DEPOSIT RECEIPT DATA
// =====================================================

export interface DepositReceiptData {
  referenceNumber: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Processing';
  amount: number;
  currency: string;
  chain?: string;
  walletAddress?: string;
  clientName: string;
  clientEmail?: string;
  transactionHash?: string;
}

// =====================================================
// PAYOUT RECEIPT DATA
// =====================================================

export interface PayoutReceiptData {
  referenceNumber: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Processing';
  amount: number;
  currency: string;
  recipientName: string;
  recipientBank: string;
  recipientAccount: string;
  recipientCountry?: string;
  clientName: string;
  clientEmail?: string;
  exchangeRate?: string;
  fees?: number;
}

// =====================================================
// HTML TEMPLATES
// =====================================================

const baseStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1f2937; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .tagline { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .receipt-info { text-align: right; }
    .receipt-number { font-size: 14px; font-weight: bold; color: #1f2937; }
    .receipt-date { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top: 8px; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: bold; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .amount-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0 24px 0; }
    .amount-row { display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 16px; color: #374151; }
    .amount-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .rate-text { font-size: 11px; color: #6b7280; text-align: right; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .label { color: #6b7280; font-size: 12px; }
    .value { font-weight: bold; color: #1f2937; font-size: 12px; }
    .footer { position: fixed; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; }
    .footer-text { font-size: 10px; color: #9ca3af; margin-bottom: 4px; }
    .footer-company { font-size: 11px; color: #6b7280; font-weight: bold; }
    .watermark { position: fixed; top: 40%; left: 25%; font-size: 80px; color: rgba(0,0,0,0.05); transform: rotate(-30deg); font-weight: bold; z-index: -1; }
  </style>
`;

export function generateDepositReceiptHTML(data: DepositReceiptData): string {
  const statusClass =
    data.status === 'Completed'
      ? 'status-completed'
      : data.status === 'Pending'
        ? 'status-pending'
        : 'status-processing';

  const watermark = data.status === 'Completed' ? '<div class="watermark">PAID</div>' : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Deposit Receipt - ${data.referenceNumber}</title>
      ${baseStyles}
    </head>
    <body>
      ${watermark}

      <div class="header">
        <div>
          <div class="logo">iTransfr</div>
          <div class="tagline">Secure International Transfers</div>
        </div>
        <div class="receipt-info">
          <div class="receipt-number">${data.referenceNumber}</div>
          <div class="receipt-date">${data.date}</div>
          <div class="status-badge ${statusClass}">${data.status.toUpperCase()}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Deposit Receipt</div>
      </div>

      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">Amount Deposited</span>
          <span class="amount-value">${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${data.currency}</span>
        </div>
        ${data.chain ? `<div class="rate-text">Network: ${data.chain}</div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Customer Details</div>
        <div class="row">
          <span class="label">Name</span>
          <span class="value">${data.clientName}</span>
        </div>
        ${
          data.clientEmail
            ? `
          <div class="row">
            <span class="label">Email</span>
            <span class="value">${data.clientEmail}</span>
          </div>
        `
            : ''
        }
      </div>

      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="row">
          <span class="label">Reference Number</span>
          <span class="value">${data.referenceNumber}</span>
        </div>
        <div class="row">
          <span class="label">Date</span>
          <span class="value">${data.date}</span>
        </div>
        ${
          data.walletAddress
            ? `
          <div class="row">
            <span class="label">Wallet Address</span>
            <span class="value" style="font-size: 10px; word-break: break-all;">${data.walletAddress}</span>
          </div>
        `
            : ''
        }
        ${
          data.transactionHash
            ? `
          <div class="row">
            <span class="label">Transaction Hash</span>
            <span class="value" style="font-size: 10px; word-break: break-all;">${data.transactionHash}</span>
          </div>
        `
            : ''
        }
      </div>

      <div class="footer">
        <div class="footer-text">This is an electronically generated receipt and does not require a signature.</div>
        <div class="footer-company">iTransfr Inc. | support@itransfr.com | www.itransfr.com</div>
      </div>
    </body>
    </html>
  `;
}

export function generatePayoutReceiptHTML(data: PayoutReceiptData): string {
  const statusClass =
    data.status === 'Completed'
      ? 'status-completed'
      : data.status === 'Pending'
        ? 'status-pending'
        : 'status-processing';

  const watermark = data.status === 'Completed' ? '<div class="watermark">SENT</div>' : '';
  const maskedAccount = data.recipientAccount ? `****${data.recipientAccount.slice(-4)}` : 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payout Receipt - ${data.referenceNumber}</title>
      ${baseStyles}
    </head>
    <body>
      ${watermark}

      <div class="header">
        <div>
          <div class="logo">iTransfr</div>
          <div class="tagline">Secure International Transfers</div>
        </div>
        <div class="receipt-info">
          <div class="receipt-number">${data.referenceNumber}</div>
          <div class="receipt-date">${data.date}</div>
          <div class="status-badge ${statusClass}">${data.status.toUpperCase()}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payout Receipt</div>
      </div>

      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">Amount Sent</span>
          <span class="amount-value">${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${data.currency}</span>
        </div>
        ${data.exchangeRate ? `<div class="rate-text">Exchange Rate: ${data.exchangeRate}</div>` : ''}
        ${data.fees && data.fees > 0 ? `<div class="rate-text">Fees: $${data.fees.toFixed(2)}</div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Sender Details</div>
        <div class="row">
          <span class="label">Name</span>
          <span class="value">${data.clientName}</span>
        </div>
        ${
          data.clientEmail
            ? `
          <div class="row">
            <span class="label">Email</span>
            <span class="value">${data.clientEmail}</span>
          </div>
        `
            : ''
        }
      </div>

      <div class="section">
        <div class="section-title">Recipient Details</div>
        <div class="row">
          <span class="label">Name</span>
          <span class="value">${data.recipientName}</span>
        </div>
        <div class="row">
          <span class="label">Bank</span>
          <span class="value">${data.recipientBank}</span>
        </div>
        <div class="row">
          <span class="label">Account Number</span>
          <span class="value">${maskedAccount}</span>
        </div>
        ${
          data.recipientCountry
            ? `
          <div class="row">
            <span class="label">Country</span>
            <span class="value">${data.recipientCountry}</span>
          </div>
        `
            : ''
        }
      </div>

      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="row">
          <span class="label">Reference Number</span>
          <span class="value">${data.referenceNumber}</span>
        </div>
        <div class="row">
          <span class="label">Date</span>
          <span class="value">${data.date}</span>
        </div>
        <div class="row">
          <span class="label">Status</span>
          <span class="value">${data.status}</span>
        </div>
      </div>

      <div class="footer">
        <div class="footer-text">This is an electronically generated receipt and does not require a signature.</div>
        <div class="footer-text">Funds are typically received within 1-3 business days depending on the destination.</div>
        <div class="footer-company">iTransfr Inc. | support@itransfr.com | www.itransfr.com</div>
      </div>
    </body>
    </html>
  `;
}
