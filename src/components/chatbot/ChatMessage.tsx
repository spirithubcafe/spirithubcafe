import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, PackageCheck, RotateCcw, ShoppingCart } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { CoffeePassportCard } from './CoffeePassportCard';
import { handleImageError } from '../../lib/imageUtils';
import { useCart } from '../../hooks/useCart';
import type { ChatMessage as ChatMessageType } from '../../services/geminiChatService';
import { personalizationService, type AIBundleProduct, type AIBundleResponse, type CoffeeQuizOption, type SmartReorderSuggestion } from '../../services/personalizationService';
import type { CoffeePassportProfile } from '../../services/coffeePassportService';

interface ChatMessageProps {
  message: ChatMessageType;
  regionPrefix: string;
  language: string;
  onQuizAnswer?: (questionKey: string, option: CoffeeQuizOption) => void;
  onBundleRefine?: (bundle: AIBundleResponse, action: string) => void;
  onBundleAddToCart?: (bundle: AIBundleResponse) => void;
  onReorderAction?: (suggestion: SmartReorderSuggestion, action: 'reorder' | 'snooze' | 'dismiss') => void;
  onOpeningAction?: (intent: string) => void;
}

const CHATBOT_LOGO = '/images/logo-s.png';
const PRODUCT_FALLBACK_IMAGE = '/images/products/default-product.webp';

const getProductPathSegment = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  let path = raw;
  try {
    path = new URL(raw, 'https://www.spirithubcafe.com').pathname;
  } catch {
    path = raw.split('?')[0].split('#')[0];
  }

  return path
    .replace(/^\/?(om|sa)\//i, '')
    .replace(/^\/?(shop\/product|products|product)\//i, '')
    .replace(/^\/+/, '')
    .split('?')[0]
    .split('#')[0]
    .trim();
};

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
  const bulletPattern = /^[-*\u2022]\s+/;

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<span key={i} className="block h-1" />);
      return;
    }

    const isBullet = bulletPattern.test(trimmed);
    const bulletText = trimmed.replace(bulletPattern, '');
    const rendered = renderInlineMarkdown(bulletText);
    const labeledRow = bulletText.match(/^\*\*([^*]+)\*\*\s*(.*)$/);

    if (isBullet) {
      if (labeledRow) {
        const [, label, value] = labeledRow;
        const trimmedValue = value.trim();
        const isLtrValue = /[A-Za-z0-9@+:/?=&._-]/.test(trimmedValue);

        elements.push(
          <div
            key={i}
            className={`my-1 flex gap-2 rounded-lg bg-[#fffaf7] px-2.5 py-1.5 ring-1 ring-[#f6e9e4] ${isAr ? 'items-start justify-between text-right' : 'items-baseline'}`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <strong className="shrink-0 text-stone-800">{label}</strong>
            {trimmedValue && (
              <span
                dir={isLtrValue ? 'ltr' : isAr ? 'rtl' : 'ltr'}
                className={`min-w-0 flex-1 text-stone-700 [unicode-bidi:isolate] ${isAr ? 'text-left' : 'text-right'} ${trimmedValue.startsWith('http') ? 'break-all text-[12px] leading-relaxed' : 'break-words'}`}
              >
                {trimmedValue}
              </span>
            )}
          </div>
        );
        return;
      }

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

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  regionPrefix,
  language,
  onQuizAnswer,
  onBundleRefine,
  onBundleAddToCart,
  onReorderAction,
  onOpeningAction,
}) => {
  const isUser = message.role === 'user';
  const isAr = language === 'ar';
  const hasProducts = !!message.products?.length;
  const displayText = getDisplayText(message.text, hasProducts, isAr);
  const quizQuestionText = message.quizQuestion ? (isAr ? message.quizQuestion.textAr : message.quizQuestion.textEn) : '';
  const shouldShowTextBubble = displayText.trim().length > 0 && displayText.trim() !== quizQuestionText.trim();

  if (isUser) {
    return (
      <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 px-3 py-0.5 sm:px-4 sm:py-1`}>
        <div
          className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:px-4 sm:py-2.5"
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
    <div className="px-3 py-0.5 sm:px-4 sm:py-1">
      <div className={`flex items-start gap-2 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ring-1 ring-[#f2ddd8] sm:h-8 sm:w-8">
          <img src={CHATBOT_LOGO} alt="SpiritHub Roastery" className="h-full w-full rounded-full object-contain" />
        </div>

        <div className="flex max-w-[calc(100%-2.25rem)] flex-1 flex-col gap-1.5 sm:max-w-[calc(100%-2.5rem)] sm:gap-2">
          {shouldShowTextBubble && (
            <div
              className={`break-words rounded-2xl border border-[#f2ddd8] bg-white px-3 py-2 text-sm leading-normal text-stone-800 shadow-sm shadow-rose-950/5 sm:px-3.5 sm:py-2.5 ${isAr ? 'text-right' : ''}`}
              style={{ borderRadius: isAr ? '0 1rem 1rem 1rem' : '1rem 1rem 1rem 0' }}
            >
              {renderMarkdownText(displayText, isAr)}
            </div>
          )}

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

          {message.quizQuestion && (
            <QuizQuestionCard
              question={message.quizQuestion}
              isAr={isAr}
              onAnswer={(option) => onQuizAnswer?.(message.quizQuestion!.key, option)}
            />
          )}

          {message.openingActions && message.openingActions.length > 0 && (
            <OpeningActionsCard
              actions={message.openingActions}
              isAr={isAr}
              onAction={onOpeningAction}
            />
          )}

          {message.bundle && (
            <BundleCard
              bundle={message.bundle}
              isAr={isAr}
              language={language}
              regionPrefix={regionPrefix}
              onRefine={(action) => onBundleRefine?.(message.bundle!, action)}
              onAddToCart={() => onBundleAddToCart?.(message.bundle!)}
            />
          )}

          {message.reorderSuggestion && (
            <ReorderCard
              suggestion={message.reorderSuggestion}
              isAr={isAr}
              onAction={(action) => onReorderAction?.(message.reorderSuggestion!, action)}
            />
          )}

          {message.coffeePassportCard && (
            <CoffeePassportCard
              profile={message.coffeePassportCard as CoffeePassportProfile}
              isArabic={isAr}
              onViewPassport={() => {
                window.location.href = '/my-account?tab=coffee-passport';
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const QuizQuestionCard = ({
  question,
  isAr,
  onAnswer,
}: {
  question: NonNullable<ChatMessageType['quizQuestion']>;
  isAr: boolean;
  onAnswer: (option: CoffeeQuizOption) => void;
}) => (
  <div className="rounded-xl border border-[#f2ddd8] bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-3" dir={isAr ? 'rtl' : 'ltr'}>
    <p className={`text-[13px] font-bold leading-snug text-stone-900 sm:text-sm ${isAr ? 'text-right' : ''}`}>
      {isAr ? question.textAr : question.textEn}
    </p>
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
      {question.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onAnswer(option)}
          className={`min-h-9 rounded-lg border border-[#f2ddd8] bg-[#fffaf7] px-2.5 py-1.5 text-[13px] font-semibold leading-tight text-[#8e4e47] transition-colors hover:border-[#e9b8b0] hover:bg-[#fff1ed] sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm ${isAr ? 'text-right' : 'text-left'}`}
        >
          {isAr ? option.labelAr : option.labelEn}
        </button>
      ))}
    </div>
  </div>
);

const OpeningActionsCard = ({
  actions,
  isAr,
  onAction,
}: {
  actions: NonNullable<ChatMessageType['openingActions']>;
  isAr: boolean;
  onAction?: (intent: string) => void;
}) => (
  <div className="rounded-2xl border border-[#f2ddd8] bg-white p-2.5 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
    <div className="grid grid-cols-2 gap-1.5">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => onAction?.(action.intent)}
          className={`min-h-9 rounded-xl px-2.5 py-2 text-[12px] font-bold transition-colors ${
            action.primary
              ? 'bg-[#5f9b54] text-white hover:bg-[#528948]'
              : 'border border-[#f2ddd8] bg-[#fffaf7] text-[#8e4e47] hover:bg-[#fff1ed]'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  </div>
);

const BundleCard = ({
  bundle,
  isAr,
  language,
  regionPrefix,
  onRefine,
  onAddToCart,
}: {
  bundle: AIBundleResponse;
  isAr: boolean;
  language: string;
  regionPrefix: string;
  onRefine: (action: string) => void;
  onAddToCart: () => void;
}) => {
  const { addToCart, openCart } = useCart();
  const title = isAr ? bundle.titleAr || bundle.titleEn : bundle.titleEn;
  const summary = isAr ? bundle.summaryAr || bundle.summaryEn : bundle.summaryEn;
  const actions = (isAr ? bundle.quickActionsAr : bundle.quickActions) ?? [];
  const refinementActions = actions.filter((action) => !/cart|السلة|أضف/i.test(action)).slice(0, 3);
  const region = regionPrefix.startsWith('/sa') ? 'sa' : 'om';

  const getBundleProductUrl = (product: AIBundleProduct) => {
    const slugOrId = getProductPathSegment(product.slug || product.url) || String(product.productId);
    const rawUrl = product.url?.trim();

    if (rawUrl?.startsWith('/om/shop/product/') || rawUrl?.startsWith('/sa/shop/product/')) return rawUrl;

    return `${regionPrefix}/shop/product/${slugOrId}`;
  };

  const handleBundleProductAdd = (product: AIBundleProduct) => {
    const name = isAr ? product.nameAr || product.nameEn : product.nameEn;

    addToCart({
      id: product.productVariantId ? `${product.productId}-${product.productVariantId}` : `${product.productId}`,
      productId: product.productId,
      productVariantId: product.productVariantId ?? null,
      name,
      price: product.priceValue ?? 0,
      image: product.image || PRODUCT_FALLBACK_IMAGE,
      tastingNotes: isAr ? product.roleAr || product.roleEn : product.roleEn,
      variantName: undefined,
      weight: undefined,
      weightUnit: undefined,
    });

    personalizationService.trackEvent({
      eventType: 'add_to_cart',
      productId: product.productId,
      language,
      country: region,
      source: 'chatbot',
      metadata: { bundleId: bundle.bundleId, bundleProduct: true },
    });
    openCart();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#f2ddd8] bg-white shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="border-b border-[#f4e6e1] bg-[#fffaf7] px-3 py-3">
        <div className={`flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
          <PackageCheck className="h-4 w-4 flex-shrink-0 text-[#c75049]" />
          <p className={`min-w-0 flex-1 text-sm font-extrabold text-stone-900 ${isAr ? 'text-right' : ''}`}>{title}</p>
        </div>
        {summary && <p className={`mt-1 text-xs leading-relaxed text-stone-600 ${isAr ? 'text-right' : ''}`}>{summary}</p>}
      </div>

      <div className="grid gap-2.5 p-3">
        {bundle.products.map((product) => {
          const name = isAr ? product.nameAr || product.nameEn : product.nameEn;
          const role = isAr ? product.roleAr || product.roleEn : product.roleEn;
          const productUrl = getBundleProductUrl(product);
          return (
            <div
              key={`${product.productId}-${product.productVariantId}`}
              className="grid grid-cols-[64px_minmax(0,1fr)_32px] items-center gap-2 rounded-xl bg-[#fffaf7] p-2.5 ring-1 ring-[#f6e9e4]"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#f2ddd8]">
                <img
                  src={product.image || PRODUCT_FALLBACK_IMAGE}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(event) => handleImageError(event, PRODUCT_FALLBACK_IMAGE)}
                />
              </div>
              <div className={`min-w-0 flex-1 ${isAr ? 'text-right' : ''}`}>
                <p className="line-clamp-2 text-[13px] font-bold leading-snug text-stone-900">{name}</p>
                <div className={`mt-1 flex min-w-0 items-center gap-2 ${isAr ? 'flex-row-reverse justify-start' : 'justify-between'}`}>
                  {role && <p className="min-w-0 flex-1 truncate text-[11px] text-stone-500">{role}</p>}
                  {product.price && <p className="shrink-0 text-xs font-extrabold text-[#8e4e47]">{product.price}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link
                  to={productUrl}
                  title={isAr ? '\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062a\u062c' : 'View product'}
                  aria-label={isAr ? '\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062a\u062c' : 'View product'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm ring-1 ring-[#f2ddd8] transition-colors hover:bg-[#fff1ed] hover:text-[#c75049]"
                  onClick={() => personalizationService.trackEvent({
                    eventType: 'chatbot_recommendation_click',
                    productId: product.productId,
                    language,
                    country: region,
                    source: 'chatbot',
                    metadata: { bundleId: bundle.bundleId, bundleProduct: true },
                  })}
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  title={isAr ? '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629' : 'Add to cart'}
                  aria-label={isAr ? '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629' : 'Add to cart'}
                  onClick={() => handleBundleProductAdd(product)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#5f9b54] shadow-sm ring-1 ring-[#dfead6] transition-colors hover:bg-[#5f9b54] hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#f4e6e1] bg-[#fffaf7]/75 px-3 py-2">
        <div className={`mb-1.5 flex items-center justify-between gap-3 px-0.5 text-[13px] ${isAr ? 'flex-row-reverse' : ''}`}>
          <span className="font-extrabold text-stone-500">{isAr ? 'الإجمالي' : 'Total'}</span>
          <span className="shrink-0 font-extrabold text-[#8e4e47]">{bundle.totalPrice}</span>
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          className="inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-xl bg-[#5f9b54] px-3 py-1 text-[13px] font-extrabold text-white transition-colors hover:bg-[#528948]"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {isAr ? 'أضف الباقة إلى السلة' : 'Add Bundle to Cart'}
        </button>
        {refinementActions.length > 0 && (
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {refinementActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onRefine(action)}
                className="min-h-7 rounded-full border border-[#f2ddd8] bg-white px-1.5 py-1 text-center text-[10px] font-bold leading-tight text-[#8e4e47] transition-colors hover:bg-[#fff1ed] [overflow-wrap:anywhere]"
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ReorderCard = ({
  suggestion,
  isAr,
  onAction,
}: {
  suggestion: SmartReorderSuggestion;
  isAr: boolean;
  onAction: (action: 'reorder' | 'snooze' | 'dismiss') => void;
}) => {
  const name = isAr ? suggestion.nameAr || suggestion.nameEn : suggestion.nameEn;
  const reason = isAr ? suggestion.reasonAr || suggestion.reasonEn : suggestion.reasonEn;

  return (
    <div className="rounded-2xl border border-[#f2ddd8] bg-white p-3 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className={`flex gap-2 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
        <img
          src={suggestion.image || PRODUCT_FALLBACK_IMAGE}
          alt={name}
          className="h-14 w-14 flex-shrink-0 rounded-xl bg-white object-cover ring-1 ring-[#f2ddd8]"
          loading="lazy"
          onError={(event) => handleImageError(event, PRODUCT_FALLBACK_IMAGE)}
        />
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-1.5 ${isAr ? 'flex-row-reverse' : ''}`}>
            <RotateCcw className="h-3.5 w-3.5 text-[#c75049]" />
            <p className="line-clamp-1 text-sm font-extrabold text-stone-900">{name}</p>
          </div>
          {reason && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{reason}</p>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <button type="button" onClick={() => onAction('reorder')} className="rounded-xl bg-[#5f9b54] px-2 py-2 text-[11px] font-bold text-white">
          {isAr ? 'إعادة الطلب' : 'Reorder'}
        </button>
        <button type="button" onClick={() => onAction('snooze')} className="rounded-xl border border-[#f2ddd8] bg-[#fffaf7] px-2 py-2 text-[11px] font-bold text-[#8e4e47]">
          {isAr ? 'ذكرني لاحقا' : 'Remind me later'}
        </button>
        <button type="button" onClick={() => onAction('dismiss')} className="rounded-xl border border-[#f2ddd8] bg-white px-2 py-2 text-[11px] font-bold text-stone-500">
          {isAr ? 'ليس الآن' : 'Not now'}
        </button>
      </div>
    </div>
  );
};
