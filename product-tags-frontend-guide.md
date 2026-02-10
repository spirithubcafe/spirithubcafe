# Product Tags — Frontend Guide

> **Date:** February 10, 2026  
> **Auth required:** Admin endpoints need `Authorization: Bearer {token}` with `ProductsManage` permission  
> **Public endpoints:** Get all tags, Get by position, Get product tags

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Endpoints — Tag CRUD](#2-api-endpoints--tag-crud)
3. [API Endpoints — Tag Assignment](#3-api-endpoints--tag-assignment)
4. [Tags in Product Responses](#4-tags-in-product-responses)
5. [TypeScript Interfaces](#5-typescript-interfaces)
6. [React Implementation](#6-react-implementation)

---

## 1. Overview

Products now support **two types of display tags**:

| Position | Value | Description | Example |
|----------|-------|-------------|---------|
| **Top** | `0` | Displayed above/on top of the product card | "New Arrival", "Best Seller", "🔥 Hot" |
| **Bottom** | `1` | Displayed below the product card | "Free Shipping", "Limited Edition", "Organic" |

Each tag has:
- Bilingual name (English + Arabic)
- Background color & text color (hex)
- Optional icon (emoji or icon class)
- Sort order
- Active/inactive toggle

Tags are **reusable** — one tag can be assigned to many products, and each product can have multiple top and bottom tags.

### Data Model

```
ProductTag (1) ←→ (many) ProductProductTag (many) ←→ (1) Product
```

---

## 2. API Endpoints — Tag CRUD

**Base URL:** `/api/product-tags`

### 2.1 List All Tags

```http
GET /api/product-tags
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "New Arrival",
      "nameAr": "وصل حديثاً",
      "position": "Top",
      "positionValue": 0,
      "backgroundColor": "#FF5733",
      "textColor": "#FFFFFF",
      "icon": "🆕",
      "sortOrder": 0,
      "isActive": true,
      "productCount": 12
    },
    {
      "id": 2,
      "name": "Free Shipping",
      "nameAr": "شحن مجاني",
      "position": "Bottom",
      "positionValue": 1,
      "backgroundColor": "#28A745",
      "textColor": "#FFFFFF",
      "icon": "🚚",
      "sortOrder": 0,
      "isActive": true,
      "productCount": 8
    }
  ]
}
```

### 2.2 Get Tags by Position

```http
GET /api/product-tags/by-position/0    # Top tags
GET /api/product-tags/by-position/1    # Bottom tags
```

Response same shape as List All, filtered by position.

### 2.3 Get Tag by ID

```http
GET /api/product-tags/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "New Arrival",
    "nameAr": "وصل حديثاً",
    "position": "Top",
    "positionValue": 0,
    "backgroundColor": "#FF5733",
    "textColor": "#FFFFFF",
    "icon": "🆕",
    "sortOrder": 0,
    "isActive": true,
    "createdAt": "2026-02-10T18:00:00Z",
    "updatedAt": "2026-02-10T18:00:00Z",
    "productCount": 12
  }
}
```

### 2.4 Create Tag (Admin)

```http
POST /api/product-tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Best Seller",
  "nameAr": "الأكثر مبيعاً",
  "position": 0,
  "backgroundColor": "#FFD700",
  "textColor": "#000000",
  "icon": "⭐",
  "sortOrder": 1,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag created successfully.",
  "data": {
    "id": 3,
    "name": "Best Seller",
    "nameAr": "الأكثر مبيعاً",
    "position": "Top",
    "positionValue": 0,
    ...
  }
}
```

### 2.5 Update Tag (Admin)

```http
PUT /api/product-tags/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Best Seller",
  "nameAr": "الأكثر مبيعاً",
  "position": 0,
  "backgroundColor": "#FF4500",
  "textColor": "#FFFFFF",
  "icon": "🔥",
  "sortOrder": 1,
  "isActive": true
}
```

### 2.6 Delete Tag (Admin)

```http
DELETE /api/product-tags/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag deleted successfully."
}
```

> Deleting a tag also removes it from all products it was assigned to.

---

## 3. API Endpoints — Tag Assignment

### 3.1 Assign Tags to a Product (Replace All)

Replaces all current tag assignments for the product with the new list.

```http
POST /api/product-tags/assign/{productId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "tagIds": [1, 2, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tags assigned successfully."
}
```

### 3.2 Remove a Single Tag from a Product

```http
DELETE /api/product-tags/assign/{productId}/{tagId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag removed from product."
}
```

### 3.3 Get All Tags for a Product

```http
GET /api/product-tags/product/{productId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "New Arrival",
      "nameAr": "وصل حديثاً",
      "position": "Top",
      "backgroundColor": "#FF5733",
      "textColor": "#FFFFFF",
      "icon": "🆕",
      "sortOrder": 0
    },
    {
      "id": 2,
      "name": "Free Shipping",
      "nameAr": "شحن مجاني",
      "position": "Bottom",
      "backgroundColor": "#28A745",
      "textColor": "#FFFFFF",
      "icon": "🚚",
      "sortOrder": 0
    }
  ]
}
```

### 3.4 Get Only Top Tags for a Product

```http
GET /api/product-tags/product/{productId}/top
```

### 3.5 Get Only Bottom Tags for a Product

```http
GET /api/product-tags/product/{productId}/bottom
```

### 3.6 Assign Tags via Product Create/Update

You can also assign tags when creating or updating a product by including `tagIds` in the `ProductCreateUpdateDto`:

```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "COFFEE-001",
  "name": "Ethiopian Yirgacheffe",
  "categoryId": 1,
  "tagIds": [1, 3, 5],
  ...
}
```

```http
PUT /api/products/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "COFFEE-001",
  "name": "Ethiopian Yirgacheffe",
  "categoryId": 1,
  "tagIds": [1, 3, 5],
  ...
}
```

Setting `tagIds` to `[]` removes all tags. Omitting `tagIds` (or setting to `null`) leaves current assignments unchanged.

---

## 4. Tags in Product Responses

All product endpoints now include `topTags` and `bottomTags` arrays:

### ProductDto (detail)

```json
{
  "id": 42,
  "sku": "COFFEE-001",
  "name": "Ethiopian Yirgacheffe",
  ...
  "topTags": [
    {
      "id": 1,
      "name": "New Arrival",
      "nameAr": "وصل حديثاً",
      "position": "Top",
      "backgroundColor": "#FF5733",
      "textColor": "#FFFFFF",
      "icon": "🆕",
      "sortOrder": 0
    }
  ],
  "bottomTags": [
    {
      "id": 2,
      "name": "Free Shipping",
      "nameAr": "شحن مجاني",
      "position": "Bottom",
      "backgroundColor": "#28A745",
      "textColor": "#FFFFFF",
      "icon": "🚚",
      "sortOrder": 0
    }
  ]
}
```

### ProductListDto (list/grid)

Same `topTags` and `bottomTags` arrays are included in all list views:
- `GET /api/products` (paginated list)
- `GET /api/products/featured`
- `GET /api/products/latest`
- `GET /api/products/category/{id}`
- `GET /api/products/{id}/related`

---

## 5. TypeScript Interfaces

```typescript
// ============ Tag Position ============

export type TagPosition = 'Top' | 'Bottom';
export const TAG_POSITION_VALUES = { Top: 0, Bottom: 1 } as const;

// ============ Tag CRUD ============

export interface ProductTagCreateUpdateDto {
  name: string;            // max 100 chars
  nameAr?: string;         // max 100 chars
  position: number;        // 0 = Top, 1 = Bottom
  backgroundColor?: string; // hex, e.g., "#FF5733"
  textColor?: string;       // hex, e.g., "#FFFFFF"
  icon?: string;            // emoji or icon class, max 50 chars
  sortOrder: number;
  isActive: boolean;
}

export interface ProductTagResponseDto extends ProductTagCreateUpdateDto {
  id: number;
  positionValue: number;   // same as position
  position: TagPosition;   // "Top" or "Bottom" (string)
  createdAt: string;       // ISO 8601
  updatedAt: string;
  productCount: number;
}

export interface ProductTagListDto {
  id: number;
  name: string;
  nameAr?: string;
  position: TagPosition;
  positionValue: number;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

// ============ Tag Info (embedded in Product responses) ============

export interface ProductTagInfoDto {
  id: number;
  name: string;
  nameAr?: string;
  position: TagPosition;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  sortOrder: number;
}

// ============ Tag Assignment ============

export interface ProductTagAssignmentDto {
  tagIds: number[];
}

// ============ Updated Product DTOs ============

export interface ProductDto {
  // ... existing fields ...
  topTags: ProductTagInfoDto[];
  bottomTags: ProductTagInfoDto[];
}

export interface ProductListDto {
  // ... existing fields ...
  topTags: ProductTagInfoDto[];
  bottomTags: ProductTagInfoDto[];
}

export interface ProductCreateUpdateDto {
  // ... existing fields ...
  tagIds?: number[];  // optional: assign tags during create/update
}

// ============ API Response ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

---

## 6. React Implementation

### 6.1 API Service

```typescript
// services/productTagApi.ts
import axios from 'axios';
import type {
  ProductTagCreateUpdateDto,
  ProductTagResponseDto,
  ProductTagListDto,
  ProductTagInfoDto,
  ProductTagAssignmentDto,
  ApiResponse,
} from '../types/productTag';

const API_BASE = '/api/product-tags';

// ---- Tag CRUD ----

export const getAllTags = () =>
  axios.get<ApiResponse<ProductTagListDto[]>>(API_BASE);

export const getTagsByPosition = (position: number) =>
  axios.get<ApiResponse<ProductTagListDto[]>>(`${API_BASE}/by-position/${position}`);

export const getTagById = (id: number) =>
  axios.get<ApiResponse<ProductTagResponseDto>>(`${API_BASE}/${id}`);

export const createTag = (dto: ProductTagCreateUpdateDto) =>
  axios.post<ApiResponse<ProductTagResponseDto>>(API_BASE, dto);

export const updateTag = (id: number, dto: ProductTagCreateUpdateDto) =>
  axios.put<ApiResponse<ProductTagResponseDto>>(`${API_BASE}/${id}`, dto);

export const deleteTag = (id: number) =>
  axios.delete<ApiResponse<void>>(`${API_BASE}/${id}`);

// ---- Tag Assignment ----

export const assignTagsToProduct = (productId: number, dto: ProductTagAssignmentDto) =>
  axios.post<ApiResponse<void>>(`${API_BASE}/assign/${productId}`, dto);

export const removeTagFromProduct = (productId: number, tagId: number) =>
  axios.delete<ApiResponse<void>>(`${API_BASE}/assign/${productId}/${tagId}`);

export const getProductTags = (productId: number) =>
  axios.get<ApiResponse<ProductTagInfoDto[]>>(`${API_BASE}/product/${productId}`);

export const getProductTopTags = (productId: number) =>
  axios.get<ApiResponse<ProductTagInfoDto[]>>(`${API_BASE}/product/${productId}/top`);

export const getProductBottomTags = (productId: number) =>
  axios.get<ApiResponse<ProductTagInfoDto[]>>(`${API_BASE}/product/${productId}/bottom`);
```

### 6.2 Tag Badge Component

```tsx
// components/ProductTagBadge.tsx
import type { ProductTagInfoDto } from '../types/productTag';

interface Props {
  tag: ProductTagInfoDto;
  lang?: 'en' | 'ar';
}

export default function ProductTagBadge({ tag, lang = 'en' }: Props) {
  const name = lang === 'ar' && tag.nameAr ? tag.nameAr : tag.name;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: tag.backgroundColor || '#6B7280',
        color: tag.textColor || '#FFFFFF',
      }}
    >
      {tag.icon && <span>{tag.icon}</span>}
      {name}
    </span>
  );
}
```

### 6.3 Product Card with Tags

```tsx
// components/ProductCard.tsx
import type { ProductListDto } from '../types/product';
import ProductTagBadge from './ProductTagBadge';

interface Props {
  product: ProductListDto;
  lang?: 'en' | 'ar';
}

export default function ProductCard({ product, lang = 'en' }: Props) {
  return (
    <div className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Top Tags — overlaid on image */}
      {product.topTags.length > 0 && (
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
          {product.topTags.map((tag) => (
            <ProductTagBadge key={tag.id} tag={tag} lang={lang} />
          ))}
        </div>
      )}

      {/* Product Image */}
      <img
        src={product.mainImagePath || '/placeholder.jpg'}
        alt={product.name}
        className="w-full h-48 object-cover"
      />

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg">
          {lang === 'ar' && product.nameAr ? product.nameAr : product.name}
        </h3>
        <p className="text-green-600 font-bold mt-1">
          {product.minPrice?.toFixed(3)} OMR
        </p>

        {/* Bottom Tags */}
        {product.bottomTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.bottomTags.map((tag) => (
              <ProductTagBadge key={tag.id} tag={tag} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6.4 Tag Manager (Admin)

```tsx
// pages/ProductTagManager.tsx
import { useEffect, useState } from 'react';
import { getAllTags, createTag, updateTag, deleteTag } from '../services/productTagApi';
import type { ProductTagListDto, ProductTagCreateUpdateDto } from '../types/productTag';

const DEFAULT_FORM: ProductTagCreateUpdateDto = {
  name: '', nameAr: '', position: 0,
  backgroundColor: '#6B7280', textColor: '#FFFFFF',
  icon: '', sortOrder: 0, isActive: true,
};

export default function ProductTagManager() {
  const [tags, setTags] = useState<ProductTagListDto[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<ProductTagCreateUpdateDto>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    setLoading(true);
    const { data } = await getAllTags();
    if (data.success && data.data) setTags(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  const topTags = tags.filter((t) => t.positionValue === 0);
  const bottomTags = tags.filter((t) => t.positionValue === 1);

  const handleSave = async () => {
    if (!form.name) return alert('Name is required');
    if (editing) {
      await updateTag(editing, form);
    } else {
      await createTag(form);
    }
    setForm(DEFAULT_FORM);
    setEditing(null);
    fetchTags();
  };

  const handleEdit = (tag: ProductTagListDto) => {
    setEditing(tag.id);
    setForm({
      name: tag.name, nameAr: tag.nameAr || '',
      position: tag.positionValue,
      backgroundColor: tag.backgroundColor || '#6B7280',
      textColor: tag.textColor || '#FFFFFF',
      icon: tag.icon || '', sortOrder: tag.sortOrder, isActive: tag.isActive,
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;
    await deleteTag(id);
    fetchTags();
  };

  const renderTagList = (title: string, list: ProductTagListDto[]) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {list.length === 0 ? (
        <p className="text-gray-400">No tags</p>
      ) : (
        <div className="grid gap-2">
          {list.map((tag) => (
            <div key={tag.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: tag.backgroundColor || '#6B7280',
                    color: tag.textColor || '#FFFFFF',
                  }}
                >
                  {tag.icon && <span>{tag.icon}</span>}
                  {tag.name}
                </span>
                {tag.nameAr && <span className="text-gray-400 text-sm">{tag.nameAr}</span>}
                <span className="text-gray-400 text-xs">({tag.productCount} products)</span>
                {!tag.isActive && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(tag)} className="text-blue-500 hover:text-blue-700">Edit</button>
                <button onClick={() => handleDelete(tag.id, tag.name)} className="text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🏷️ Product Tags</h1>

      {/* Form */}
      <div className="border rounded-xl p-4 mb-6 bg-gray-50">
        <h3 className="font-semibold mb-3">{editing ? '✏️ Edit Tag' : '➕ New Tag'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            placeholder="Name (English)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Name (Arabic)" value={form.nameAr || ''}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            className="border rounded-lg px-3 py-2" dir="rtl"
          />
          <select value={form.position}
            onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            className="border rounded-lg px-3 py-2"
          >
            <option value={0}>⬆️ Top</option>
            <option value={1}>⬇️ Bottom</option>
          </select>
          <input
            placeholder="Icon (emoji)" value={form.icon || ''}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm">BG:</label>
            <input type="color" value={form.backgroundColor || '#6B7280'}
              onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <label className="text-sm">Text:</label>
            <input type="color" value={form.textColor || '#FFFFFF'}
              onChange={(e) => setForm({ ...form, textColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
          <input type="number" placeholder="Sort Order" value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="border rounded-lg px-3 py-2"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button onClick={() => { setEditing(null); setForm(DEFAULT_FORM); }}
                className="border px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Live Preview */}
        {form.name && (
          <div className="mt-3">
            <span className="text-sm text-gray-500 mr-2">Preview:</span>
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: form.backgroundColor || '#6B7280',
                color: form.textColor || '#FFFFFF',
              }}
            >
              {form.icon && <span>{form.icon}</span>}
              {form.name}
            </span>
          </div>
        )}
      </div>

      {/* Tag Lists */}
      {loading ? <p>Loading...</p> : (
        <>
          {renderTagList('⬆️ Top Tags (displayed above products)', topTags)}
          {renderTagList('⬇️ Bottom Tags (displayed below products)', bottomTags)}
        </>
      )}
    </div>
  );
}
```

### 6.5 Product Tag Selector (for Product Edit Form)

```tsx
// components/ProductTagSelector.tsx
import { useEffect, useState } from 'react';
import { getAllTags, assignTagsToProduct, getProductTags } from '../services/productTagApi';
import type { ProductTagListDto, ProductTagInfoDto } from '../types/productTag';

interface Props {
  productId: number;
  onChange?: (tagIds: number[]) => void;
}

export default function ProductTagSelector({ productId, onChange }: Props) {
  const [allTags, setAllTags] = useState<ProductTagListDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAllTags(), getProductTags(productId)]).then(([tagsRes, assignedRes]) => {
      if (tagsRes.data.success && tagsRes.data.data) setAllTags(tagsRes.data.data);
      if (assignedRes.data.success && assignedRes.data.data) {
        setSelectedIds(new Set(assignedRes.data.data.map((t: ProductTagInfoDto) => t.id)));
      }
    });
  }, [productId]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const tagIds = Array.from(selectedIds);
    await assignTagsToProduct(productId, { tagIds });
    onChange?.(tagIds);
    setSaving(false);
  };

  const topTags = allTags.filter((t) => t.positionValue === 0);
  const bottomTags = allTags.filter((t) => t.positionValue === 1);

  const renderGroup = (title: string, tags: ProductTagListDto[]) => (
    <div className="mb-3">
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button key={tag.id} onClick={() => toggle(tag.id)}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border-2 transition ${
              selectedIds.has(tag.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent opacity-60'
            }`}
            style={{
              backgroundColor: tag.backgroundColor || '#6B7280',
              color: tag.textColor || '#FFFFFF',
            }}
          >
            {tag.icon && <span>{tag.icon}</span>}
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="border rounded-xl p-4">
      <h3 className="font-semibold mb-3">🏷️ Product Tags</h3>
      {renderGroup('⬆️ Top Tags', topTags)}
      {renderGroup('⬇️ Bottom Tags', bottomTags)}
      <button onClick={handleSave} disabled={saving}
        className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? 'Saving...' : '💾 Save Tags'}
      </button>
    </div>
  );
}
```

---

## API Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/product-tags` | No | List all tags |
| `GET` | `/api/product-tags/by-position/{pos}` | No | List tags by position (0/1) |
| `GET` | `/api/product-tags/{id}` | No | Get tag by ID |
| `POST` | `/api/product-tags` | Admin | Create tag |
| `PUT` | `/api/product-tags/{id}` | Admin | Update tag |
| `DELETE` | `/api/product-tags/{id}` | Admin | Delete tag |
| `POST` | `/api/product-tags/assign/{productId}` | Admin | Assign tags to product |
| `DELETE` | `/api/product-tags/assign/{productId}/{tagId}` | Admin | Remove tag from product |
| `GET` | `/api/product-tags/product/{productId}` | No | Get all tags for product |
| `GET` | `/api/product-tags/product/{productId}/top` | No | Get top tags for product |
| `GET` | `/api/product-tags/product/{productId}/bottom` | No | Get bottom tags for product |
