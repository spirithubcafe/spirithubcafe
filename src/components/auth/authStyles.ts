// Shared look for the sign-in / sign-up surfaces (AuthModal, the forms, and
// the login/register pages that reuse them). Coffee accents match the mobile
// bottom nav and drawer; text is 16px so iOS does not zoom into a field.

export const AUTH_FOCUS = 'outline-none focus-visible:ring-4 focus-visible:ring-[#c69c6d]/25';

export const authFieldClass =
  'h-12 w-full rounded-xl border border-stone-200 bg-stone-50/70 px-4 text-base text-stone-900 shadow-none placeholder:text-stone-400 transition-[border-color,background-color,box-shadow] duration-200 hover:border-stone-300 focus-visible:border-[#c69c6d] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#c69c6d]/20 disabled:opacity-60 md:text-base aria-invalid:border-red-400 aria-invalid:ring-red-500/15';

export const authLabelClass = 'block text-[13px] font-medium text-stone-700';

export const authPrimaryButtonClass = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 text-[15px] font-semibold text-white transition-[background-color,transform,opacity] duration-200 hover:bg-stone-800 active:scale-[0.99] disabled:pointer-events-none disabled:bg-stone-200 disabled:text-stone-400 motion-reduce:active:scale-100 ${AUTH_FOCUS}`;

export const authLinkClass =
  'rounded-sm text-[13px] font-medium text-[#8b6f47] underline-offset-4 transition-colors hover:text-[#6f5639] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69c6d]/50';

export const authErrorTextClass = 'text-[13px] text-red-600';
