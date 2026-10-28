import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, PackageCheck, RotateCcw, ShoppingCart } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { CoffeePassportCard } from './CoffeePassportCard';
import { CoffeeReleaseAlertsCard } from './CoffeeAlertsChatCard';
import { handleImageError } from '../../lib/imageUtils';
import { useCart } from '../../hooks/useCart';
import type { ChatMessage as ChatMessageType } from '../../services/geminiChatService';
import { type AIBundleProduct, type AIBundleResponse, type CoffeeQuizOption, type SmartReorderSuggestion } from '../../services/personalizationService';
import { chatbotIntentService } from '../../services/chatbotIntentService';
import type { CoffeePassportProfile } from '../../services/coffeePassportService';
import { dedupeProductsById, formatBundleTotal } from '../../lib/chatbotProductResults';

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

const CHATBOT_LOGO = '/images/logo-s.webp';
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

  const result = keptLines.join('\n').trim();
  if (isAr && (!result || (/^[ -~\s]+$/.test(result) && /products?|suggestions?/i.test(result)))) {
    return '\u0625\u0644\u064a\u0643 \u0628\u0639\u0636 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:';
  }
  return result || (isAr
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
            className="my-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-100"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <strong className="shrink-0 text-stone-800">{label}</strong>
            {trimmedValue && (
              <span
                dir={isLtrValue ? 'ltr' : isAr ? 'rtl' : 'ltr'}
                className={`min-w-[7rem] flex-1 text-stone-700 [unicode-bidi:isolate] ${isAr ? 'text-left' : 'text-right'} ${trimmedValue.startsWith('http') ? 'break-all text-[12px] leading-relaxed' : 'break-words'}`}
              >
                {trimmedValue}
              </span>
            )}
          </div>
        );
        return;
      }

      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c69c6d]" />
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
  const navigate = useNavigate();
  const isUser = message.role === 'user';
  const isAr = language === 'ar';
  const uniqueProducts = dedupeProductsById(message.products ?? []);
  const hasProducts = uniqueProducts.length > 0;
  const displayText = getDisplayText(message.text, hasProducts, isAr);
  const quizQuestionText = message.quizQuestion ? (isAr ? message.quizQuestion.textAr : message.quizQuestion.textEn) : '';
  const shouldShowTextBubble = displayText.trim().length > 0 && displayText.trim() !== quizQuestionText.trim();
  const shouldOfferCoffeeAlerts = message.openingActions?.some(
    (action) => action.intent === '__build_bundle__' || action.intent === '__start_quiz__',
  ) ?? false;

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] rounded-ee-md bg-stone-900 px-4 py-2.5 text-[14px] leading-6 text-white">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-1">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-white p-1 ring-1 ring-stone-200/80">
          <img src={CHATBOT_LOGO} alt="SpiritHub Roastery" loading="lazy" decoding="async" className="h-full w-full rounded-full object-contain" />
        </div>

        <div className="flex min-w-0 max-w-[calc(100%-2.625rem)] flex-1 flex-col gap-2">
          {shouldShowTextBubble && (
            <div className="w-fit max-w-full break-words rounded-[20px] rounded-ss-md bg-white px-4 py-2.5 text-[14px] leading-6 text-stone-800 ring-1 ring-stone-200/70">
              {renderMarkdownText(displayText, isAr)}
            </div>
          )}

          {hasProducts && (
            <div className="mt-1 flex flex-col gap-2.5">
              {uniqueProducts.map((product) => (
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

          {shouldOfferCoffeeAlerts && (
            <CoffeeReleaseAlertsCard language={language} regionPrefix={regionPrefix} />
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
              onViewPassport={() => navigate(`${regionPrefix}/my-account?tab=coffee-passport`)}
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
  <div className="rounded-[20px] bg-white p-3.5 ring-1 ring-stone-200/70" dir={isAr ? 'rtl' : 'ltr'}>
    <p className="text-[14px] font-semibold leading-snug text-stone-900">
      {isAr ? question.textAr : question.textEn}
    </p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {question.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onAnswer(option)}
          className="min-h-11 rounded-xl bg-stone-50 px-3 py-2 text-start text-[13px] font-medium leading-tight text-stone-700 ring-1 ring-stone-200/80 transition-colors hover:bg-[#c69c6d]/10 hover:text-[#5a432d] hover:ring-[#c69c6d]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69c6d]"
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
  <div dir={isAr ? 'rtl' : 'ltr'}>
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => onAction?.(action.intent)}
          className={`rounded-full text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69c6d] focus-visible:ring-offset-1 ${action.primary ? 'col-span-2 ' : ''}${
            action.primary
              ? 'h-11 bg-[#c69c6d] font-semibold text-stone-950 hover:bg-[#d4ad80]'
              : 'h-10 bg-white px-3 font-medium text-stone-700 ring-1 ring-stone-200/80 hover:bg-stone-50 hover:text-stone-900 hover:ring-stone-300'
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
  const defaultRefinements = isAr
    ? ['أقل من 20 ر.ع', 'أقل من 30 ر.ع', 'اجعلها أقل سعراً', 'اجعلها أكثر فخامة']
    : ['Under 20 OMR', 'Under 30 OMR', 'Make it cheaper', 'Make it more premium'];
  const refinementActions = [...new Set([
    ...defaultRefinements,
    ...actions.filter((action) => !/cart|السلة|أضف/i.test(action)),
  ])].slice(0, 4);
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

    chatbotIntentService.trackAddToCart(product.productId, language, region, { bundleId: bundle.bundleId, bundleProduct: true });
    openCart();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="border-b border-stone-100 bg-stone-50 px-3 py-3">
        <div className={`flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
          <PackageCheck className="h-4 w-4 flex-shrink-0 text-[#8b6f47]" />
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
              className="grid grid-cols-[64px_minmax(0,1fr)_32px] items-center gap-2 rounded-xl bg-stone-50 p-2.5 ring-1 ring-stone-100"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-stone-200/80">
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
                  {product.price && <p className="shrink-0 text-xs font-extrabold text-[#5a432d]">{product.price}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link
                  to={productUrl}
                  title={isAr ? '\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062a\u062c' : 'View product'}
                  aria-label={isAr ? '\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062a\u062c' : 'View product'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm ring-1 ring-stone-200/80 transition-colors hover:bg-stone-100 hover:text-[#8b6f47]"
                  onClick={() => chatbotIntentService.trackProductClick(
                    product.productId, language, region, { bundleId: bundle.bundleId, bundleProduct: true },
                  )}
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  title={isAr ? '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629' : 'Add to cart'}
                  aria-label={isAr ? '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629' : 'Add to cart'}
                  onClick={() => handleBundleProductAdd(product)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-stone-900 hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-stone-100 bg-stone-50/75 px-3 py-2">
        <div className={`mb-1.5 flex items-center justify-end gap-3 px-0.5 text-[13px] ${isAr ? 'flex-row-reverse' : ''}`}>
          <span className="shrink-0 font-extrabold text-[#5a432d]">{isAr ? formatBundleTotal(bundle.totalPrice, region).replace('Total:', '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a:') : formatBundleTotal(bundle.totalPrice, region)}</span>
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-stone-800"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {isAr ? 'أضف الباقة إلى السلة' : 'Add Bundle to Cart'}
        </button>
        {refinementActions.length > 0 && (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {refinementActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onRefine(action)}
                className="min-h-9 rounded-full bg-white px-2 py-1.5 text-center text-[12px] font-medium leading-tight text-stone-700 ring-1 ring-stone-200/80 transition-colors hover:bg-stone-50 hover:ring-stone-300 [overflow-wrap:anywhere]"
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
    <div className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className={`flex gap-2 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
        <img
          src={suggestion.image || PRODUCT_FALLBACK_IMAGE}
          alt={name}
          className="h-14 w-14 flex-shrink-0 rounded-xl bg-white object-cover ring-1 ring-stone-200/80"
          loading="lazy"
          onError={(event) => handleImageError(event, PRODUCT_FALLBACK_IMAGE)}
        />
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-1.5 ${isAr ? 'flex-row-reverse' : ''}`}>
            <RotateCcw className="h-3.5 w-3.5 text-[#8b6f47]" />
            <p className="line-clamp-1 text-sm font-extrabold text-stone-900">{name}</p>
          </div>
          {reason && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{reason}</p>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <button type="button" onClick={() => onAction('reorder')} className="rounded-xl bg-stone-900 min-h-10 px-2 py-2 text-[12px] font-semibold text-white">
          {isAr ? 'إعادة الطلب' : 'Reorder'}
        </button>
        <button type="button" onClick={() => onAction('snooze')} className="rounded-xl border border-stone-200/80 bg-stone-50 min-h-10 px-2 py-2 text-[12px] font-semibold text-[#5a432d]">
          {isAr ? 'ذكرني لاحقا' : 'Remind me later'}
        </button>
        <button type="button" onClick={() => onAction('dismiss')} className="rounded-xl border border-stone-200/80 bg-white min-h-10 px-2 py-2 text-[12px] font-semibold text-stone-500">
          {isAr ? 'ليس الآن' : 'Not now'}
        </button>
      </div>
    </div>
  );
};
