import { Info } from 'lucide-react';

interface InfoBannerProps {
  message: string;
  variant?: 'info' | 'warning' | 'error';
}

export function InfoBanner({ message, variant = 'warning' }: InfoBannerProps) {
  const colors = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-800',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: 'text-orange-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800',
    },
  };

  const style = colors[variant];

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4`}>
      <div className='flex items-start gap-3'>
        <Info className={`h-5 w-5 ${style.icon} mt-0.5 shrink-0`} />
        <p className={`text-sm ${style.text}`}>{message}</p>
      </div>
    </div>
  );
}
