import React from 'react';
import { ProductCard } from './ProductCard';
import type { ChatMessage as ChatMessageType } from '../../services/geminiChatService';

interface ChatMessageProps {
  message: ChatMessageType;
  regionPrefix: string;
  language: string;
}

function renderMarkdownText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      elements.push(<br key={i} />);
      return;
    }

    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
          <span>{rendered.map((r) => (typeof r === 'string' ? r.replace(/^[-•]\s/, '') : r))}</span>
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

  if (isUser) {
    return (
      <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 px-4 py-1`}>
        <div
          className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)',
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
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-800 text-base shadow-sm">
          ☕
        </div>

        <div className="flex max-w-[85%] flex-col gap-2">
          {/* Text bubble */}
          <div
            className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm"
            style={{ borderRadius: isAr ? '0 1rem 1rem 1rem' : '1rem 1rem 1rem 0' }}
          >
            {renderMarkdownText(message.text)}
          </div>

          {/* Product cards */}
          {message.products && message.products.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {message.products.map((product) => (
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
