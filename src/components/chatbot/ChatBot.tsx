import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Minimize2, Truck, Leaf, BadgeCheck, Headphones } from 'lucide-react';
import { useRegion } from '../../hooks/useRegion';
import { useApp } from '../../hooks/useApp';
import { GeminiChatSession, getFallbackChatResponse, type ChatMessage } from '../../services/geminiChatService';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

const session = new GeminiChatSession();
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const CHATBOT_LOGO = '/images/logo-s.png';

const QUICK_SUGGESTIONS = {
  ar: [
    '\u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u0628\u064a\u0639\u0627',
    '\u0648\u0635\u0644 \u062c\u062f\u064a\u062f',
    '\u0647\u062f\u0627\u064a\u0627 \u0645\u0645\u064a\u0632\u0629',
    '\u0628\u0627\u0642\u0627\u062a \u0648\u0635\u0646\u0627\u062f\u064a\u0642 \u0647\u062f\u0627\u064a\u0627',
  ],
  en: ['Best sellers', 'New arrivals', 'Gift ideas', 'Bundles & Boxes'],
};

const WELCOME_MESSAGES = {
  ar: '\u0645\u0631\u062d\u0628\u0627\u064b \u2615\ufe0f\n\n\u0647\u0644 \u062a\u0628\u062d\u062b \u0639\u0646 \u0642\u0647\u0648\u0629 \u0644\u0644\u0625\u0633\u0628\u0631\u064a\u0633\u0648\u060c \u0627\u0644\u0641\u0644\u062a\u0631\u060c \u0627\u0644\u0643\u0628\u0633\u0648\u0644\u0627\u062a \u0623\u0648 \u0627\u0644\u0647\u062f\u0627\u064a\u0627\u061f',
  en: 'Hello! How can I help you find the perfect coffee?',
};

const CHATBOT_TEXT = {
  busy: {
    ar: '\u0627\u0644\u0645\u0633\u0627\u0639\u062f \u0645\u0634\u063a\u0648\u0644 \u062d\u0627\u0644\u064a\u0627. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0628\u0639\u062f \u0642\u0644\u064a\u0644.',
    en: 'The assistant is busy right now. Please try again in a moment.',
  },
  keyMissing: {
    ar: '\u064a\u0631\u062c\u0649 \u0625\u0636\u0627\u0641\u0629 \u0645\u0641\u062a\u0627\u062d Gemini API \u0641\u064a \u0645\u0644\u0641 .env.',
    en: 'Please add your Gemini API key in .env.',
  },
  genericError: {
    ar: '\u0639\u0630\u0631\u0627\u060c \u062d\u062f\u062b \u062e\u0637\u0623. \u062d\u0627\u0648\u0644 \u0645\u062c\u062f\u062f\u0627.',
    en: 'Sorry, something went wrong. Please try again.',
  },
  placeholder: {
    ar: '\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u062a\u0643...',
    en: 'Type your message...',
  },
};

const TRUST_ITEMS = [
  {
    icon: Truck,
    arTitle: '\u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639',
    arSubtitle: '\u0641\u064a \u062c\u0645\u064a\u0639 \u0623\u0646\u062d\u0627\u0621 \u0639\u0645\u0627\u0646',
    enTitle: 'Fast delivery',
    enSubtitle: 'Across Oman',
  },
  {
    icon: Leaf,
    arTitle: '\u0642\u0647\u0648\u0629 \u0645\u062e\u062a\u0635\u0629',
    arSubtitle: '100% \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u062c\u0648\u062f\u0629',
    enTitle: 'Specialty coffee',
    enSubtitle: '100% quality',
  },
  {
    icon: BadgeCheck,
    arTitle: '\u0636\u0645\u0627\u0646 \u0627\u0644\u062c\u0648\u062f\u0629',
    arSubtitle: '\u0623\u0648 \u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0643\u0627\u0645\u0644',
    enTitle: 'Quality guarantee',
    enSubtitle: 'Or full refund',
  },
  {
    icon: Headphones,
    arTitle: '\u062f\u0639\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621',
    arSubtitle: '\u0645\u062a\u0648\u0641\u0631 \u062f\u0627\u0626\u0645\u0627',
    enTitle: 'Customer support',
    enSubtitle: 'Always available',
  },
];

export const ChatBot: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isAr = language === 'ar';
  const regionPrefix = currentRegion.code === 'om' ? '/om' : currentRegion.code === 'sa' ? '/sa' : '';
  const assistantTitle = isAr
    ? '\u0645\u0633\u0627\u0639\u062f\u0643 \u0627\u0644\u0630\u0643\u064a'
    : 'SPIRIHUB AI';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: isAr ? WELCOME_MESSAGES.ar : WELCOME_MESSAGES.en, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const localizedText = useCallback(
    (key: keyof typeof CHATBOT_TEXT) => CHATBOT_TEXT[key][isAr ? 'ar' : 'en'],
    [isAr]
  );

  useEffect(() => {
    const nextWelcome = isAr ? WELCOME_MESSAGES.ar : WELCOME_MESSAGES.en;

    setMessages((prev) => {
      const isUntouchedWelcome =
        prev.length === 1 &&
        prev[0].role === 'model' &&
        (prev[0].text === WELCOME_MESSAGES.ar || prev[0].text === WELCOME_MESSAGES.en);

      if (!isUntouchedWelcome || prev[0].text === nextWelcome) return prev;

      return [{ ...prev[0], text: nextWelcome }];
    });
  }, [isAr]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) inputRef.current?.focus();
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const updateViewportVars = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--chatbot-viewport-height', `${viewportHeight}px`);
      setIsMobileViewport(window.matchMedia('(max-width: 640px)').matches);
    };

    updateViewportVars();
    window.visualViewport?.addEventListener('resize', updateViewportVars);
    window.visualViewport?.addEventListener('scroll', updateViewportVars);
    window.addEventListener('resize', updateViewportVars);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportVars);
      window.visualViewport?.removeEventListener('scroll', updateViewportVars);
      window.removeEventListener('resize', updateViewportVars);
    };
  }, []);

  const appendFallbackResponse = useCallback(async (messageText: string) => {
    try {
      const fallback = await getFallbackChatResponse(messageText, language, currentRegion.code);
      if (!fallback) return false;

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: fallback.text,
          products: fallback.products.length > 0 ? fallback.products : undefined,
          timestamp: new Date(),
        },
      ]);
      return true;
    } catch {
      return false;
    }
  }, [language, currentRegion.code]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    if (Date.now() < retryAfter) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text: messageText, timestamp: new Date() }]);
      setIsLoading(true);

      const usedFallback = await appendFallbackResponse(messageText);
      if (!usedFallback) {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: localizedText('busy'), timestamp: new Date() },
        ]);
      }

      setIsLoading(false);
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: messageText, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const { text: responseText, products } = await session.sendMessage(messageText, currentRegion.code);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: responseText, products: products.length > 0 ? products : undefined, timestamp: new Date() },
      ]);
    } catch (err) {
      const errorText = String(err);
      const isKeyError = errorText.includes('GEMINI_API_KEY_NOT_SET');
      const isRateLimitError = errorText.includes('429') || errorText.toLowerCase().includes('quota');
      const isBusyError =
        isRateLimitError ||
        errorText.includes('503') ||
        errorText.toLowerCase().includes('service unavailable') ||
        errorText.toLowerCase().includes('overloaded');

      if (isBusyError) {
        setRetryAfter(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        const usedFallback = await appendFallbackResponse(messageText);
        if (!usedFallback) {
          setMessages((prev) => [
            ...prev,
            { role: 'model', text: localizedText('busy'), timestamp: new Date() },
          ]);
        }
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: isKeyError ? localizedText('keyMissing') : localizedText('genericError'),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, retryAfter, currentRegion.code, localizedText, appendFallbackResponse]);

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
  const isSendDisabled = !input.trim() || isLoading;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="fixed bottom-24 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl shadow-rose-900/10 ring-1 ring-rose-100 backdrop-blur transition-colors hover:bg-white md:bottom-8"
            style={{ [isAr ? 'left' : 'right']: '1.25rem' }}
            aria-label="Open SpiritHub Helper"
            dir="ltr"
          >
            <img src={CHATBOT_LOGO} alt="SpiritHub Roastery" className="relative z-10 h-12 w-12 object-contain drop-shadow-sm" />
            <span className="absolute bottom-1 right-1 z-20 flex h-3 w-3 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="chatbot-panel fixed z-50 flex flex-col overflow-hidden rounded-[1.6rem] border border-[#f2ddd8] bg-[#fffaf7] shadow-2xl shadow-rose-950/15"
            style={{
              bottom: isMobileViewport ? 'max(0.75rem, env(safe-area-inset-bottom))' : '5.5rem',
              [isAr ? 'left' : 'right']: isMobileViewport ? 'max(0.625rem, env(safe-area-inset-left))' : '1rem',
              [isAr ? 'right' : 'left']: isMobileViewport ? 'max(0.625rem, env(safe-area-inset-right))' : 'auto',
              width: isMobileViewport ? 'auto' : 'min(390px, calc(100vw - 1.25rem))',
              height: isMinimized
                ? 68
                : isMobileViewport
                  ? 'calc(var(--chatbot-viewport-height, 100dvh) - max(1rem, env(safe-area-inset-top)) - max(0.75rem, env(safe-area-inset-bottom)) - 1rem)'
                  : 'min(620px, calc(100dvh - 7rem))',
              transition: 'height 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
            dir="ltr"
          >
            <div className="relative flex flex-shrink-0 items-center justify-between overflow-hidden px-4 py-3.5">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_48%,#f8dfd8_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-[#f2ddd8]" />

              <div className="relative flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/95 p-1.5 shadow-lg shadow-rose-900/10 ring-1 ring-rose-100">
                  <img src={CHATBOT_LOGO} alt="SpiritHub Roastery" className="h-full w-full rounded-full object-contain" />
                </div>
                <div className="min-w-0 text-left" dir="ltr">
                  <p className="truncate text-[15px] font-bold leading-tight tracking-normal text-[#3f2d2a]">
                    {assistantTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" />
                    <p className="text-xs font-medium text-[#7b625d]">Online</p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center gap-1">
                <button
                  onClick={handleReset}
                  className="rounded-xl p-2 text-[#9b625b] transition-colors hover:bg-white/80 hover:text-[#c75049]"
                  title={isAr ? '\u0645\u062d\u0627\u062f\u062b\u0629 \u062c\u062f\u064a\u062f\u0629' : 'New chat'}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsMinimized((m) => !m)}
                  className="rounded-xl p-2 text-[#9b625b] transition-colors hover:bg-white/80 hover:text-[#c75049]"
                  title={isAr ? '\u062a\u0635\u063a\u064a\u0631' : 'Minimize'}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-[#9b625b] transition-colors hover:bg-white/80 hover:text-[#c75049]"
                  title={isAr ? '\u0625\u063a\u0644\u0627\u0642' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div
                  className="flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top_left,rgba(228,112,101,0.10),transparent_34%),linear-gradient(180deg,#fffaf7_0%,#fbf5f1_100%)] px-0 py-3"
                  style={{ minHeight: 0 }}
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

                  {isLoading && <TypingIndicator language={language} />}

                  {showSuggestions && (
                    <div className="px-3 pt-3" dir={isAr ? 'rtl' : 'ltr'}>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="flex-shrink-0 whitespace-nowrap rounded-full border border-[#f2ddd8] bg-white/85 px-3 py-2 text-[11px] font-semibold text-[#8e4e47] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e9b8b0] hover:bg-[#fff1ed]"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div
                  className="flex-shrink-0 border-t border-[#f2ddd8] bg-white/75 px-3 py-2 backdrop-blur"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {TRUST_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.enTitle}
                          className="flex min-h-[48px] items-center gap-1.5 rounded-xl border border-[#e7f0df] bg-[#fbfdf8] px-2 py-1.5 shadow-sm"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#5f9b54] shadow-sm ring-1 ring-[#dfead6]">
                            <Icon className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[10px] font-bold text-[#36543a]">
                              {isAr ? item.arTitle : item.enTitle}
                            </p>
                            <p className="mt-0.5 text-[9px] font-medium leading-snug text-[#6d806d]">
                              {isAr ? item.arSubtitle : item.enSubtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="chatbot-input flex flex-shrink-0 items-end gap-2 border-t border-[#f2ddd8] bg-white/92 p-3 shadow-[0_-10px_30px_rgba(127,58,49,0.05)] backdrop-blur"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={localizedText('placeholder')}
                    disabled={isLoading}
                    rows={1}
                    className="chatbot-input-field flex-1 resize-none rounded-2xl border border-[#f2ddd8] bg-[#fffaf7] px-4 py-3 text-base text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-[#e39c94] focus:bg-white disabled:opacity-50"
                    style={{ maxHeight: 96, lineHeight: '1.5' }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isSendDisabled}
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-rose-900/15 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
                    style={{
                      background: !isSendDisabled
                        ? 'linear-gradient(135deg, #f08a7f 0%, #df6d64 55%, #c75049 100%)'
                        : '#e6ddd9',
                    }}
                    aria-label={isAr ? '\u0625\u0631\u0633\u0627\u0644' : 'Send'}
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
