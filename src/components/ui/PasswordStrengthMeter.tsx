'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  strength: 0 | 1 | 2 | 3 | 4; // 0: Empty, 1: Weak, 2: Fair, 3: Good, 4: Strong
}

export function PasswordStrengthMeter({ strength }: PasswordStrengthMeterProps) {
  return (
    <div className='mt-2 flex gap-1'>
      {[1, 2, 3, 4].map(level => (
        <div
          key={level}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            strength >= level
              ? strength <= 2
                ? 'bg-red-500' // Weak/Fair
                : strength === 3
                  ? 'bg-yellow-500' // Good
                  : 'bg-green-500' // Strong
              : 'bg-gray-200' // Empty
          )}
        />
      ))}
    </div>
  );
}
