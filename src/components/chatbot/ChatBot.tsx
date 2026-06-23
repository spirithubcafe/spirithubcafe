import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Minimize2, Truck, Headphones } from 'lucide-react';
import { useRegion } from '../../hooks/useRegion';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { REGION_INFO } from '../../config/regionInfo';
import { GeminiChatSession, getFallbackChatResponse, type ChatMessage } from '../../services/geminiChatService';
import {
  personalizationService,
  type AIBundleResponse,
  type CoffeeQuizOption,
  type CoffeeQuizQuestion,
  type CoffeeQuizStatus,
  type CustomerCoffeeProfile,
  type SmartReorderSuggestion,
} from '../../services/personalizationService';
import { coffeePassportService, type CoffeePassportProfile } from '../../services/coffeePassportService';
import { ChatMessageComponent } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { CoffeePassportCard } from './CoffeePassportCard';

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
  ar: '\u0645\u0631\u062d\u0628\u0627\u064b \ud83d\udc4b',
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
  quizStart: {
    ar: '\u0623\u0643\u064a\u062f. \u062e\u0644\u064a\u0646\u0627 \u0646\u062e\u062a\u0627\u0631 \u0627\u0644\u0642\u0647\u0648\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0643 \u0628\u062e\u0637\u0648\u0627\u062a \u0628\u0633\u064a\u0637\u0629.',
    en: 'Of course. Let us find the right coffee for you with a quick quiz.',
  },
  quizDone: {
    ar: '\u0647\u0630\u0647 \u0623\u0641\u0636\u0644 \u062a\u0631\u0634\u064a\u062d\u0627\u062a \u0627\u0644\u0642\u0647\u0648\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0625\u062c\u0627\u0628\u0627\u062a\u0643:',
    en: 'Here are the best coffee matches for your answers:',
  },
  bundleIntro: {
    ar: '\u062d\u0636\u0631\u062a \u0644\u0643 \u0628\u0627\u0642\u0629 \u0645\u0646\u0627\u0633\u0628\u0629. \u064a\u0645\u0643\u0646\u0643 \u062a\u0639\u062f\u064a\u0644\u0647\u0627 \u0623\u0648 \u0625\u0636\u0627\u0641\u062a\u0647\u0627 \u0644\u0644\u0633\u0644\u0629.',
    en: 'I built a bundle for you. You can refine it or add it to cart.',
  },
  cartAdded: {
    ar: '\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629.',
    en: 'Added to your cart.',
  },
  reorderSnoozed: {
    ar: '\u062a\u0645\u0627\u0645\u060c \u0633\u0623\u0630\u0643\u0631\u0643 \u0644\u0627\u062d\u0642\u0627\u064b.',
    en: 'Done. I will remind you later.',
  },
  reorderDismissed: {
    ar: '\u062a\u0645\u0627\u0645\u060c \u0644\u0646 \u0623\u0638\u0647\u0631 \u0647\u0630\u0627 \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d \u0627\u0644\u0622\u0646.',
    en: 'No problem. I will hide this suggestion for now.',
  },
  profileHint: {
    ar: '\u0644\u0627\u062d\u0638\u062a \u062a\u0641\u0636\u064a\u0644\u0627\u062a\u0643 \u0627\u0644\u0633\u0627\u0628\u0642\u0629\u060c \u0644\u0630\u0644\u0643 \u0633\u0623\u062c\u0639\u0644 \u0627\u0644\u062a\u0631\u0634\u064a\u062d\u0627\u062a \u0623\u0642\u0631\u0628 \u0644\u0630\u0648\u0642\u0643.',
    en: 'I will tailor recommendations around your recent coffee preferences.',
  },
  placeholder: {
    ar: '\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u062a\u0643...',
    en: 'Type your message...',
  },
};

const UNKNOWN_COFFEE_PATTERN = /don't know what coffee to choose|do not know what coffee to choose|not sure what coffee|help me choose coffee|which coffee should i choose|\u0645\u0627\s*\u0623\u0639\u0631\u0641.*\u0623\u062e\u062a\u0627\u0631.*\u0642\u0647\u0648\u0629|\u0645\u0634\s*\u0639\u0627\u0631\u0641.*\u0623\u062e\u062a\u0627\u0631.*\u0642\u0647\u0648\u0629|\u0645\u0627\s*\u0627\u062f\u0631\u064a.*\u0623\u062e\u062a\u0627\u0631.*\u0642\u0647\u0648\u0629|\u0623\u064a\s*\u0642\u0647\u0648\u0629.*\u0623\u062e\u062a\u0627\u0631/i;
const BUNDLE_PATTERN = /bundle|gift|filter|espresso|capsules?|wholesale bundle|\u0628\u0627\u0642\u0629|\u0628\u0627\u0642\u0627\u062a|\u0647\u062f\u064a\u0629|\u0647\u062f\u0627\u064a\u0627|\u0641\u0644\u062a\u0631|\u0625\u0633\u0628\u0631\u064a\u0633\u0648|\u0627\u0633\u0628\u0631\u064a\u0633\u0648|\u0643\u0628\u0633\u0648\u0644\u0627\u062a|\u062c\u0645\u0644\u0629/i;
const GIFT_PATTERN = /gift|\u0647\u062f\u064a\u0629|\u0647\u062f\u0627\u064a\u0627/i;
const WHOLESALE_PATTERN = /wholesale|\u062c\u0645\u0644\u0629|\u062a\u0648\u0631\u064a\u062f/i;
const LOCAL_QUIZ_SESSION_ID = -1;
const FRUITY_COFFEE_PATTERN = /fruity|fruit|berry|citrus|\u0642\u0647\u0648\u0629.*\u0641\u0627\u0643\u0647|\u0641\u0627\u0643\u0647|\u0641\u0648\u0627\u0643\u0647|\u062d\u0645\u0636|\u062a\u0648\u062a/i;
const NO_PRODUCTS_RESPONSE_PATTERN = /could not find|couldn't find|no products|no matching products|no products with|لم أجد|لا توجد منتجات/i;

const AR_QUICK_TEXT = {
  startQuiz: '\u0627\u0628\u062f\u0623 \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0642\u0647\u0648\u0629',
  continueQuiz: '\u062a\u0627\u0628\u0639 \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0642\u0647\u0648\u0629',
  buildBundle: '\u0635\u0645\u0651\u0645 \u0628\u0627\u0642\u062a\u064a',
  espresso: '\u0625\u0633\u0628\u0631\u064a\u0633\u0648',
  fruity: '\u0641\u0627\u0643\u0647\u064a\u0629',
  gifts: '\u0647\u062f\u0627\u064a\u0627',
  capsules: '\u0643\u0628\u0633\u0648\u0644\u0627\u062a',
  wholesale: '\u062c\u0645\u0644\u0629',
  contact: '\u062a\u0648\u0627\u0635\u0644',
  chooseNext: '\u0627\u062e\u062a\u0631 \u0645\u0627 \u064a\u0646\u0627\u0633\u0628\u0643 \u0627\u0644\u0622\u0646:',
  learnTaste: '\u0645\u0627 \u0632\u0644\u062a \u0623\u062a\u0639\u0644\u0645 \u0630\u0648\u0642\u0643. \u0647\u0644 \u0646\u0628\u062f\u0623 \u0628\u0627\u062e\u062a\u0628\u0627\u0631 \u0642\u0647\u0648\u0629 \u0633\u0631\u064a\u0639\u061f',
};

const toBundlePrompt = (messageText: string): string => {
  if (/^\s*(?:\u0635\u0645\u0651\u0645|\u0635\u0645\u0645).*\u0628\u0627\u0642\u062a\u064a\s*$/i.test(messageText)) return 'Build my bundle';
  if (/\u0625\u0633\u0628\u0631\u064a\u0633\u0648|\u0627\u0633\u0628\u0631\u064a\u0633\u0648/i.test(messageText)) return 'Espresso coffee bundle';
  if (/\u0647\u062f\u064a\u0629|\u0647\u062f\u0627\u064a\u0627/i.test(messageText)) return 'Coffee gifts bundle';
  if (/\u0643\u0628\u0633\u0648\u0644\u0627\u062a/i.test(messageText)) return 'Coffee capsules bundle';
  if (/\u062c\u0645\u0644\u0629|\u062a\u0648\u0631\u064a\u062f/i.test(messageText)) return 'Wholesale coffee bundle';
  if (/\u0641\u0644\u062a\u0631/i.test(messageText)) return 'Filter coffee bundle';
  return messageText;
};

const buildLocalQuizSearchPrompt = (answers: string[]): string => {
  const values = answers.map((answer) => answer.toLowerCase());

  if (values.includes('capsules')) return 'coffee capsules';
  if (values.includes('filter')) return 'filter coffee';
  if (values.includes('espresso')) return 'espresso coffee';
  if (values.includes('fruity') || values.includes('bright')) return 'fruity coffee';
  if (values.includes('floral')) return 'floral coffee';
  if (values.includes('chocolate') || values.includes('classic') || values.includes('low_acidity')) return 'classic espresso coffee';

  return 'best selling coffee';
};

const LOCAL_QUIZ_QUESTIONS: CoffeeQuizQuestion[] = [
  {
    key: 'taste_notes',
    textEn: 'What tasting notes do you usually enjoy?',
    textAr: '\u0645\u0627 \u0646\u0648\u0639 \u0627\u0644\u0646\u0643\u0647\u0627\u062a \u0627\u0644\u062a\u064a \u062a\u0641\u0636\u0644\u0647\u0627\u061f',
    options: [
      { value: 'classic', labelEn: 'Classic', labelAr: '\u0643\u0644\u0627\u0633\u064a\u0643\u064a\u0629' },
      { value: 'fruity', labelEn: 'Fruity', labelAr: '\u0641\u0627\u0643\u0647\u064a\u0629' },
      { value: 'floral', labelEn: 'Floral', labelAr: '\u0632\u0647\u0631\u064a\u0629' },
      { value: 'chocolate', labelEn: 'Chocolate', labelAr: '\u0634\u0648\u0643\u0648\u0644\u0627\u062a\u0629' },
    ],
  },
  {
    key: 'brew_method',
    textEn: 'How do you usually brew your coffee?',
    textAr: '\u0643\u064a\u0641 \u062a\u062d\u0636\u0631 \u0642\u0647\u0648\u062a\u0643 \u063a\u0627\u0644\u0628\u0627\u061f',
    options: [
      { value: 'espresso', labelEn: 'Espresso', labelAr: '\u0625\u0633\u0628\u0631\u064a\u0633\u0648' },
      { value: 'filter', labelEn: 'Filter', labelAr: '\u0641\u0644\u062a\u0631' },
      { value: 'capsules', labelEn: 'Capsules', labelAr: '\u0643\u0628\u0633\u0648\u0644\u0627\u062a' },
      { value: 'not_sure', labelEn: 'Not sure', labelAr: '\u0644\u0633\u062a \u0645\u062a\u0623\u0643\u062f\u0627' },
    ],
  },
  {
    key: 'acidity',
    textEn: 'What acidity level feels right for you?',
    textAr: '\u0645\u0627 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062d\u0645\u0648\u0636\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0643\u061f',
    options: [
      { value: 'low_acidity', labelEn: 'Low acidity', labelAr: '\u062d\u0645\u0648\u0636\u0629 \u0645\u0646\u062e\u0641\u0636\u0629' },
      { value: 'balanced', labelEn: 'Balanced', labelAr: '\u0645\u062a\u0648\u0627\u0632\u0646\u0629' },
      { value: 'bright', labelEn: 'Bright', labelAr: '\u062d\u0645\u0648\u0636\u0629 \u0648\u0627\u0636\u062d\u0629' },
      { value: 'not_sure', labelEn: 'Not sure', labelAr: '\u0644\u0633\u062a \u0645\u062a\u0623\u0643\u062f\u0627' },
    ],
  },
];

const TRUST_ITEMS = [
  {
    icon: Truck,
    arTitle: '\u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639',
    arSubtitle: '\u0641\u064a \u062c\u0645\u064a\u0639 \u0623\u0646\u062d\u0627\u0621 \u0639\u0645\u0627\u0646',
    enTitle: 'Fast delivery',
    enSubtitle: 'Across Oman',
  },
  {
    icon: Headphones,
    arTitle: '\u062f\u0639\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621',
    arSubtitle: '\u0645\u062a\u0648\u0641\u0631 \u062f\u0627\u0626\u0645\u0627',
    enTitle: 'Customer support',
    enSubtitle: 'Always available',
  },
];

const buildProfileContext = (profile: CustomerCoffeeProfile | null, isAr: boolean): string | undefined => {
  if (!profile || (profile.profileConfidenceScore ?? 0) <= 0) return undefined;

  const notes = isAr ? profile.favoriteNotesAr : profile.favoriteNotesEn;
  const parts = [
    notes?.length ? `favorite notes: ${notes.slice(0, 4).join(', ')}` : '',
    profile.favoriteBrewMethods?.length ? `brew methods: ${profile.favoriteBrewMethods.slice(0, 3).join(', ')}` : '',
    profile.favoriteCategories?.length ? `categories: ${profile.favoriteCategories.slice(0, 3).join(', ')}` : '',
    profile.lastSearchedTerms?.length ? `recent searches: ${profile.lastSearchedTerms.slice(0, 3).join(', ')}` : '',
    profile.topInterests?.length ? `interests: ${profile.topInterests.slice(0, 3).join(', ')}` : '',
  ].filter(Boolean);

  return parts.length ? parts.join('; ') : undefined;
};

const buildContactMessage = (regionCode: keyof typeof REGION_INFO, isAr: boolean): string => {
  const contact = REGION_INFO[regionCode]?.contact ?? REGION_INFO.om.contact;
  const address = isAr ? contact.address.ar : contact.address.en;
  const workingHours = isAr ? contact.workingHours.ar : contact.workingHours.en;
  const wholesaleLabel = contact.phone3Label?.[isAr ? 'ar' : 'en'] ?? (isAr ? '\u0628\u064a\u0639 \u0628\u0627\u0644\u062c\u0645\u0644\u0629' : 'Wholesale');

  return isAr
    ? [
        '\u0623\u0643\u064a\u062f\u060c \u0647\u0630\u0647 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0633\u0628\u064a\u0631\u064a\u062a \u0647\u0628:',
        '',
        `- **\u0627\u0644\u0627\u062a\u0635\u0627\u0644:** ${contact.phone}`,
        contact.phone2 ? `- **\u0631\u0642\u0645 \u0625\u0636\u0627\u0641\u064a:** ${contact.phone2}` : '',
        contact.phone3 ? `- **${wholesaleLabel}:** ${contact.phone3}` : '',
        `- **\u0648\u0627\u062a\u0633\u0627\u0628:** +${contact.whatsapp}`,
        `- **\u0627\u0644\u0628\u0631\u064a\u062f:** ${contact.email}`,
        `- **\u0627\u0644\u0645\u0648\u0642\u0639:** ${address}`,
        `- **\u0627\u0644\u0639\u0645\u0644:** ${workingHours}`,
        `- **\u0627\u0644\u062e\u0631\u064a\u0637\u0629:** ${contact.googleMapsUrl}`,
      ].filter(Boolean).join('\n')
    : [
        'Sure, here are the SpiritHub contact details:',
        '',
        `- **Phone:** ${contact.phone}`,
        contact.phone2 ? `- **Second phone:** ${contact.phone2}` : '',
        contact.phone3 ? `- **${wholesaleLabel}:** ${contact.phone3}` : '',
        `- **WhatsApp:** +${contact.whatsapp}`,
        `- **Email:** ${contact.email}`,
        `- **Location:** ${address}`,
        `- **Working hours:** ${workingHours}`,
        `- **Google Maps:** ${contact.googleMapsUrl}`,
      ].filter(Boolean).join('\n');
};
const hasProfileSignals = (profile: CustomerCoffeeProfile | null, recommendationsCount: number): boolean => {
  if (recommendationsCount > 0) return true;
  if (!profile) return false;
  return Boolean(
    (profile.profileConfidenceScore ?? 0) > 0 ||
    profile.favoriteCategories?.length ||
    profile.favoriteNotesEn?.length ||
    profile.favoriteNotesAr?.length ||
    profile.favoriteBrewMethods?.length ||
    profile.lastSearchedTerms?.length ||
    profile.topInterests?.length
  );
};

const buildOpeningActionMessage = (
  isAr: boolean,
  hasIncompleteQuiz: boolean,
  hasProfileData: boolean,
  hasCoffeePassport: boolean = false,
): ChatMessage => {
  const actions: NonNullable<ChatMessage['openingActions']> = [];

  if (!hasProfileData) {
    actions.push({
      key: 'start-quiz',
      label: isAr ? AR_QUICK_TEXT.startQuiz : 'Start Coffee Quiz',
      intent: '__start_quiz__',
      primary: true,
    });
  }

  if (hasIncompleteQuiz) {
    actions.push({
      key: 'continue-quiz',
      label: isAr ? AR_QUICK_TEXT.continueQuiz : 'Continue Coffee Quiz',
      intent: '__continue_quiz__',
      primary: true,
    });
  }

  if (hasCoffeePassport) {
    actions.push({
      key: 'view-passport',
      label: isAr ? 'عرض جواز القهوة' : 'View My Coffee Passport',
      intent: '__view_passport__',
      primary: hasProfileData && !hasIncompleteQuiz,
    });
  }

  actions.push({
    key: 'build-bundle',
    label: isAr ? AR_QUICK_TEXT.buildBundle : 'Build My Bundle',
    intent: '__build_bundle__',
    primary: hasProfileData && !hasIncompleteQuiz && !hasCoffeePassport,
  });

  [
    [isAr ? AR_QUICK_TEXT.espresso : 'Espresso', '__espresso__'],
    [isAr ? AR_QUICK_TEXT.fruity : 'Fruity', '__fruity__'],
    [isAr ? AR_QUICK_TEXT.gifts : 'Gifts', '__gifts__'],
    [isAr ? AR_QUICK_TEXT.capsules : 'Capsules', '__capsules__'],
    [isAr ? AR_QUICK_TEXT.wholesale : 'Wholesale', '__wholesale__'],
    [isAr ? AR_QUICK_TEXT.contact : 'Contact', '__contact__'],
  ].forEach(([label, intent]) => {
    actions.push({
      key: String(intent),
      label: String(label),
      intent: String(intent),
    });
  });

  return {
    role: 'model',
    text: hasProfileData
      ? (isAr ? AR_QUICK_TEXT.chooseNext : 'Choose what you would like to do next:')
      : (isAr ? AR_QUICK_TEXT.learnTaste : 'I am still learning your taste. Start a quick coffee quiz?'),
    openingActions: actions,
    timestamp: new Date(),
  };
};

export const ChatBot: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, openCart } = useCart();
  const isAr = language === 'ar';
  const regionPrefix = currentRegion.code === 'om' ? '/om' : currentRegion.code === 'sa' ? '/sa' : '';
  const assistantTitle = isAr
    ? '\u0645\u0633\u0627\u0639\u062f\u0643 \u0627\u0644\u0630\u0643\u064a'
    : 'SPIRITHUB AI';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: isAr ? WELCOME_MESSAGES.ar : WELCOME_MESSAGES.en, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [profile, setProfile] = useState<CustomerCoffeeProfile | null>(null);
  const [coffeePassportProfile, setCoffeePassportProfile] = useState<CoffeePassportProfile | null>(null);
  const [openingQuizStatus, setOpeningQuizStatus] = useState<CoffeeQuizStatus | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<CoffeeQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [localQuizAnswers, setLocalQuizAnswers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openPersonalizationLoadedRef = useRef(false);

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
    if (!isOpen || openPersonalizationLoadedRef.current) return;
    openPersonalizationLoadedRef.current = true;

    const showDefaultOpeningActions = () => {
      setMessages((prev) => {
        const hasOpeningActions = prev.some((message) => message.openingActions?.length);
        if (hasOpeningActions) return prev;

        const canAppendToWelcome =
          prev.length === 1 &&
          prev[0].role === 'model' &&
          (prev[0].text === WELCOME_MESSAGES.ar || prev[0].text === WELCOME_MESSAGES.en);

        if (!canAppendToWelcome) return prev;
        return [...prev, buildOpeningActionMessage(isAr, false, false)];
      });
    };

    if (!personalizationService.isEnabled() || !isAuthenticated || !user?.id) {
      showDefaultOpeningActions();
      return;
    }

    let cancelled = false;

    const loadOpenPersonalization = async () => {
      setIsLoading(true);
      try {
        const data = await personalizationService.getOpeningPersonalization({
          customerId: user.id,
          language,
          country: currentRegion.code,
        });

        if (cancelled) return;

        setProfile(data.preferences);
        setOpeningQuizStatus(data.quizStatus);

        const hasIncompleteQuiz = Boolean(data.quizStatus?.hasStarted && !data.quizStatus?.isComplete);
        const hasProfileData = hasProfileSignals(data.preferences, data.recommendations.length);
        const nextMessages: ChatMessage[] = [];

        nextMessages.push({
          role: 'model',
          text: hasProfileData
            ? (isAr
                ? 'مرحباً بعودتك 👋 بناءً على تفضيلاتك الأخيرة، اخترنا لك بعض القهوة المناسبة.'
                : 'Welcome back 👋 Based on your recent coffee preferences, I found a few coffees you may enjoy.')
            : (isAr
                ? 'ما زلت أتعلم ذوقك. ابدأ اختبار قهوة سريع لأقترح عليك اختيارات أدق.'
                : 'I am still learning your taste. Start a quick coffee quiz so I can recommend better matches.'),
          timestamp: new Date(),
        });

        const reorderSuggestion = data.smartReorder?.suggestions?.[0];
        if (reorderSuggestion) {
          nextMessages.push({
            role: 'model',
            text: isAr
              ? 'يبدو أن قهوتك المعتادة قد توشك على النفاد. هل تريد إعادة طلبها؟'
              : 'You may be running low on your usual coffee. Would you like to reorder?',
            reorderSuggestion,
            timestamp: new Date(),
          });
        }

        // Fetch and display Coffee Passport profile
        const passportProfile = await coffeePassportService.getProfile();
        if (passportProfile) {
          setCoffeePassportProfile(passportProfile);
          // Add Coffee Passport card as a custom component
          nextMessages.push({
            role: 'model',
            text: '', // Empty text, component will be shown in ChatMessage
            coffeePassportCard: passportProfile,
            timestamp: new Date(),
          } as ChatMessage & { coffeePassportCard: CoffeePassportProfile });
        }

        if (data.recommendations.length > 0) {
          nextMessages.push({
            role: 'model',
            text: isAr ? 'موصى بها لك:' : 'Recommended For You:',
            products: data.recommendations.slice(0, 3),
            timestamp: new Date(),
          });
        }

        if (hasIncompleteQuiz) {
          nextMessages.push({
            role: 'model',
            text: isAr
              ? data.quizStatus?.progressLabelAr || 'لديك اختبار قهوة غير مكتمل. يمكنك المتابعة من حيث توقفت.'
              : data.quizStatus?.progressLabelEn || 'You have an unfinished coffee quiz. Continue where you left off.',
            timestamp: new Date(),
          });
        }

        nextMessages.push(buildOpeningActionMessage(isAr, hasIncompleteQuiz, hasProfileData, !!passportProfile));
        setMessages(nextMessages);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadOpenPersonalization();
    return () => {
      cancelled = true;
    };
  }, [currentRegion.code, isAr, isAuthenticated, language, isOpen, user]);

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

  const addCartReadyItems = useCallback(async (
    items: Array<{ productId: number; productVariantId: number | null; quantity: number }>,
    sources = new Map<string, { name?: string; image?: string | null; price?: number; tastingNotes?: string; variantName?: string }>(),
  ) => {
    let added = 0;
    for (const item of items) {
      const source = sources.get(`${item.productId}-${item.productVariantId ?? ''}`) ?? sources.get(`${item.productId}`);
      const cartItem = await personalizationService.buildCartItem(item, source);
      if (!cartItem) continue;
      addToCart(cartItem, item.quantity || 1);
      added += 1;
    }

    if (added > 0) {
      openCart();
      setMessages((prev) => [...prev, { role: 'model', text: localizedText('cartAdded'), timestamp: new Date() }]);
    }
  }, [addToCart, localizedText, openCart]);

  const startQuiz = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!personalizationService.isEnabled()) {
        setQuizSessionId(LOCAL_QUIZ_SESSION_ID);
        setQuizQuestions(LOCAL_QUIZ_QUESTIONS);
        setQuizIndex(0);
        setLocalQuizAnswers([]);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: localizedText('quizStart'),
            quizQuestion: LOCAL_QUIZ_QUESTIONS[0],
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const quiz = await personalizationService.startCoffeeQuiz({
        customerId: isAuthenticated ? user?.id : undefined,
        language,
        country: currentRegion.code,
      });
      const firstQuestion = quiz.questions[0];
      setQuizSessionId(quiz.quizSessionId);
      setQuizQuestions(quiz.questions);
      setQuizIndex(0);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: localizedText('quizStart'),
          quizQuestion: firstQuestion,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: localizedText('genericError'), timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [currentRegion.code, isAuthenticated, language, localizedText, user]);

  const continueQuiz = useCallback(async () => {
    const nextQuestion = openingQuizStatus?.nextQuestion;
    const nextSessionId = openingQuizStatus?.quizSessionId;

    if (nextQuestion && nextSessionId) {
      setQuizSessionId(nextSessionId);
      setQuizQuestions([nextQuestion]);
      setQuizIndex(0);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: isAr ? nextQuestion.textAr : nextQuestion.textEn,
          quizQuestion: nextQuestion,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    await startQuiz();
  }, [isAr, openingQuizStatus, startQuiz]);

  const handleQuizAnswer = useCallback(async (questionKey: string, option: CoffeeQuizOption) => {
    if (!quizSessionId) return;

    const selectedLabel = isAr ? option.labelAr : option.labelEn;
    setMessages((prev) => [...prev, { role: 'user', text: selectedLabel, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      if (quizSessionId === LOCAL_QUIZ_SESSION_ID) {
        const nextAnswers = [...localQuizAnswers, option.value];
        const nextIndex = quizIndex + 1;
        const nextQuestion = quizQuestions[nextIndex];
        setLocalQuizAnswers(nextAnswers);

        if (nextQuestion) {
          setQuizIndex(nextIndex);
          setMessages((prev) => [
            ...prev,
            { role: 'model', text: isAr ? nextQuestion.textAr : nextQuestion.textEn, quizQuestion: nextQuestion, timestamp: new Date() },
          ]);
          return;
        }

        const prompt = buildLocalQuizSearchPrompt(nextAnswers);
        const usedFallback = await appendFallbackResponse(prompt);
        if (!usedFallback) {
          setMessages((prev) => [...prev, { role: 'model', text: localizedText('quizDone'), timestamp: new Date() }]);
        }
        setQuizSessionId(null);
        setQuizQuestions([]);
        setQuizIndex(0);
        setLocalQuizAnswers([]);
        return;
      }

      await personalizationService.answerCoffeeQuiz(quizSessionId, questionKey, option.value);
      const nextIndex = quizIndex + 1;
      const nextQuestion = quizQuestions[nextIndex];

      if (nextQuestion) {
        setQuizIndex(nextIndex);
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: isAr ? nextQuestion.textAr : nextQuestion.textEn, quizQuestion: nextQuestion, timestamp: new Date() },
        ]);
        return;
      }

      const recommendations = await personalizationService.completeCoffeeQuiz(quizSessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `${isAr ? recommendations.titleAr || recommendations.title : recommendations.title}\n\n${isAr ? recommendations.summaryAr || recommendations.summary || localizedText('quizDone') : recommendations.summary || localizedText('quizDone')}`,
          products: recommendations.products,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: localizedText('genericError'), timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [appendFallbackResponse, isAr, localQuizAnswers, localizedText, quizIndex, quizQuestions, quizSessionId]);

  const createBundle = useCallback(async (messageText: string) => {
    setIsLoading(true);
    try {
      if (!personalizationService.isEnabled()) {
        const usedFallback = await appendFallbackResponse(messageText);
        if (!usedFallback) {
          setMessages((prev) => [...prev, { role: 'model', text: localizedText('genericError'), timestamp: new Date() }]);
        }
        return;
      }

      const bundle = await personalizationService.createBundle({
        customerId: isAuthenticated ? user?.id : undefined,
        language,
        country: currentRegion.code,
        message: messageText,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: localizedText('bundleIntro'), bundle, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: localizedText('genericError'), timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [appendFallbackResponse, currentRegion.code, isAuthenticated, language, localizedText, user]);

  const handleBundleRefine = useCallback(async (bundle: AIBundleResponse, action: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: action, timestamp: new Date() }]);
    setIsLoading(true);
    try {
      const refined = await personalizationService.refineBundle(bundle.bundleId, action, language);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: localizedText('bundleIntro'), bundle: refined, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: localizedText('genericError'), timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [language, localizedText]);

  const handleBundleAddToCart = useCallback(async (bundle: AIBundleResponse) => {
    const cartItems = await personalizationService.addBundleToCart(bundle.bundleId).catch(() => []);
    const sources = new Map<string, { name?: string; image?: string | null; price?: number; tastingNotes?: string; variantName?: string }>();

    bundle.products.forEach((product) => {
      const key = `${product.productId}-${product.productVariantId ?? ''}`;
      sources.set(key, {
        name: isAr ? product.nameAr || product.nameEn : product.nameEn,
        image: product.image,
        price: product.priceValue,
        tastingNotes: isAr ? product.roleAr || product.roleEn : product.roleEn,
      });
      sources.set(`${product.productId}`, sources.get(key)!);
    });

    await addCartReadyItems(cartItems, sources);
  }, [addCartReadyItems, isAr]);

  const handleReorderAction = useCallback(async (suggestion: SmartReorderSuggestion, action: 'reorder' | 'snooze' | 'dismiss') => {
    setIsLoading(true);
    try {
      if (action === 'reorder') {
        const items = await personalizationService.reorder(suggestion.suggestionId, user?.id);
        const sources = new Map<string, { name?: string; image?: string | null; price?: number }>();
        sources.set(`${suggestion.productId}-${suggestion.productVariantId ?? ''}`, {
          name: isAr ? suggestion.nameAr || suggestion.nameEn : suggestion.nameEn,
          image: suggestion.image,
        });
        await addCartReadyItems(items, sources);
      } else if (action === 'snooze') {
        await personalizationService.snoozeReorder(suggestion.suggestionId, user?.id);
        setMessages((prev) => [...prev, { role: 'model', text: localizedText('reorderSnoozed'), timestamp: new Date() }]);
      } else {
        await personalizationService.dismissReorder(suggestion.suggestionId, user?.id);
        setMessages((prev) => [...prev, { role: 'model', text: localizedText('reorderDismissed'), timestamp: new Date() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: localizedText('genericError'), timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [addCartReadyItems, isAr, localizedText, user]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    personalizationService.trackEvent({
      eventType: 'chatbot_message',
      customerId: isAuthenticated ? user?.id : undefined,
      language,
      country: currentRegion.code,
      source: 'chatbot',
      metadata: { message: messageText },
    });
    if (GIFT_PATTERN.test(messageText)) {
      personalizationService.trackEvent({
        eventType: 'gift_interest',
        customerId: isAuthenticated ? user?.id : undefined,
        language,
        country: currentRegion.code,
        source: 'chatbot',
      });
    }
    if (WHOLESALE_PATTERN.test(messageText)) {
      personalizationService.trackEvent({
        eventType: 'wholesale_interest',
        customerId: isAuthenticated ? user?.id : undefined,
        language,
        country: currentRegion.code,
        source: 'chatbot',
      });
    }

    if (UNKNOWN_COFFEE_PATTERN.test(messageText)) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text: messageText, timestamp: new Date() }]);
      await startQuiz();
      return;
    }

    if (personalizationService.isEnabled() && BUNDLE_PATTERN.test(messageText)) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text: messageText, timestamp: new Date() }]);
      await createBundle(toBundlePrompt(messageText));
      return;
    }

    if (FRUITY_COFFEE_PATTERN.test(messageText)) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text: messageText, timestamp: new Date() }]);
      setIsLoading(true);

      const usedFallback = await appendFallbackResponse(messageText);
      if (!usedFallback) {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: isAr ? '\u0625\u0644\u064a\u0643 \u0628\u0639\u0636 \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629:' : 'Here are some suitable suggestions:', timestamp: new Date() },
        ]);
      }

      setIsLoading(false);
      return;
    }

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
      const { text: responseText, products } = await session.sendMessage(
        messageText,
        currentRegion.code,
        buildProfileContext(profile, isAr),
      );

      if (products.length === 0 && NO_PRODUCTS_RESPONSE_PATTERN.test(responseText)) {
        const usedFallback = await appendFallbackResponse(messageText);
        if (usedFallback) return;
      }

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
  }, [
    appendFallbackResponse,
    createBundle,
    currentRegion.code,
    input,
    isAr,
    isAuthenticated,
    isLoading,
    language,
    localizedText,
    profile,
    retryAfter,
    startQuiz,
    user,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = useCallback(() => {
    session.reset();
    setQuizSessionId(null);
    setQuizQuestions([]);
    setQuizIndex(0);
    setLocalQuizAnswers([]);
    openPersonalizationLoadedRef.current = false;
    setMessages([
      { role: 'model', text: isAr ? WELCOME_MESSAGES.ar : WELCOME_MESSAGES.en, timestamp: new Date() },
      buildOpeningActionMessage(isAr, false, false),
    ]);
  }, [isAr]);

  const handleSupportClick = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: buildContactMessage(currentRegion.code, isAr),
        timestamp: new Date(),
      },
    ]);
  }, [currentRegion.code, isAr]);

  const handleOpeningAction = useCallback(async (intent: string) => {
    const display = {
      buildBundle: isAr ? AR_QUICK_TEXT.buildBundle : 'Build my bundle',
      espresso: isAr ? AR_QUICK_TEXT.espresso : 'Espresso',
      fruity: isAr ? AR_QUICK_TEXT.fruity : 'Fruity',
      gifts: isAr ? '\u0647\u062f\u0627\u064a\u0627 \u0642\u0647\u0648\u0629' : 'Coffee gifts',
      capsules: isAr ? AR_QUICK_TEXT.capsules : 'Capsules',
      wholesale: isAr ? AR_QUICK_TEXT.wholesale : 'Wholesale',
    };

    const runBundleIntent = async (displayText: string, backendPrompt: string) => {
      setMessages((prev) => [...prev, { role: 'user', text: displayText, timestamp: new Date() }]);
      await createBundle(backendPrompt);
    };

    if (intent === '__start_quiz__') {
      await startQuiz();
      return;
    }

    if (intent === '__continue_quiz__') {
      await continueQuiz();
      return;
    }

    if (intent === '__view_passport__') {
      // Navigate to Coffee Passport page or show full profile
      window.location.href = '/my-account?tab=coffee-passport';
      return;
    }

    if (intent === '__build_bundle__') {
      await runBundleIntent(display.buildBundle, 'Build my bundle');
      return;
    }

    if (intent === '__espresso__') {
      await runBundleIntent(display.espresso, 'Espresso coffee bundle');
      return;
    }

    if (intent === '__gifts__') {
      await runBundleIntent(display.gifts, 'Coffee gifts bundle');
      return;
    }

    if (intent === '__capsules__') {
      await runBundleIntent(display.capsules, 'Coffee capsules bundle');
      return;
    }

    if (intent === '__wholesale__') {
      await runBundleIntent(display.wholesale, 'Wholesale coffee bundle');
      return;
    }

    if (intent === '__fruity__') {
      await handleSend(isAr ? '\u0642\u0647\u0648\u0629 \u0628\u0646\u0643\u0647\u0627\u062a \u0641\u0627\u0643\u0647\u064a\u0629' : 'Fruity coffee');
      return;
    }

    if (intent === '__contact__') {
      handleSupportClick();
      return;
    }

    await handleSend(intent);
  }, [continueQuiz, createBundle, handleSend, handleSupportClick, isAr, startQuiz]);

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
                      onQuizAnswer={handleQuizAnswer}
                      onBundleRefine={handleBundleRefine}
                      onBundleAddToCart={handleBundleAddToCart}
                      onReorderAction={handleReorderAction}
                      onOpeningAction={handleOpeningAction}
                    />
                  ))}

                  {isLoading && <TypingIndicator language={language} />}

                  {showSuggestions && (
                    <div className="px-3 pt-3" dir={isAr ? 'rtl' : 'ltr'}>
                      <div className="grid grid-cols-2 gap-1.5">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="min-w-0 truncate rounded-full border border-[#f2ddd8] bg-white/85 px-2.5 py-2 text-[11px] font-semibold text-[#8e4e47] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e9b8b0] hover:bg-[#fff1ed]"
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
                      const isSupport = item.enTitle === 'Customer support';
                      const TileComponent = isSupport ? 'button' : 'div';
                      return (
                        <TileComponent
                          key={item.enTitle}
                          type={isSupport ? 'button' : undefined}
                          onClick={isSupport ? handleSupportClick : undefined}
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
                        </TileComponent>
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

