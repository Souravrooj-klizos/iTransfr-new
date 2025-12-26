import { cn } from '@/lib/utils';
import { Building2, Shield, User } from 'lucide-react';

interface Step1Props {
  selectedType?: string;
  onSelect?: (type: string) => void;
}

export function Step1AccountType({ selectedType, onSelect }: Step1Props) {
  // Default to 'business' for visualization if none provided, or just null
  const current = selectedType || 'business';

  const options = [
    {
      id: 'personal',
      title: 'Personal Account',
      description: 'Individual client requiring USD virtual account',
      icon: User,
    },
    {
      id: 'business',
      title: 'Business Account',
      description: 'Importers, Exporters, Agencies and General Commerce',
      icon: Building2,
    },
    {
      id: 'fintech',
      title: 'Fintech / EDD',
      description: 'MSBs, Payment Processors and Crypto Entities',
      icon: Shield,
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      {options.map(option => {
        const isSelected = current === option.id;
        const Icon = option.icon;

        return (
          <div
            key={option.id}
            onClick={() => onSelect?.(option.id)}
            className={cn(
              'cursor-pointer rounded-xl border p-6 transition-all hover:border-blue-300',
              isSelected
                ? 'border-blue-500 bg-blue-50/50 border-2 transition-all'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            )}
          >
            <div
              className={cn(
                'mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg',
                isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              )}
            >
              <Icon className='h-5 w-5' />
            </div>
            <h3 className='mb-2 font-medium text-gray-900'>{option.title}</h3>
            <p className='text-xs leading-relaxed text-gray-500'>{option.description}</p>
          </div>
        );
      })}
    </div>
  );
}
