import { ToastProvider } from '@/components/ui/Toast';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'iTransfr - Secure International Money Transfers & Crypto Remittance',
    template: '%s | iTransfr',
  },
  description:
    'Send money internationally with iTransfr. Secure cryptocurrency remittance platform with instant deposits, competitive exchange rates, and fast bank payouts to India, Mexico, and 50+ countries. KYC verified, AML compliant.',
  keywords: [
    'international money transfer',
    'crypto remittance',
    'send money abroad',
    'cryptocurrency transfer',
    'USDT transfer',
    'stablecoin remittance',
    'cross-border payments',
    'money transfer to India',
    'money transfer to Mexico',
    'forex exchange',
    'currency conversion',
    'digital wallet',
    'secure money transfer',
    'KYC verified transfers',
    'AML compliant remittance',
    'instant crypto deposits',
    'bank payout',
    'international remittance',
    'global money transfer',
    'low fee transfers',
  ],
  authors: [{ name: 'iTransfr' }],
  creator: 'iTransfr',
  publisher: 'iTransfr',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://itransfr.com'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'iTransfr',
    title: 'iTransfr - Secure International Money Transfers & Crypto Remittance',
    description:
      'Send money internationally with ease. Deposit crypto, exchange currencies at competitive rates, and send fast bank payouts to 50+ countries. KYC verified and AML compliant.',
    images: [
      {
        url: '/logo_dark.svg',
        width: 1200,
        height: 630,
        alt: 'iTransfr - International Money Transfer Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iTransfr - Secure International Money Transfers',
    description:
      'Send money globally with crypto deposits, competitive FX rates, and fast bank payouts. Secure, compliant, and transparent.',
    images: ['/logo_dark.svg'],
    creator: '@itransfr',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo_dark.svg',
    shortcut: '/logo_dark.svg',
    apple: '/logo_dark.svg',
  },
  manifest: '/manifest.json',
  category: 'finance',
  verification: {
    // Add your verification tokens when available
    // google: 'your-google-verification-token',
    // yandex: 'your-yandex-verification-token',
    // bing: 'your-bing-verification-token',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
