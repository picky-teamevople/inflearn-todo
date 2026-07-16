'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompleteToggleProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label': string;
}

export function CompleteToggle({
  id,
  checked,
  onCheckedChange,
  disabled,
  ...props
}: CompleteToggleProps) {
  return (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      disabled={disabled}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 text-transparent outline-none transition-colors hover:border-neutral-400 focus-visible:ring-4 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50',
        'data-checked:border-neutral-900 data-checked:bg-neutral-900 data-checked:text-white data-checked:animate-[pop_0.3s_ease-out]'
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
