import React from 'react';

interface TypingIndicatorProps {
  language?: string;
}

const CHATBOT_LOGO = '/images/logo-s.webp';

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ language }) => {
  const isAr = language === 'ar';

  return (
    <div
      className="flex items-start gap-2.5 px-4 py-1"
      dir={isAr ? 'rtl' : 'ltr'}
      role="status"
      aria-label={isAr ? 'المساعد يكتب' : 'Assistant is typing'}
    >
      <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white p-1 ring-1 ring-stone-200/80">
        <img src={CHATBOT_LOGO} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-full object-contain" />
      </div>
      <div className="flex h-10 items-center gap-1 rounded-[20px] rounded-ss-md bg-white px-4 ring-1 ring-stone-200/70">
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-[#c69c6d] motion-safe:animate-[chatbot-bounce_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
