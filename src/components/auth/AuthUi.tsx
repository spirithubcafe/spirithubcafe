import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { AUTH_FOCUS, authFieldClass } from './authStyles';

type SegmentedOption<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };

/**
 * Two-way switch with a pill that glides to the selected side (same spring as
 * the bottom nav's highlight). Transform only, so nothing around it moves.
 */
export function AuthSegmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: {
  value: T;
  options: [SegmentedOption<T>, SegmentedOption<T>];
  onChange: (value: T) => void;
  label: string;
  size?: 'md' | 'sm';
}) {
  const index = options.findIndex((option) => option.value === value);
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('relative grid grid-cols-2 rounded-full bg-stone-100 p-1', size === 'md' ? 'h-12' : 'h-10')}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-[0_1px_2px_rgba(28,25,23,0.08),0_2px_8px_-2px_rgba(28,25,23,0.12)] ring-1 ring-stone-900/[0.04] transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] motion-reduce:transition-none',
          index === 1 && 'ltr:translate-x-full rtl:-translate-x-full',
        )}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200',
              size === 'md' ? 'text-[14px]' : 'text-[13px]',
              selected ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800',
              AUTH_FOCUS,
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-wider text-stone-400">
      <span className="h-px flex-1 bg-stone-200" />
      {children}
      <span className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-[13px] leading-5 text-red-700 ring-1 ring-red-200/70">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  showLabel: string;
  hideLabel: string;
};

/** Password field with a show/hide toggle on its end side (flips in RTL). */
export function PasswordInput({ className, showLabel, hideLabel, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn(authFieldClass, 'pe-12', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className={cn(
          'absolute end-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:pointer-events-none',
          AUTH_FOCUS,
        )}
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
