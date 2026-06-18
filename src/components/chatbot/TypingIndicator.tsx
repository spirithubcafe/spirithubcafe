import React from 'react';

interface TypingIndicatorProps {
  language?: string;
}

const CHATBOT_LOGO = '/images/logo-s.png';

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ language }) => {
  const isAr = language === 'ar';

  return (
    <div className={`flex items-start gap-2 px-4 py-2 ${isAr ? 'flex-row-reverse' : ''}`}>
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ring-1 ring-[#f2ddd8]">
        <img src={CHATBOT_LOGO} alt="SpiritHub Roastery" className="h-full w-full rounded-full object-contain" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl border border-[#f2ddd8] bg-white px-4 py-3 shadow-sm">
        <span
          className="h-2 w-2 rounded-full bg-[#df6d64]"
          style={{ animation: 'chatbot-bounce 1.2s infinite', animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[#df6d64]"
          style={{ animation: 'chatbot-bounce 1.2s infinite', animationDelay: '200ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[#df6d64]"
          style={{ animation: 'chatbot-bounce 1.2s infinite', animationDelay: '400ms' }}
        />
      </div>
    </div>
  );
};
