import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-2 px-4 py-2">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-800 text-base shadow-sm">
      ☕
    </div>
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-white px-4 py-3 shadow-sm border border-amber-100">
      <span
        className="h-2 w-2 rounded-full bg-amber-400"
        style={{ animation: 'chatbot-bounce 1.2s infinite', animationDelay: '0ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-amber-400"
        style={{ animation: 'chatbot-bounce 1.2s infinite', animationDelay: '200ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-amber-400"
        style={{ animation: 'chatbot-bounce 1.2s infinite', animationDelay: '400ms' }}
      />
    </div>
  </div>
);
