/**
 * Email Service
 *
 * Centralized email service for iTransfr platform.
 * Uses the exact HTML templates from public/iTransfr_Email_Template/
 * with dynamic variable substitution.
 * Uses AWS SES for email delivery (same as OTP emails).
 */

import { sendEmail as sendSESEmail } from '@/lib/aws-ses';
import fs from 'fs';
import path from 'path';

// =====================================================
// TYPES
// =====================================================

export type EmailTemplateType =
  | 'otp_verification'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'kyc_submitted'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'login_detected';

export interface EmailOptions {
  to: string;
  subject?: string;
  template: EmailTemplateType;
  data: Record<string, string | number | undefined>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =====================================================
// TEMPLATE FILE MAPPING
// =====================================================

const TEMPLATE_FILES: Record<EmailTemplateType, { filename: string; subject: string }> = {
  otp_verification: {
    filename: 'otp-email.html',
    subject: 'Your Verification Code - iTransfr',
  },
  kyc_approved: {
    filename: 'kyc-approved-email.html',
    subject: 'KYC Approved - Welcome to iTransfr!',
  },
  kyc_rejected: {
    filename: 'kyc-rejection-email.html',
    subject: 'KYC Verification Update - iTransfr',
  },
  kyc_submitted: {
    filename: 'kyc-submission-email.html',
    subject: 'KYC Documents Received - iTransfr',
  },
  password_reset_request: {
    filename: 'password-reset-request-email.html',
    subject: 'Password Reset Request - iTransfr',
  },
  password_reset_success: {
    filename: 'password-reset-successful-email.html',
    subject: 'Password Changed Successfully - iTransfr',
  },
  login_detected: {
    filename: 'login-detected-email.html',
    subject: 'New Login Detected - iTransfr',
  },
};

// =====================================================
// BASE64 ENCODED LOGOS (for reliable email display)
// =====================================================

// Logo SVG as data URL (dark background with white "i" mark)
const LOGO_DARK_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(
  `<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="38.9848" height="38.9848" rx="6.49746" fill="#171717"/>
<rect x="25.0059" y="12.2108" width="18.6917" height="5.40482" transform="rotate(90 25.0059 12.2108)" fill="white"/>
<path d="M12.9333 14.3126L7.76562 19.5746V30.9024H12.9333V14.3126Z" fill="white"/>
<path d="M7.82812 8.08215H32.6453V13.502H12.9627L10.3003 10.6494L7.82812 8.08215Z" fill="white"/>
<path d="M12.9333 8.08221H7.76562L12.9333 13.487V8.08221Z" fill="#2462EB"/>
</svg>`
).toString('base64')}`;

// "iTransfr" text logo as data URL
const VECTOR_LOGO_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(
  `<svg width="109" height="23" viewBox="0 0 109 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.01388 0.0935854L84.4203 0.0935855V3.86817H16.3931V22.3044H11.9891V3.86817H6.01388V0.0935854Z" fill="#212121"/>
<path d="M32.7969 5.95823C33.1639 5.95823 33.4985 5.97903 33.8007 6.02062V9.63924H32.7645C31.2102 9.63924 30.012 10.024 29.1701 10.7934C28.3497 11.5421 27.9396 12.6547 27.9396 14.1313V22.3044H23.8594V6.20779H27.81V9.07773C28.7383 6.99806 30.4006 5.95823 32.7969 5.95823Z" fill="#212121"/>
<path d="M50.0477 22.3044H45.9675C45.7733 21.9716 45.6221 21.3165 45.5142 20.3391C44.3916 21.8989 42.5998 22.6787 40.1388 22.6787C38.3038 22.6787 36.8358 22.2524 35.7348 21.3997C34.6554 20.5471 34.1157 19.3617 34.1157 17.8435C34.1157 14.9112 36.2529 13.2371 40.5274 12.8211L43.0532 12.6028C43.8951 12.4988 44.4996 12.3116 44.8666 12.0412C45.2336 11.7501 45.417 11.3238 45.417 10.7623C45.417 10.076 45.1796 9.57685 44.7046 9.2649C44.2513 8.93215 43.4741 8.76578 42.3731 8.76578C41.1858 8.76578 40.3331 8.96335 39.8149 9.35848C39.2968 9.73282 38.9946 10.3879 38.9082 11.3238H34.8929C35.1303 7.66356 37.6345 5.83345 42.4055 5.83345C47.047 5.83345 49.3677 7.44519 49.3677 10.6687V19.2473C49.3677 20.6614 49.5943 21.6805 50.0477 22.3044ZM41.1102 19.8712C42.3839 19.8712 43.4202 19.5384 44.2189 18.8729C45.0177 18.1866 45.417 17.2092 45.417 15.9406V14.4745C45.0285 14.8072 44.3916 15.0256 43.5065 15.1295L41.3045 15.3791C40.2251 15.5039 39.4479 15.7534 38.973 16.1278C38.5197 16.4813 38.293 17.0012 38.293 17.6875C38.293 18.3738 38.5305 18.9145 39.0054 19.3097C39.5019 19.684 40.2035 19.8712 41.1102 19.8712Z" fill="#212121"/>
<path d="M61.6425 5.83345C63.4559 5.83345 64.8807 6.34297 65.917 7.36201C66.9748 8.36024 67.5037 9.78481 67.5037 11.6357V22.3044H63.4235V12.2908C63.4235 10.2527 62.3765 9.2337 60.2825 9.2337C59.2462 9.2337 58.3611 9.59764 57.6271 10.3255C56.9147 11.0326 56.5585 12.0204 56.5585 13.289V22.3044H52.4784V6.20779H56.429V8.51622C57.7027 6.72771 59.4405 5.83345 61.6425 5.83345Z" fill="#212121"/>
<path d="M77.3934 22.7411C72.5145 22.7411 69.9671 20.8902 69.7512 17.1884H73.7342C73.8421 18.1866 74.1768 18.8937 74.7381 19.3097C75.3209 19.7256 76.2276 19.9336 77.4581 19.9336C79.6601 19.9336 80.7611 19.2889 80.7611 17.9995C80.7611 17.4172 80.5237 16.97 80.0487 16.6581C79.5738 16.3461 78.7211 16.0862 77.4905 15.8782L75.58 15.5663C71.9316 14.984 70.1074 13.3618 70.1074 10.6999C70.1074 9.18171 70.7119 7.9963 71.9208 7.14364C73.1297 6.27018 74.8352 5.83345 77.0372 5.83345C81.8081 5.83345 84.2692 7.65316 84.4203 11.2926H80.5668C80.5237 10.3359 80.2106 9.66003 79.6278 9.2649C79.0449 8.84897 78.1813 8.641 77.0372 8.641C75.0943 8.641 74.1228 9.2649 74.1228 10.5127C74.1228 11.0534 74.3387 11.4797 74.7704 11.7917C75.2022 12.0828 75.9146 12.3116 76.9077 12.478L79.0125 12.7899C81.0418 13.1435 82.5098 13.705 83.4165 14.4745C84.3447 15.2439 84.8089 16.315 84.8089 17.6875C84.8089 19.3097 84.1613 20.5575 82.866 21.4309C81.5707 22.3044 79.7465 22.7411 77.3934 22.7411Z" fill="#212121"/>
<path d="M95.9167 3.1195H94.4919C93.0887 3.1195 92.3871 3.76419 92.3871 5.05358V6.20779H95.8196V9.20251H92.3871V22.3044H88.3393V9.20251H85.7487V6.20779H88.3393V4.99119C88.3393 3.43144 88.7927 2.21484 89.6993 1.34138C90.606 0.447127 91.9769 0 93.8119 0C94.6322 0 95.3338 0.0311951 95.9167 0.0935854V3.1195Z" fill="#212121"/>
<path d="M107.016 5.95823C107.383 5.95823 107.718 5.97903 108.02 6.02062V9.63924H106.984C105.43 9.63924 104.232 10.024 103.39 10.7934C102.569 11.5421 102.159 12.6547 102.159 14.1313V22.3044H98.079V6.20779H102.03V9.07773C102.958 6.99806 104.62 5.95823 107.016 5.95823Z" fill="#2462EB"/>
<path d="M4.22376 22.3044H9.01394e-05L0 8.0511L1.94325 6.56993L4.22376 4.72586V22.3044Z" fill="#212121"/>
<path d="M2.18741 1.94898L4.22376 3.87023V0.0935989H0L2.18741 1.94898Z" fill="#2462EB"/>
</svg>`
).toString('base64')}`;

// =====================================================
// TEMPLATE CACHE (for performance)
// =====================================================

const templateCache: Record<string, string> = {};

/**
 * Load template from file or cache
 */
function loadTemplate(templateType: EmailTemplateType): string {
  const templateConfig = TEMPLATE_FILES[templateType];
  if (!templateConfig) {
    throw new Error(`Unknown email template: ${templateType}`);
  }

  // Check cache first
  if (templateCache[templateType]) {
    return templateCache[templateType];
  }

  // Load from file
  const templatePath = path.join(
    process.cwd(),
    'public',
    'iTransfr_Email_Template',
    templateConfig.filename
  );

  try {
    let template = fs.readFileSync(templatePath, 'utf-8');

    // Replace logo image URLs with embedded base64 data URLs
    // This ensures logos always display regardless of hosting
    template = template.replace(
      /https:\/\/i-transfr\.vercel\.app\/logo_dark\.svg/g,
      LOGO_DARK_DATA_URL
    );
    template = template.replace(
      /https:\/\/i-transfr\.vercel\.app\/vector\.svg/g,
      VECTOR_LOGO_DATA_URL
    );

    templateCache[templateType] = template;
    return template;
  } catch (error) {
    console.error(`[Email Service] Failed to load template: ${templatePath}`, error);
    throw new Error(`Failed to load email template: ${templateType}`);
  }
}

/**
 * Replace template variables with actual values
 * Supports both {{variable}} and {{ variable }} formats
 */
function replaceVariables(template: string, data: Record<string, any>): string {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    // Handle various placeholder formats:
    // {{variable}}, {{ variable }}, {{Variable}}, etc.
    const patterns = [
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'),
      new RegExp(`\\{\\{\\s*${key.toLowerCase()}\\s*\\}\\}`, 'gi'),
      new RegExp(`\\{\\{\\s*${key.replace(/_/g, ' ')}\\s*\\}\\}`, 'gi'),
    ];

    for (const pattern of patterns) {
      result = result.replace(pattern, String(value || ''));
    }
  }

  return result;
}

// =====================================================
// EMAIL SERVICE FUNCTIONS
// =====================================================

/**
 * Generate HTML email from template file
 */
export function generateEmailHTML(template: EmailTemplateType, data: Record<string, any>): string {
  const templateHtml = loadTemplate(template);
  return replaceVariables(templateHtml, data);
}

/**
 * Get email subject for template
 */
export function getEmailSubject(template: EmailTemplateType): string {
  const templateConfig = TEMPLATE_FILES[template];
  if (!templateConfig) {
    throw new Error(`Unknown email template: ${template}`);
  }
  return templateConfig.subject;
}

/**
 * Send email using AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const { to, subject, template, data } = options;

  try {
    const html = generateEmailHTML(template, data);
    const emailSubject = subject || getEmailSubject(template);

    // Send via AWS SES (same service used for OTP emails)
    const result = await sendSESEmail(to, emailSubject, html);

    console.log('[Email Service] Email sent successfully via SES:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('[Email Service] Error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(to: string, otpCode: string): Promise<SendEmailResult> {
  // The OTP template uses the static "85496" - we need to replace it
  // Load template, replace OTP code dynamically
  const templateConfig = TEMPLATE_FILES['otp_verification'];
  const templatePath = path.join(
    process.cwd(),
    'public',
    'iTransfr_Email_Template',
    templateConfig.filename
  );

  try {
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Replace the static OTP code with the actual one
    html = html.replace(/85496/g, otpCode);

    // Replace logo URLs with embedded base64 data URLs for reliable display
    html = html.replace(/https:\/\/i-transfr\.vercel\.app\/logo_dark\.svg/g, LOGO_DARK_DATA_URL);
    html = html.replace(/https:\/\/i-transfr\.vercel\.app\/vector\.svg/g, VECTOR_LOGO_DATA_URL);

    const result = await sendSESEmail(to, templateConfig.subject, html);
    console.log('[Email Service] OTP email sent via SES:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('[Email Service] OTP email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send KYC approved email
 */
export async function sendKYCApprovedEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: 'kyc_approved',
    data: {
      first_name: firstName,
      login_link: process.env.NEXT_PUBLIC_APP_URL || 'https://itransfr.com/login',
    },
  });
}

/**
 * Send KYC rejected email
 */
export async function sendKYCRejectedEmail(
  to: string,
  firstName: string,
  missingDocuments?: string[]
): Promise<SendEmailResult> {
  const data: Record<string, any> = {
    first_name: firstName,
    interview_link: process.env.NEXT_PUBLIC_APP_URL + '/kyc' || 'https://itransfr.com/kyc',
  };

  // Handle missing documents placeholders
  if (missingDocuments && missingDocuments.length > 0) {
    missingDocuments.forEach((doc, index) => {
      data[`Missing_Document_${index + 1}`] = doc;
    });
  }

  return sendEmail({
    to,
    template: 'kyc_rejected',
    data,
  });
}

/**
 * Send KYC submitted email
 */
export async function sendKYCSubmittedEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: 'kyc_submitted',
    data: { first_name: firstName },
  });
}

/**
 * Send password reset request email
 */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: 'password_reset_request',
    data: {
      first_name: firstName,
      'reset_password _link': resetUrl, // Note: template has space in variable name
      reset_password_link: resetUrl,
    },
  });
}

/**
 * Send password reset success email
 */
export async function sendPasswordResetSuccessEmail(
  to: string,
  firstName: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: 'password_reset_success',
    data: {
      first_name: firstName,
      login_link: process.env.NEXT_PUBLIC_APP_URL || 'https://itransfr.com/login',
    },
  });
}

/**
 * Send login detected email
 */
export async function sendLoginDetectedEmail(
  to: string,
  firstName: string,
  loginDetails: {
    time?: string;
    device?: string;
    location?: string;
    ip?: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: 'login_detected',
    data: {
      first_name: firstName,
      login_time: loginDetails.time || new Date().toLocaleString(),
      device: loginDetails.device || 'Unknown Device',
      location: loginDetails.location || 'Unknown Location',
      ip_address: loginDetails.ip || 'Unknown',
    },
  });
}
