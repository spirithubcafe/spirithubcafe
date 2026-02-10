# WhatsApp Message Templates & Gift Recipient Notification — Frontend Guide

> **Date:** February 10, 2026  
> **Backend version:** Latest (includes migration `20260210120000`)  
> **Auth required:** All endpoints need `Authorization: Bearer {token}` with admin permission `EmailSettingsManage`

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Endpoints — Message Templates](#2-api-endpoints--message-templates)
3. [API Endpoints — Notification Settings (Updated)](#3-api-endpoints--notification-settings-updated)
4. [TypeScript Interfaces](#4-typescript-interfaces)
5. [Template Placeholders Reference](#5-template-placeholders-reference)
6. [React Components](#6-react-components)
7. [Custom Hooks](#7-custom-hooks)
8. [Gift Recipient Notification Flow](#8-gift-recipient-notification-flow)

---

## 1. Overview

### What Changed

1. **WhatsApp Message Templates** — All WhatsApp notification messages are now stored in the database as editable templates. Admins can edit message text, toggle templates on/off, and preview messages with sample data — all from the frontend.

2. **Gift Recipient WhatsApp Notification** — When a customer places a gift order (`isGift: true`) and provides the recipient's phone number (`giftRecipientPhone`), the system automatically sends a WhatsApp message to the gift recipient.

3. **New Notification Toggle** — `customerGiftRecipientEnabled` has been added to the WhatsApp notification settings to enable/disable gift recipient notifications.

### Template System

Templates use `{Placeholder}` syntax. When a notification is sent, placeholders are replaced with actual values. Example:

```
🛒 *Order Confirmed*

Order: *{OrderNumber}*
Total: *{TotalAmount} {Currency}*

Thank you for your order!
```

Becomes:

```
🛒 *Order Confirmed*

Order: *ORD-2026-001234*
Total: *12.500 OMR*

Thank you for your order!
```

---

## 2. API Endpoints — Message Templates

**Base URL:** `/api/whatsapp-message-templates`

### 2.1 List All Templates

```http
GET /api/whatsapp-message-templates
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "templateKey": "OrderConfirmation",
      "name": "Order Confirmation",
      "description": "Sent to customer when order is placed",
      "isActive": true,
      "language": "en",
      "updatedAt": "2026-02-10T12:00:00Z"
    },
    {
      "id": 2,
      "templateKey": "GiftRecipientNotification",
      "name": "Gift Recipient Notification",
      "description": "Sent to gift recipient when a gift order is placed for them",
      "isActive": true,
      "language": "en",
      "updatedAt": "2026-02-10T12:00:00Z"
    }
  ]
}
```

### 2.2 Get Template by ID

```http
GET /api/whatsapp-message-templates/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "templateKey": "GiftRecipientNotification",
    "name": "Gift Recipient Notification",
    "description": "Sent to gift recipient when a gift order is placed for them",
    "body": "🎁 *You've Received a Gift!*\n\nHello *{RecipientName}*,\n\nSomeone special has sent you a gift from SpiritHub Roastery!\n\n{GiftMessage}\n\nOrder: *{OrderNumber}*\n\nWe'll deliver your gift soon. Stay tuned!\n\n_SpiritHub Roastery_",
    "availablePlaceholders": "RecipientName,GiftMessage,OrderNumber,SenderName",
    "isActive": true,
    "language": "en",
    "createdAt": "2026-02-10T12:00:00Z",
    "updatedAt": "2026-02-10T12:00:00Z"
  }
}
```

### 2.3 Get Template by Key

```http
GET /api/whatsapp-message-templates/by-key/{templateKey}
Authorization: Bearer {token}
```

Example: `GET /api/whatsapp-message-templates/by-key/OrderConfirmation`

Response same shape as Get by ID.

### 2.4 Create Template

```http
POST /api/whatsapp-message-templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateKey": "CustomPromotion",
  "name": "Custom Promotion",
  "description": "Special promotion message",
  "body": "🎉 *Special Offer!*\n\nHello *{CustomerName}*,\n\n{PromoMessage}\n\n_SpiritHub Roastery_",
  "availablePlaceholders": "CustomerName,PromoMessage",
  "isActive": true,
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 14,
    "templateKey": "CustomPromotion",
    "name": "Custom Promotion",
    "description": "Special promotion message",
    "body": "🎉 *Special Offer!*\n\nHello *{CustomerName}*,\n\n{PromoMessage}\n\n_SpiritHub Roastery_",
    "availablePlaceholders": "CustomerName,PromoMessage",
    "isActive": true,
    "language": "en",
    "createdAt": "2026-02-10T14:00:00Z",
    "updatedAt": "2026-02-10T14:00:00Z"
  },
  "message": "Template created successfully."
}
```

### 2.5 Update Template

```http
PUT /api/whatsapp-message-templates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateKey": "OrderConfirmation",
  "name": "Order Confirmation",
  "description": "Sent to customer when order is placed",
  "body": "🛒 *Your Order is Confirmed!*\n\nHi there! 👋\n\nOrder: *{OrderNumber}*\nTotal: *{TotalAmount} {Currency}*\n\nWe're preparing your order with love ❤️\n\n_SpiritHub Roastery_",
  "availablePlaceholders": "OrderNumber,TotalAmount,Currency",
  "isActive": true,
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Template updated successfully."
}
```

### 2.6 Delete Template

```http
DELETE /api/whatsapp-message-templates/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully."
}
```

### 2.7 Reset Template to Default

Resets the template body back to the original hardcoded default.

```http
POST /api/whatsapp-message-templates/{id}/reset
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "templateKey": "OrderConfirmation",
    "body": "🛒 *Order Confirmed*\n\nOrder: *{OrderNumber}*\nTotal: *{TotalAmount} {Currency}*\n\nThank you for your order! We'll notify you when it ships.\n\n_SpiritHub Roastery_",
    ...
  },
  "message": "Template reset to default successfully."
}
```

### 2.8 Preview Template

Renders a template body with provided sample data (does not save anything).

```http
POST /api/whatsapp-message-templates/preview
Authorization: Bearer {token}
Content-Type: application/json

{
  "body": "🛒 *Order Confirmed*\n\nOrder: *{OrderNumber}*\nTotal: *{TotalAmount} {Currency}*",
  "sampleData": {
    "OrderNumber": "ORD-2026-001234",
    "TotalAmount": "12.500",
    "Currency": "OMR"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rendered": "🛒 *Order Confirmed*\n\nOrder: *ORD-2026-001234*\nTotal: *12.500 OMR*"
  }
}
```

---

## 3. API Endpoints — Notification Settings (Updated)

> The notification settings endpoint now includes `customerGiftRecipientEnabled`.

### 3.1 Get Settings

```http
GET /api/whatsapp-notification-settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isEnabled": true,
    "adminNumbers": "96892506030,96899999999",
    "supportNumber": "96892506030",

    "customerOrderPlacedEnabled": true,
    "customerOrderStatusChangedEnabled": true,
    "customerPaymentStatusChangedEnabled": true,
    "customerShippingUpdateEnabled": true,
    "customerOrderCancelledEnabled": true,
    "customerWelcomeEnabled": true,
    "customerLoginSuccessEnabled": false,
    "customerPasswordResetEnabled": true,
    "customerPasswordChangedEnabled": true,
    "customerOtpEnabled": true,
    "customerGiftRecipientEnabled": true,

    "adminNewOrderEnabled": true,
    "adminPaymentReceivedEnabled": true,
    "adminOrderStatusChangedEnabled": true,
    "adminLowStockEnabled": true,
    "adminNewUserEnabled": true,

    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-10T12:00:00Z"
  }
}
```

### 3.2 Update Settings

```http
PUT /api/whatsapp-notification-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "isEnabled": true,
  "adminNumbers": "96892506030",
  "supportNumber": "96892506030",
  "customerOrderPlacedEnabled": true,
  "customerOrderStatusChangedEnabled": true,
  "customerPaymentStatusChangedEnabled": true,
  "customerShippingUpdateEnabled": true,
  "customerOrderCancelledEnabled": true,
  "customerWelcomeEnabled": true,
  "customerLoginSuccessEnabled": false,
  "customerPasswordResetEnabled": true,
  "customerPasswordChangedEnabled": true,
  "customerOtpEnabled": true,
  "customerGiftRecipientEnabled": true,
  "adminNewOrderEnabled": true,
  "adminPaymentReceivedEnabled": true,
  "adminOrderStatusChangedEnabled": true,
  "adminLowStockEnabled": true,
  "adminNewUserEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "WhatsApp notification settings updated."
}
```

---

## 4. TypeScript Interfaces

```typescript
// ============ Message Templates ============

export interface WhatsAppMessageTemplateDto {
  templateKey: string;      // max 100 chars, e.g. "OrderConfirmation"
  name: string;             // max 200 chars
  description?: string;     // max 500 chars
  body: string;             // max 4000 chars, the template with {Placeholders}
  availablePlaceholders?: string; // comma-separated, e.g. "OrderNumber,TotalAmount,Currency"
  isActive: boolean;
  language: string;         // "en" | "ar"
}

export interface WhatsAppMessageTemplateResponse extends WhatsAppMessageTemplateDto {
  id: number;
  createdAt: string;        // ISO 8601
  updatedAt: string;
}

export interface WhatsAppMessageTemplateListItem {
  id: number;
  templateKey: string;
  name: string;
  description?: string;
  isActive: boolean;
  language: string;
  updatedAt: string;
}

export interface WhatsAppTemplatePreviewRequest {
  body: string;
  sampleData?: Record<string, string>;
}

export interface WhatsAppTemplatePreviewResponse {
  rendered: string;
}

// ============ Notification Settings ============

export interface WhatsAppNotificationSettings {
  isEnabled: boolean;
  adminNumbers?: string;
  supportNumber?: string;

  // Customer notifications
  customerOrderPlacedEnabled: boolean;
  customerOrderStatusChangedEnabled: boolean;
  customerPaymentStatusChangedEnabled: boolean;
  customerShippingUpdateEnabled: boolean;
  customerOrderCancelledEnabled: boolean;
  customerWelcomeEnabled: boolean;
  customerLoginSuccessEnabled: boolean;
  customerPasswordResetEnabled: boolean;
  customerPasswordChangedEnabled: boolean;
  customerOtpEnabled: boolean;
  customerGiftRecipientEnabled: boolean;  // 🆕 NEW

  // Admin notifications
  adminNewOrderEnabled: boolean;
  adminPaymentReceivedEnabled: boolean;
  adminOrderStatusChangedEnabled: boolean;
  adminLowStockEnabled: boolean;
  adminNewUserEnabled: boolean;
}

export interface WhatsAppNotificationSettingsResponse extends WhatsAppNotificationSettings {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// ============ API Response Wrapper ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

---

## 5. Template Placeholders Reference

Each template has a `templateKey` and a set of supported placeholders:

| Template Key | Name | Placeholders |
|---|---|---|
| `OrderConfirmation` | Order Confirmation | `{OrderNumber}`, `{TotalAmount}`, `{Currency}` |
| `OrderStatusUpdate` | Order Status Update | `{StatusEmoji}`, `{OrderNumber}`, `{OldStatus}`, `{NewStatus}`, `{StatusText}` |
| `PaymentStatusUpdate` | Payment Status Update | `{PaymentEmoji}`, `{OrderNumber}`, `{Amount}`, `{Currency}`, `{OldStatus}`, `{NewStatus}` |
| `ShippingUpdate` | Shipping Update | `{OrderNumber}`, `{ShippingMethod}`, `{TrackingInfo}` |
| `OrderCancelled` | Order Cancelled | `{OrderNumber}` |
| `Welcome` | Welcome Message | `{DisplayName}` |
| `LoginSuccess` | Login Success | `{DisplayName}`, `{LoginTime}` |
| `PasswordReset` | Password Reset | `{ResetCode}` |
| `PasswordChanged` | Password Changed | `{ChangeTime}` |
| `GiftRecipientNotification` | Gift Recipient Notification | `{RecipientName}`, `{GiftMessage}`, `{OrderNumber}`, `{SenderName}` |
| `AdminNewOrder` | Admin - New Order | `{OrderNumber}`, `{ItemCount}`, `{TotalAmount}`, `{CustomerContact}` |
| `AdminPaymentReceived` | Admin - Payment Received | `{OrderNumber}`, `{Amount}`, `{PaymentMethod}` |
| `AdminOrderStatusChange` | Admin - Order Status Change | `{OrderNumber}`, `{OldStatus}`, `{NewStatus}` |

### WhatsApp Text Formatting

Templates support WhatsApp markdown:
- `*bold*` → **bold**
- `_italic_` → _italic_
- `~strikethrough~` → ~~strikethrough~~
- `` ```code``` `` → `code`
- `\n` → newline

---

## 6. React Components

### 6.1 API Service

```typescript
// services/whatsappTemplateApi.ts
import axios from 'axios';
import type {
  WhatsAppMessageTemplateDto,
  WhatsAppMessageTemplateResponse,
  WhatsAppMessageTemplateListItem,
  WhatsAppTemplatePreviewRequest,
  WhatsAppTemplatePreviewResponse,
  WhatsAppNotificationSettings,
  WhatsAppNotificationSettingsResponse,
  ApiResponse,
} from '../types/whatsapp';

const API_BASE = '/api/whatsapp-message-templates';
const SETTINGS_API = '/api/whatsapp-notification-settings';

// ---- Templates ----

export const getTemplates = () =>
  axios.get<ApiResponse<WhatsAppMessageTemplateListItem[]>>(API_BASE);

export const getTemplateById = (id: number) =>
  axios.get<ApiResponse<WhatsAppMessageTemplateResponse>>(`${API_BASE}/${id}`);

export const getTemplateByKey = (key: string) =>
  axios.get<ApiResponse<WhatsAppMessageTemplateResponse>>(`${API_BASE}/by-key/${key}`);

export const createTemplate = (dto: WhatsAppMessageTemplateDto) =>
  axios.post<ApiResponse<WhatsAppMessageTemplateResponse>>(API_BASE, dto);

export const updateTemplate = (id: number, dto: WhatsAppMessageTemplateDto) =>
  axios.put<ApiResponse<WhatsAppMessageTemplateResponse>>(`${API_BASE}/${id}`, dto);

export const deleteTemplate = (id: number) =>
  axios.delete<ApiResponse<void>>(`${API_BASE}/${id}`);

export const resetTemplate = (id: number) =>
  axios.post<ApiResponse<WhatsAppMessageTemplateResponse>>(`${API_BASE}/${id}/reset`);

export const previewTemplate = (req: WhatsAppTemplatePreviewRequest) =>
  axios.post<ApiResponse<WhatsAppTemplatePreviewResponse>>(`${API_BASE}/preview`, req);

// ---- Notification Settings ----

export const getNotificationSettings = () =>
  axios.get<ApiResponse<WhatsAppNotificationSettingsResponse>>(SETTINGS_API);

export const updateNotificationSettings = (dto: WhatsAppNotificationSettings) =>
  axios.put<ApiResponse<WhatsAppNotificationSettingsResponse>>(SETTINGS_API, dto);
```

### 6.2 Template List Page

```tsx
// pages/WhatsAppTemplates.tsx
import { useEffect, useState } from 'react';
import { getTemplates, deleteTemplate } from '../services/whatsappTemplateApi';
import type { WhatsAppMessageTemplateListItem } from '../types/whatsapp';
import TemplateEditor from '../components/TemplateEditor';

const TEMPLATE_ICONS: Record<string, string> = {
  OrderConfirmation: '🛒',
  OrderStatusUpdate: '📦',
  PaymentStatusUpdate: '💳',
  ShippingUpdate: '🚚',
  OrderCancelled: '❌',
  Welcome: '👋',
  LoginSuccess: '✅',
  PasswordReset: '🔐',
  PasswordChanged: '🔒',
  GiftRecipientNotification: '🎁',
  AdminNewOrder: '🆕',
  AdminPaymentReceived: '💰',
  AdminOrderStatusChange: '📦',
};

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppMessageTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await getTemplates();
      if (data.success && data.data) setTemplates(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteTemplate(id);
    fetchTemplates();
  };

  if (editingId !== null) {
    return (
      <TemplateEditor
        templateId={editingId}
        onClose={() => { setEditingId(null); fetchTemplates(); }}
      />
    );
  }

  if (creating) {
    return (
      <TemplateEditor
        templateId={null}
        onClose={() => { setCreating(false); fetchTemplates(); }}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💬 WhatsApp Message Templates</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          + New Template
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="border rounded-xl p-4 hover:border-green-400 transition-colors cursor-pointer"
              onClick={() => setEditingId(t.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {t.templateKey}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded text-white ${
                    t.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <h3 className="text-lg font-semibold mt-1">
                    {TEMPLATE_ICONS[t.templateKey] || '📝'} {t.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{t.description || 'No description'}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Language: {t.language} · Updated: {new Date(t.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                  className="text-red-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6.3 Template Editor Component

```tsx
// components/TemplateEditor.tsx
import { useEffect, useState } from 'react';
import {
  getTemplateById,
  createTemplate,
  updateTemplate,
  resetTemplate,
  previewTemplate,
} from '../services/whatsappTemplateApi';
import type { WhatsAppMessageTemplateDto } from '../types/whatsapp';

// Sample data for live preview
const SAMPLE_DATA: Record<string, string> = {
  OrderNumber: 'ORD-2026-001234',
  TotalAmount: '12.500',
  Currency: 'OMR',
  Amount: '12.500',
  StatusEmoji: '✅',
  OldStatus: 'Pending',
  NewStatus: 'Confirmed',
  StatusText: 'Your order has been confirmed!',
  PaymentEmoji: '✅',
  ShippingMethod: 'Aramex Express',
  TrackingInfo: '\nTracking: *AWB123456789*',
  DisplayName: 'Ahmed',
  LoginTime: '2026-02-10 14:30',
  ResetCode: '847291',
  ChangeTime: '2026-02-10 14:30',
  RecipientName: 'Sara',
  GiftMessage: '\n💌 *Message:* _Enjoy your coffee! ☕_\n',
  SenderName: 'Ahmed',
  ItemCount: '3',
  CustomerContact: 'customer@example.com',
  PaymentMethod: 'Credit Card',
};

interface Props {
  templateId: number | null; // null = create mode
  onClose: () => void;
}

export default function TemplateEditor({ templateId, onClose }: Props) {
  const [form, setForm] = useState<WhatsAppMessageTemplateDto>({
    templateKey: '',
    name: '',
    description: '',
    body: '',
    availablePlaceholders: '',
    isActive: true,
    language: 'en',
  });
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templateId) {
      getTemplateById(templateId).then(({ data }) => {
        if (data.success && data.data) {
          const t = data.data;
          setForm({
            templateKey: t.templateKey,
            name: t.name,
            description: t.description || '',
            body: t.body,
            availablePlaceholders: t.availablePlaceholders || '',
            isActive: t.isActive,
            language: t.language,
          });
        }
      });
    }
  }, [templateId]);

  // Live preview
  useEffect(() => {
    let rendered = form.body;
    for (const [key, value] of Object.entries(SAMPLE_DATA)) {
      rendered = rendered.replaceAll(`{${key}}`, value);
    }
    setPreview(rendered);
  }, [form.body]);

  const placeholders = (form.availablePlaceholders || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const insertPlaceholder = (tag: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + `{${tag}}` }));
  };

  const handleSave = async () => {
    if (!form.templateKey || !form.name || !form.body) {
      alert('Template Key, Name, and Body are required');
      return;
    }
    setSaving(true);
    try {
      if (templateId) {
        await updateTemplate(templateId, form);
      } else {
        await createTemplate(form);
      }
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!templateId) return;
    if (!confirm('Reset to default? Your changes will be lost.')) return;
    const { data } = await resetTemplate(templateId);
    if (data.success && data.data) {
      setForm((prev) => ({ ...prev, body: data.data!.body }));
    }
  };

  // Render WhatsApp-style preview
  const renderWhatsAppPreview = (text: string) => {
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {templateId ? '✏️ Edit Template' : '➕ New Template'}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Key</label>
              <input
                type="text"
                value={form.templateKey}
                onChange={(e) => setForm({ ...form, templateKey: e.target.value })}
                disabled={!!templateId}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., OrderConfirmation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Order Confirmation"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Available Placeholders</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {placeholders.map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertPlaceholder(tag)}
                  className="bg-yellow-100 border border-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded hover:bg-yellow-300"
                >
                  {`{${tag}}`}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.availablePlaceholders}
              onChange={(e) => setForm({ ...form, availablePlaceholders: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="OrderNumber,TotalAmount,Currency"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
              rows={10}
              placeholder="Write your template here..."
            />
            <p className="text-xs text-gray-400 mt-1">
              WhatsApp formatting: *bold*, _italic_, ~strikethrough~
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium mb-1">📱 WhatsApp Preview</label>
          <div className="bg-[#e5ddd5] rounded-xl p-5 min-h-[300px]">
            <div
              className="bg-[#dcf8c6] rounded-lg p-4 inline-block max-w-full shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderWhatsAppPreview(preview) }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <div>
          {templateId && (
            <button
              onClick={handleReset}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              ↩️ Reset to Default
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6.4 Notification Settings Component (with Gift Recipient toggle)

```tsx
// components/WhatsAppNotificationSettings.tsx
import { useEffect, useState } from 'react';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../services/whatsappTemplateApi';
import type { WhatsAppNotificationSettings } from '../types/whatsapp';

const TOGGLE_GROUPS = [
  {
    title: '🔌 General',
    toggles: [{ key: 'isEnabled', label: 'Master Switch (All Notifications)', icon: '🔌' }],
  },
  {
    title: '👤 Customer Notifications',
    toggles: [
      { key: 'customerOrderPlacedEnabled', label: 'Order Placed', icon: '🛒' },
      { key: 'customerOrderStatusChangedEnabled', label: 'Order Status Changed', icon: '📦' },
      { key: 'customerPaymentStatusChangedEnabled', label: 'Payment Status Changed', icon: '💳' },
      { key: 'customerShippingUpdateEnabled', label: 'Shipping Update', icon: '🚚' },
      { key: 'customerOrderCancelledEnabled', label: 'Order Cancelled', icon: '❌' },
      { key: 'customerWelcomeEnabled', label: 'Welcome Message', icon: '👋' },
      { key: 'customerLoginSuccessEnabled', label: 'Login Success', icon: '✅' },
      { key: 'customerPasswordResetEnabled', label: 'Password Reset', icon: '🔐' },
      { key: 'customerPasswordChangedEnabled', label: 'Password Changed', icon: '🔒' },
      { key: 'customerOtpEnabled', label: 'OTP', icon: '📲' },
      { key: 'customerGiftRecipientEnabled', label: 'Gift Recipient Notification', icon: '🎁' },
    ],
  },
  {
    title: '🛡️ Admin Notifications',
    toggles: [
      { key: 'adminNewOrderEnabled', label: 'New Order', icon: '🆕' },
      { key: 'adminPaymentReceivedEnabled', label: 'Payment Received', icon: '💰' },
      { key: 'adminOrderStatusChangedEnabled', label: 'Order Status Changed', icon: '📋' },
      { key: 'adminLowStockEnabled', label: 'Low Stock', icon: '📉' },
      { key: 'adminNewUserEnabled', label: 'New User', icon: '👤' },
    ],
  },
] as const;

export default function WhatsAppNotificationSettingsPage() {
  const [settings, setSettings] = useState<WhatsAppNotificationSettings | null>(null);
  const [adminNumbers, setAdminNumbers] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationSettings().then(({ data }) => {
      if (data.success && data.data) {
        setSettings(data.data);
        setAdminNumbers(data.data.adminNumbers || '');
        setSupportNumber(data.data.supportNumber || '');
      }
    });
  }, []);

  const handleToggle = (key: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !(settings as any)[key] });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateNotificationSettings({
        ...settings,
        adminNumbers: adminNumbers || undefined,
        supportNumber: supportNumber || undefined,
      });
      alert('Settings saved!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">⚙️ WhatsApp Notification Settings</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Admin Numbers (comma-separated)</label>
          <input
            type="text"
            value={adminNumbers}
            onChange={(e) => setAdminNumbers(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="968XXXXXXXX, 968YYYYYYYY"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Support Number</label>
          <input
            type="text"
            value={supportNumber}
            onChange={(e) => setSupportNumber(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="968XXXXXXXX"
          />
        </div>
      </div>

      {TOGGLE_GROUPS.map((group) => (
        <div key={group.title} className="mb-6">
          <h3 className="font-semibold mb-2">{group.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {group.toggles.map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(settings as any)[toggle.key] ?? false}
                  onChange={() => handleToggle(toggle.key)}
                  className="w-4 h-4 accent-green-500"
                />
                <span>
                  {toggle.icon} {toggle.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? 'Saving...' : '💾 Save Settings'}
      </button>
    </div>
  );
}
```

---

## 7. Custom Hooks

### 7.1 useWhatsAppTemplates

```typescript
// hooks/useWhatsAppTemplates.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  resetTemplate,
} from '../services/whatsappTemplateApi';
import type {
  WhatsAppMessageTemplateListItem,
  WhatsAppMessageTemplateResponse,
  WhatsAppMessageTemplateDto,
} from '../types/whatsapp';

export function useWhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppMessageTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getTemplates();
      if (data.success && data.data) setTemplates(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchOne = async (id: number): Promise<WhatsAppMessageTemplateResponse | null> => {
    const { data } = await getTemplateById(id);
    return data.success ? data.data ?? null : null;
  };

  const create = async (dto: WhatsAppMessageTemplateDto) => {
    const { data } = await createTemplate(dto);
    if (data.success) await fetchAll();
    return data;
  };

  const update = async (id: number, dto: WhatsAppMessageTemplateDto) => {
    const { data } = await updateTemplate(id, dto);
    if (data.success) await fetchAll();
    return data;
  };

  const remove = async (id: number) => {
    const { data } = await deleteTemplate(id);
    if (data.success) await fetchAll();
    return data;
  };

  const reset = async (id: number) => {
    const { data } = await resetTemplate(id);
    if (data.success) await fetchAll();
    return data;
  };

  return { templates, loading, error, fetchAll, fetchOne, create, update, remove, reset };
}
```

### 7.2 useWhatsAppSettings

```typescript
// hooks/useWhatsAppSettings.ts
import { useState, useEffect } from 'react';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../services/whatsappTemplateApi';
import type {
  WhatsAppNotificationSettings,
  WhatsAppNotificationSettingsResponse,
} from '../types/whatsapp';

export function useWhatsAppSettings() {
  const [settings, setSettings] = useState<WhatsAppNotificationSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getNotificationSettings()
      .then(({ data }) => {
        if (data.success && data.data) setSettings(data.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (dto: WhatsAppNotificationSettings) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await updateNotificationSettings(dto);
      if (data.success && data.data) setSettings(data.data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, error, save };
}
```

---

## 8. Gift Recipient Notification Flow

### How It Works

1. Customer creates an order with `isGift: true` and provides `giftRecipientPhone`
2. After the order is saved, the backend automatically:
   - Sends order confirmation to the **buyer** (as before)
   - Sends admin notification (as before)
   - **NEW**: Sends a WhatsApp message to the **gift recipient** phone number
3. The gift message uses the `GiftRecipientNotification` template
4. This can be toggled on/off via `customerGiftRecipientEnabled` in notification settings

### Order Create Request (existing — no changes needed)

```json
{
  "isGift": true,
  "giftRecipientName": "Sara",
  "giftRecipientPhone": "92506030",
  "giftRecipientEmail": "sara@example.com",
  "giftRecipientAddress": "123 Main St",
  "giftMessage": "Happy Birthday! Enjoy the coffee ☕",
  "items": [...]
}
```

### What the Gift Recipient Receives

Using the default template:

```
🎁 *You've Received a Gift!*

Hello *Sara*,

Someone special has sent you a gift from SpiritHub Roastery!

💌 *Message:* _Happy Birthday! Enjoy the coffee ☕_

Order: *ORD-2026-001234*

We'll deliver your gift soon. Stay tuned!

_SpiritHub Roastery_
```

### Conditions for Sending

The notification is sent only when **all** of these are true:
- `isGift` is `true` on the order
- `giftRecipientPhone` is not empty
- `customerGiftRecipientEnabled` is `true` in WhatsApp notification settings
- `isEnabled` (master switch) is `true` in WhatsApp notification settings

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/whatsapp-message-templates` | List all templates |
| `GET` | `/api/whatsapp-message-templates/{id}` | Get template by ID |
| `GET` | `/api/whatsapp-message-templates/by-key/{key}` | Get template by key |
| `POST` | `/api/whatsapp-message-templates` | Create template |
| `PUT` | `/api/whatsapp-message-templates/{id}` | Update template |
| `DELETE` | `/api/whatsapp-message-templates/{id}` | Delete template |
| `POST` | `/api/whatsapp-message-templates/{id}/reset` | Reset to default |
| `POST` | `/api/whatsapp-message-templates/preview` | Preview with sample data |
| `GET` | `/api/whatsapp-notification-settings` | Get notification toggles |
| `PUT` | `/api/whatsapp-notification-settings` | Update notification toggles |
