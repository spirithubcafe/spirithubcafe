# 🚀 Aramex Pickup Implementation - Setup Guide

## Quick Start (5 Minutes)

### 1. Import Component in OrderDetailPage
```tsx
import { AramexPickupInfo } from '../components/admin/AramexPickupInfo';
```

### 2. Add Component Below Shipping Card
```tsx
{/* After Shipping Information Card */}
<AramexPickupInfo 
  order={order}
  isArabic={language === 'ar'}
  onPickupCancelled={() => loadOrderDetails()}
/>
```

### 3. Done! ✅

The component will automatically:
- Show only for Aramex orders (shippingMethod === 3)
- Display pickup reference and GUID
- Provide copy and cancel functionality
- Show appropriate warnings

---

## What You Get

### 📦 3 Ready-to-Use Components

1. **AramexPickupInfo** - Full pickup display in order details
2. **PickupStatusBadge** - Compact badge for order lists  
3. **AramexPickupManagement** - Admin page for pickup search

### 🔌 2 API Functions

1. **cancelAramexPickup(guid)** - Cancel a pickup
2. **getPickupDetails(guid)** - Get pickup information

### 📚 Complete Documentation

- **ARAMEX_PICKUP_CLIENT_IMPLEMENTATION.md** - Full Persian guide
- **ARAMEX_PICKUP_QUICK_REFERENCE.md** - English reference
- **CLIENT_ARAMEX_PICKUP_GUIDE.md** - Original requirements

---

## Component Examples

### In Order Details Page
```tsx
<AramexPickupInfo 
  order={order}
  isArabic={isArabic}
  onPickupCancelled={handleReload}
/>
```

### In Order List
```tsx
<PickupStatusBadge
  hasPickup={!!order.pickupReference}
  hasTracking={!!order.trackingNumber}
  isAramex={order.shippingMethod === 3}
  pickupReference={order.pickupReference}
  compact
/>
```

### Standalone Admin Page
```tsx
import { AramexPickupManagement } from '../components/admin/AramexPickupManagement';

<AramexPickupManagement />
```

---

## API Usage

### Cancel Pickup
```typescript
import { cancelAramexPickup } from '../services/aramexService';

const response = await cancelAramexPickup(pickupGUID);
if (response.success) {
  // Pickup cancelled
}
```

### Get Pickup Details
```typescript
import { getPickupDetails } from '../services/aramexService';

const response = await getPickupDetails(pickupGUID);
if (response.success) {
  console.log(response.data.pickupReference);
}
```

---

## Features

✅ **Display** - Show pickup reference and GUID  
✅ **Copy** - Copy to clipboard with visual feedback  
✅ **Cancel** - Cancel pickup with confirmation dialog  
✅ **Warnings** - Alert when shipment exists without pickup  
✅ **Tracking** - Direct link to Aramex tracking  
✅ **RTL** - Full Arabic/RTL support  
✅ **Error Handling** - Comprehensive error messages  

---

## Visual States

| Status | Display | Action |
|--------|---------|--------|
| ✅ Pickup Active | Green card with reference | Can cancel |
| ⚠️ Missing Pickup | Orange warning | Contact support |
| ❌ Not Created | Gray placeholder | Create shipment |

---

## Backend Requirements

Make sure your backend returns these fields in Order:

```typescript
{
  id: number,
  orderNumber: string,
  shippingMethod: number,  // 3 = Aramex
  trackingNumber?: string,
  pickupReference?: string,  // e.g., "PKP-12345678"
  pickupGUID?: string       // e.g., "a1b2c3d4-..."
}
```

And provides these endpoints:

- `POST /api/aramex/cancel-pickup` - Cancel pickup
- `GET /api/aramex/pickup/{guid}` - Get pickup details

---

## Styling

Uses Shadcn/UI components with Tailwind CSS:
- Green theme for successful pickups
- Orange warnings for issues
- Consistent with existing design system

---

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive
- ✅ RTL support for Arabic
- ✅ Clipboard API required for copy function

---

## Troubleshooting

### Component Not Showing?
- Check if `order.shippingMethod === 3`
- Verify order object is loaded

### Copy Not Working?
- Requires HTTPS or localhost
- Check browser clipboard permissions

### Cancel Fails?
- Verify `order.pickupGUID` exists
- Check backend API endpoint

---

## File Structure

```
src/
├── components/
│   └── admin/
│       ├── AramexPickupInfo.tsx          ← Main component
│       ├── PickupStatusBadge.tsx         ← List badge
│       └── AramexPickupManagement.tsx    ← Admin page
├── pages/
│   ├── OrderDetailPage.tsx               ← Integrated here
│   └── AramexPickupManagementPage.tsx    ← Optional admin page
├── services/
│   ├── aramexService.ts                  ← API functions
│   └── index.ts                          ← Exports
└── types/
    └── order.ts                          ← Updated interface
```

---

## Next Steps

1. ✅ Import component in OrderDetailPage
2. ✅ Add to UI after shipping info
3. ✅ Test with Aramex order
4. ✅ Verify copy and cancel work
5. ✅ Deploy to production

---

## Support

📖 **Full Documentation:** See `ARAMEX_PICKUP_CLIENT_IMPLEMENTATION.md`  
🔍 **Quick Reference:** See `ARAMEX_PICKUP_QUICK_REFERENCE.md`  
📋 **Original Guide:** See `CLIENT_ARAMEX_PICKUP_GUIDE.md`

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** January 9, 2026
