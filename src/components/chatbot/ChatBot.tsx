import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Minimize2 } from 'lucide-react';
import { useRegion } from '../../hooks/useRegion';
import { useApp } from '../../hooks/useApp';
import { GeminiChatSession, type ChatMessage } from '../../services/geminiChatService';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

const session = new GeminiChatSession();

const QUICK_SUGGESTIONS = {
  ar: ['الأكثر مبيعاً', 'قهوة للضيافة', 'وصل جديد', 'هدايا مميزة'],
  en: ['Best sellers', 'Coffee for guests', 'New arrivals', 'Gift ideas'],
};

const WELCOME_MESSAGES = {
  ar: 'أهلاً! كيف أقدر أساعدك في اختيار القهوة المناسبة؟ ☕',
  en: 'Hello! How can I help you find the perfect coffee? ☕',
};

export const ChatBot: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isAr = language === 'ar';
  const regionPrefix = currentRegion.code === 'om' ? '/om' : currentRegion.code === 'sa' ? '/sa' : '';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: isAr ? WELCOME_MESSAGES.ar : WELCOME_MESSAGES.en, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) inputRef.current?.focus();
  }, [isOpen, isMinimized]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: messageText, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const { text: responseText, products } = await session.sendMessage(messageText);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: responseText, products: products.length > 0 ? products : undefined, timestamp: new Date() },
      ]);
    } catch (err) {
      const isKeyError = String(err).includes('GEMINI_API_KEY_NOT_SET');
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: isKeyError
            ? isAr ? 'يرجى إضافة مفتاح Gemini API في ملف .env.' : 'Please add your Gemini API key in .env.'
            : isAr ? 'عذراً، حدث خطأ. حاول مجدداً.' : 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isAr]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = useCallback(() => {
    session.reset();
    setMessages([{ role: 'model', text: isAr ? WELCOME_MESSAGES.ar : WELCOME_MESSAGES.en, timestamp: new Date() }]);
  }, [isAr]);

  const suggestions = useMemo(() => (isAr ? QUICK_SUGGESTIONS.ar : QUICK_SUGGESTIONS.en), [isAr]);
  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="fixed bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl md:bottom-8"
            style={{
              [isAr ? 'left' : 'right']: '1.25rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)',
            }}
            aria-label={isAr ? 'فتح المساعد' : 'Open Assistant'}
          >
            <span className="relative z-10 text-2xl">☕</span>
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)',
                animation: 'chatbot-pulse 2.5s ease-out infinite',
                opacity: 0.35,
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{
              bottom: '5.5rem',
              [isAr ? 'left' : 'right']: '1.25rem',
              width: 'min(370px, calc(100vw - 2rem))',
              height: isMinimized ? 56 : 'min(560px, calc(100dvh - 7rem))',
              border: '1px solid rgba(245,158,11,0.15)',
              transition: 'height 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Header */}
            <div
              className="flex flex-shrink-0 items-center justify-between px-4 py-3"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #92400e 60%, #451a03 100%)' }}
            >
              <div className={`flex items-center gap-2.5 ${isAr ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">
                  ☕
                </div>
                <div className={isAr ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {isAr ? 'مساعد SpiritHub' : 'SpiritHub Guide'}
                  </p>
                  <div className={`flex items-center gap-1 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-xs text-white/70">{isAr ? 'متاح' : 'Online'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleReset}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                  title={isAr ? 'محادثة جديدة' : 'New chat'}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsMinimized((m) => !m)}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                  title={isAr ? 'تصغير' : 'Minimize'}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                  title={isAr ? 'إغلاق' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto overscroll-contain py-3"
                  style={{ background: '#faf9f7', minHeight: 0 }}
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  {messages.map((message, index) => (
                    <ChatMessageComponent
                      key={index}
                      message={message}
                      regionPrefix={regionPrefix}
                      language={language}
                    />
                  ))}

                  {isLoading && <TypingIndicator />}

                  {showSuggestions && (
                    <div className="px-4 pt-3" dir={isAr ? 'rtl' : 'ltr'}>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-50"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div
                  className="flex flex-shrink-0 items-end gap-2 border-t border-amber-100 bg-white p-3"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAr ? 'اكتب رسالتك...' : 'Type your message...'}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-amber-400 focus:bg-white disabled:opacity-50"
                    style={{ maxHeight: 96, lineHeight: '1.5' }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: input.trim() && !isLoading
                        ? 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)'
                        : '#d1d5db',
                    }}
                  >
                    <Send className="h-4 w-4" style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
