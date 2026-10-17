# Coffee Passport Integration - Frontend Implementation Guide

## Overview
This guide outlines the complete implementation of the Coffee Passport feature for the Spirit Hub Cafe application, including chatbot integration, account page, and purchase celebration flow.

## Completed Components & Services

### 1. Coffee Passport Service (`src/services/coffeePassportService.ts`)
**Status**: ✅ CREATED

Core service for Coffee Passport API integration:
- `getProfile()` - Fetch user's Coffee Passport profile
- `recordDiscovery()` - Record a new coffee discovery
- `unlockAchievement()` - Unlock an achievement
- `getJourneyTimeline()` - Fetch user's coffee journey timeline

**API Endpoint Expected**: `GET /api/coffee-passport/profile`

**Data Structure**:
```typescript
interface CoffeePassportProfile {
  customerId: number;
  countriesExplored: number;
  countriesList?: string[];
  countriesFlags?: Record<string, string>;
  coffeesTried: number;
  processesExplored: string[];
  achievements: Achievement[];
  latestDiscovery?: LatestDiscovery;
  tastingNotes: string[];
  productsTried: number;
  journeyTimeline: JourneyEvent[];
  joinDate: string;
  totalPoints: number;
  nextMilestone?: {
    titleEn: string;
    titleAr: string;
    progress: number;
    target: number;
  };
}
```

### 2. Chatbot Card Component (`src/components/chatbot/CoffeePassportCard.tsx`)
**Status**: ✅ CREATED

Displays Coffee Passport summary when user opens chatbot while logged in.

**Features**:
- Shows 4 main stats: Countries Explored, Coffees Tried, Achievements, Processes
- Displays latest discovery with product image and origin
- Shows next milestone with progress bar
- "View My Coffee Passport" button
- Animated with Framer Motion
- Fully bilingual (English/Arabic)

**Usage in Chatbot**:
The card is automatically displayed as an opening message when:
- User is logged in
- Chatbot opens
- Coffee Passport profile is available

### 3. Coffee Passport Section (`src/components/pages/CoffeePassportSection.tsx`)
**Status**: ✅ CREATED

Full-featured Coffee Passport page section showing:
- Country & process exploration stats
- Tasting notes collection
- Achievements gallery
- Journey timeline with events
- Member stats (join date, total points)
- Next milestone with progress tracking

**Features**:
- Responsive grid layout
- Animated timeline visualization
- Badge-based filtering for notes and processes
- Loading and error states
- Full internationalization

### 4. ChatBot Integration
**Status**: ✅ MODIFIED

**Changes Made**:
- Added Coffee Passport profile fetching in opening personalization
- Shows Coffee Passport card in opening message sequence
- Added "View My Coffee Passport" button to quick actions
- Handles `__view_passport__` intent to navigate to profile page
- URL: `/my-account?tab=coffee-passport`

**Flow**:
```
User logs in → Opens Chatbot
    ↓
Fetch personalization + Coffee Passport profile
    ↓
Display welcome message + Coffee Passport card
    ↓
User clicks "View My Coffee Passport" button
    ↓
Navigate to /my-account?tab=coffee-passport
```

### 5. Profile Page Integration
**Status**: ✅ MODIFIED

**Changes Made**:
- Added "Coffee Passport" tab to My Account page
- Integrated CoffeePassportSection component
- Added URL parameter handling for direct tab navigation
- Icon: Coffee icon
- Labels: 'جواز القهوة' (AR) / 'Passport' (EN)

**Accessing the Tab**:
- Direct link: `/my-account?tab=coffee-passport`
- From chatbot: Click "View My Coffee Passport" button
- From profile sidebar: Click "Passport" tab

### 6. Purchase Celebration Modal (`src/components/cart/PurchaseCelebration.tsx`)
**Status**: ✅ CREATED

Animated celebration message shown after purchase completion.

**Features**:
- Trophy and sparkle animations
- Product name display
- Bilingual support
- Auto-closes on button click or backdrop click
- Smooth scale and fade animations

**Props**:
```typescript
interface PurchaseCelebrationProps {
  isOpen: boolean;
  isArabic: boolean;
  productName?: string;
  onClose: () => void;
}
```

**Usage Example**:
```typescript
const [showCelebration, setShowCelebration] = useState(false);
const [purchasedProduct, setPurchasedProduct] = useState<string>('');

// After order completion
const handleOrderSuccess = (productName: string) => {
  setPurchasedProduct(productName);
  setShowCelebration(true);
};

return (
  <PurchaseCelebration
    isOpen={showCelebration}
    isArabic={language === 'ar'}
    productName={purchasedProduct}
    onClose={() => setShowCelebration(false)}
  />
);
```

## Backend Requirements

### API Endpoint: GET /api/coffee-passport/profile

**Request Headers**:
- `Authorization: Bearer {token}`
- `Accept-Language: {locale}` (en or ar)

**Response**:
```json
{
  "customerId": 123,
  "countriesExplored": 4,
  "countriesList": ["Ethiopia", "Colombia", "Kenya", "Vietnam"],
  "countriesFlags": {
    "Ethiopia": "🇪🇹",
    "Colombia": "🇨🇴",
    "Kenya": "🇰🇪",
    "Vietnam": "🇻🇳"
  },
  "coffeesTried": 12,
  "processesExplored": ["Washed", "Natural", "Honey"],
  "achievements": [
    {
      "id": "first_purchase",
      "titleEn": "First Coffee",
      "titleAr": "أول قهوة",
      "descriptionEn": "Purchased your first coffee",
      "descriptionAr": "شراء قهوتك الأولى",
      "icon": "☕",
      "unlockedDate": "2024-01-15T10:30:00Z"
    }
  ],
  "latestDiscovery": {
    "productId": 42,
    "nameEn": "Ethiopian Yirgacheffe",
    "nameAr": "إثيوبي يرجاتشيفي",
    "originEn": "Ethiopia",
    "originAr": "إثيوبيا",
    "originFlag": "🇪🇹",
    "tasteNotesEn": ["Fruity", "Floral", "Strawberry"],
    "tasteNotesAr": ["فاكهي", "زهري", "فراولة"],
    "processEn": "Washed",
    "processAr": "مغسول",
    "discoveredDate": "2024-06-20T14:22:00Z",
    "productImage": "https://images.example.com/product-42.jpg"
  },
  "tastingNotes": ["Fruity", "Floral", "Chocolate", "Nutty"],
  "productsTried": 12,
  "journeyTimeline": [
    {
      "id": "evt_001",
      "eventType": "discovery",
      "titleEn": "Discovered Ethiopian Yirgacheffe",
      "titleAr": "اكتشاف إثيوبي يرجاتشيفي",
      "descriptionEn": "Added to your Coffee Passport",
      "descriptionAr": "تم إضافته إلى جواز القهوة الخاص بك",
      "date": "2024-06-20T14:22:00Z",
      "icon": "🔍"
    }
  ],
  "joinDate": "2023-12-01T00:00:00Z",
  "totalPoints": 1250,
  "nextMilestone": {
    "titleEn": "Explore 5 Countries",
    "titleAr": "استكشف 5 دول",
    "progress": 4,
    "target": 5
  }
}
```

### Additional Endpoints (Optional)

**POST /api/coffee-passport/discoveries**
- Record a new coffee discovery after purchase

**POST /api/coffee-passport/achievements/{achievementId}/unlock**
- Unlock an achievement manually

**GET /api/coffee-passport/journey-timeline**
- Get user's journey timeline (paginated)

## Frontend Implementation Checklist

- [x] Create `coffeePassportService.ts` with API integration
- [x] Create `CoffeePassportCard.tsx` for chatbot display
- [x] Create `CoffeePassportSection.tsx` for profile page
- [x] Create `PurchaseCelebration.tsx` modal component
- [x] Integrate Coffee Passport card in ChatBot component
- [x] Add Coffee Passport tab to ProfilePage
- [x] Add URL parameter handling for tab navigation
- [x] Implement all English and Arabic translations

## Where to Integrate Purchase Celebration

The `PurchaseCelebration` component should be integrated in:

1. **Order Confirmation Page** (`src/pages/OrderConfirmationPage.tsx` or similar)
   - Show after successful payment
   - Display the product name that was purchased

2. **Cart Checkout Flow** 
   - After order placement
   - Show in the success message

3. **Payment Completion Handler**
   - In the payment success callback
   - Pass product details to show in celebration

**Example Integration**:
```typescript
// In order confirmation or payment success handler
const handlePaymentSuccess = async (orderData: Order) => {
  // Get first product name from order
  const productName = orderData.items?.[0]?.productName;
  
  // Show celebration
  setShowCelebration(true);
  setPurchasedProduct(productName);
  
  // After 3 seconds, navigate to Coffee Passport
  setTimeout(() => {
    navigate('/my-account?tab=coffee-passport');
  }, 3000);
};
```

## User Experience Flow

### Scenario: New Customer Opens Chatbot

```
1. Customer logs in
2. Opens chatbot
3. Chatbot loads opening personalization
4. Coffee Passport profile is fetched
5. Welcome message + Coffee Passport card displayed
6. Stats show: 4 countries, 12 coffees, 2 achievements
7. Latest discovery card shows recently purchased coffee
8. "View My Coffee Passport" button available
9. Customer clicks button → navigates to /my-account?tab=coffee-passport
```

### Scenario: Customer Makes a Purchase

```
1. Customer adds coffee to cart
2. Completes checkout
3. Payment succeeds
4. 🏆 "New Discovery Unlocked!" celebration modal appears
5. Shows product name and motivational message
6. Customer clicks "Awesome!" button
7. (Optional) Redirects to Coffee Passport to see updated stats
```

## Internationalization

All components support English and Arabic:

**Chatbot Opening**:
- EN: "Welcome back 👋 Your Coffee Passport"
- AR: "مرحباً بعودتك 👋 جواز القهوة الخاص بك"

**Tab Label**:
- EN: "Passport"
- AR: "جواز القهوة"

**Button Label**:
- EN: "View My Coffee Passport"
- AR: "عرض جواز القهوة"

**Celebration Message**:
- EN: "🏆 New Discovery Unlocked!"
- AR: "🏆 اكتشاف جديد!"

## Styling & Design Notes

- **Color Scheme**: Amber/Orange gradient (coffee theme)
- **Icons**: Using `lucide-react` library
- **Animations**: Framer Motion for smooth transitions
- **Dark Mode**: Full dark mode support with Tailwind CSS
- **Responsive**: Mobile-first responsive design

## Performance Considerations

- Coffee Passport profile is fetched once when chatbot opens
- Caching implemented in service layer
- Lazy loading of timeline events
- Optimized animations with `will-change` CSS

## Error Handling

All components include:
- Loading states
- Error messages (bilingual)
- Graceful fallbacks
- Retry mechanisms

## Testing Recommendations

1. **Unit Tests**:
   - Test Coffee Passport service methods
   - Mock API responses
   - Test bilingual text rendering

2. **Integration Tests**:
   - Test chatbot card display
   - Test profile page tab navigation
   - Test celebration modal trigger

3. **E2E Tests**:
   - Full user journey from login to Coffee Passport view
   - Purchase → Celebration → Profile navigation
   - URL parameter handling

## Notes for Backend Team

- Ensure Coffee Passport profile is populated with user data
- Implement achievement unlock logic based on purchase history
- Track countries and processes based on purchased products
- Calculate journey timeline events
- Provide bilingual responses based on `Accept-Language` header

## Support & Documentation

For questions or issues:
1. Check Coffee Passport service documentation
2. Review component prop interfaces
3. Test with mock API data
4. Check console for API errors

---

**Last Updated**: June 2026
**Version**: 1.0
