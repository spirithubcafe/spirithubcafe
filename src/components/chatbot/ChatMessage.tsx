import React from 'react';
import { ProductCard } from './ProductCard';
import type { ChatMessage as ChatMessageType } from '../../services/geminiChatService';

interface ChatMessageProps {
  message: ChatMessageType;
  regionPrefix: string;
  language: string;
}

const CHATBOT_LOGO = '/images/logo-s.png';

function renderInlineMarkdown(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function getDisplayText(text: string, hasProducts: boolean, isAr: boolean): string {
  if (!hasProducts) return text;

  const keptLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^[-*•]\s+/.test(line))
    .filter((line) => !/\b(from|to)\b.*(?:OMR|ر\.ع|\$)|(?:OMR|ر\.ع|\$).*\d/i.test(line));

  return keptLines.join('\n').trim() || (isAr
    ? '\u0625\u0644\u064a\u0643 \u0628\u0639\u0636 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:'
    : 'Here are some products I found:');
}

function renderMarkdownText(text: string, isAr: boolean): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<span key={i} className="block h-1" />);
      return;
    }

    const bulletText = trimmed.replace(/^[-*•]\s+/, '');
    const rendered = renderInlineMarkdown(bulletText);

    if (/^[-*•]\s+/.test(trimmed)) {
      elements.push(
        <div key={i} className={`flex gap-2 py-0.5 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#df6d64]" />
          <span>{rendered}</span>
        </div>
      );
    } else {
      elements.push(<span key={i}>{rendered}</span>);
      if (i < lines.length - 1) elements.push(<br key={`br-${i}`} />);
    }
  });

  return <>{elements}</>;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, regionPrefix, language }) => {
  const isUser = message.role === 'user';
  const isAr = language === 'ar';
  const hasProducts = !!message.products?.length;
  const displayText = getDisplayText(message.text, hasProducts, isAr);

  if (isUser) {
    return (
      <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 px-4 py-1`}>
        <div
          className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #f08a7f 0%, #df6d64 55%, #c75049 100%)',
            color: 'white',
            borderRadius: isAr ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-1">
      <div className={`flex items-start gap-2 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ring-1 ring-[#f2ddd8]">
          <img src={CHATBOT_LOGO} alt="SpiritHub Roastery" className="h-full w-full rounded-full object-contain" />
        </div>

        <div className="flex max-w-[calc(100%-2.5rem)] flex-1 flex-col gap-2">
          {/* Text bubble */}
          <div
            className={`rounded-2xl border border-[#f2ddd8] bg-white px-3.5 py-2.5 text-sm leading-normal text-stone-800 shadow-sm shadow-rose-950/5 ${isAr ? 'text-right' : ''}`}
            style={{ borderRadius: isAr ? '0 1rem 1rem 1rem' : '1rem 1rem 1rem 0' }}
          >
            {renderMarkdownText(displayText, isAr)}
          </div>

          {/* Product cards */}
          {hasProducts && (
            <div className="mt-1 flex flex-col gap-2.5">
              {message.products?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  regionPrefix={regionPrefix}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
