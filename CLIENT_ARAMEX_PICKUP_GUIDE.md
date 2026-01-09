# راهنمای پیاده‌سازی نمایش Pickup Reference در کلاینت

## مقدمه
این راهنما نحوه نمایش اطلاعات Pickup (شامل Pickup Reference) در سمت کلاینت را توضیح می‌دهد.

## 1. دریافت اطلاعات Pickup بعد از ایجاد Shipment

### API Endpoint
```
POST /api/aramex/create-shipment-for-order
```

### Request Body
```json
{
  "orderId": 123
}
```

### Response (موفق)
```json
{
  "success": true,
  "orderId": 123,
  "orderNumber": "ORD-2026-001",
  "shipmentNumber": "12345678901",
  "awbNumber": "12345678901",
  "trackingUrl": "https://www.aramex.com/track/shipments?ShipmentNumber=12345678901",
  "hasWarnings": false,
  "pickupSuccess": true,
  "pickupHasWarnings": false,
  "pickup": {
    "id": "PKP-12345678",           // این همان Pickup Reference است
    "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "reference1": "ORD-2026-001",   // Order Number
    "reference2": "12345678901"     // Shipment Number
  },
  "pickupErrors": []
}
```

## 2. دریافت اطلاعات Pickup از Order موجود

### API Endpoint
```
GET /api/orders/{orderId}
```

### Response
```json
{
  "id": 123,
  "orderNumber": "ORD-2026-001",
  "trackingNumber": "12345678901",
  "pickupGUID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pickupReference": "PKP-12345678",    // این همان ID پیک‌آپ است
  "status": "Shipped",
  ...
}
```

## 3. نمایش در UI

### مثال HTML/CSS
```html
<div class="order-shipping-info">
  <h3>اطلاعات ارسال</h3>
  
  <!-- شماره پیگیری -->
  <div class="info-row">
    <label>شماره پیگیری:</label>
    <span class="tracking-number">12345678901</span>
    <a href="https://www.aramex.com/track/shipments?ShipmentNumber=12345678901" 
       target="_blank" class="btn-track">
      پیگیری مرسوله
    </a>
  </div>
  
  <!-- Pickup Reference -->
  <div class="info-row" *ngIf="order.pickupReference">
    <label>شماره پیک‌آپ:</label>
    <span class="pickup-reference">PKP-12345678</span>
    <span class="badge badge-success">ثبت شده</span>
  </div>
  
  <!-- Pickup GUID (اختیاری - برای admin) -->
  <div class="info-row admin-only" *ngIf="isAdmin && order.pickupGUID">
    <label>GUID پیک‌آپ:</label>
    <small class="text-muted">{{order.pickupGUID}}</small>
  </div>
</div>

<style>
.order-shipping-info {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.info-row label {
  font-weight: bold;
  margin-left: 10px;
  min-width: 120px;
  color: #333;
}

.tracking-number,
.pickup-reference {
  font-family: 'Courier New', monospace;
  background: white;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  margin-left: 10px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.btn-track {
  margin-right: auto;
  padding: 6px 12px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
}

.btn-track:hover {
  background-color: #0056b3;
}
</style>
```

## 4. مثال React Component

```jsx
import React from 'react';

const OrderShippingInfo = ({ order }) => {
  return (
    <div className="order-shipping-info">
      <h3>اطلاعات ارسال</h3>
      
      {/* شماره پیگیری */}
      {order.trackingNumber && (
        <div className="info-row">
          <label>شماره پیگیری:</label>
          <span className="tracking-number">{order.trackingNumber}</span>
          <a 
            href={`https://www.aramex.com/track/shipments?ShipmentNumber=${order.trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-track"
          >
            پیگیری مرسوله
          </a>
        </div>
      )}
      
      {/* Pickup Reference */}
      {order.pickupReference && (
        <div className="info-row">
          <label>شماره پیک‌آپ:</label>
          <span className="pickup-reference">{order.pickupReference}</span>
          <span className="badge badge-success">ثبت شده</span>
        </div>
      )}
      
      {/* Status */}
      <div className="info-row">
        <label>وضعیت ارسال:</label>
        <span className={`status-badge status-${order.status.toLowerCase()}`}>
          {getStatusText(order.status)}
        </span>
      </div>
    </div>
  );
};

const getStatusText = (status) => {
  const statusMap = {
    'Pending': 'در انتظار',
    'Processing': 'در حال پردازش',
    'Shipped': 'ارسال شده',
    'Delivered': 'تحویل داده شده',
    'Cancelled': 'لغو شده'
  };
  return statusMap[status] || status;
};

export default OrderShippingInfo;
```

## 5. مثال Angular Component

```typescript
// order-shipping-info.component.ts
import { Component, Input } from '@angular/core';

interface Order {
  id: number;
  orderNumber: string;
  trackingNumber?: string;
  pickupReference?: string;
  pickupGUID?: string;
  status: string;
}

@Component({
  selector: 'app-order-shipping-info',
  templateUrl: './order-shipping-info.component.html',
  styleUrls: ['./order-shipping-info.component.css']
})
export class OrderShippingInfoComponent {
  @Input() order!: Order;
  @Input() isAdmin: boolean = false;

  getTrackingUrl(): string {
    if (!this.order.trackingNumber) return '';
    return `https://www.aramex.com/track/shipments?ShipmentNumber=${this.order.trackingNumber}`;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'در انتظار',
      'Processing': 'در حال پردازش',
      'Shipped': 'ارسال شده',
      'Delivered': 'تحویل داده شده',
      'Cancelled': 'لغو شده'
    };
    return statusMap[status] || status;
  }
}
```

```html
<!-- order-shipping-info.component.html -->
<div class="order-shipping-info">
  <h3>اطلاعات ارسال</h3>
  
  <!-- شماره پیگیری -->
  <div class="info-row" *ngIf="order.trackingNumber">
    <label>شماره پیگیری:</label>
    <span class="tracking-number">{{ order.trackingNumber }}</span>
    <a [href]="getTrackingUrl()" 
       target="_blank" 
       class="btn-track">
      پیگیری مرسوله
    </a>
  </div>
  
  <!-- Pickup Reference -->
  <div class="info-row" *ngIf="order.pickupReference">
    <label>شماره پیک‌آپ:</label>
    <span class="pickup-reference">{{ order.pickupReference }}</span>
    <span class="badge badge-success">ثبت شده</span>
  </div>
  
  <!-- Pickup GUID (فقط برای Admin) -->
  <div class="info-row admin-only" *ngIf="isAdmin && order.pickupGUID">
    <label>GUID پیک‌آپ:</label>
    <small class="text-muted">{{ order.pickupGUID }}</small>
  </div>
  
  <!-- Status -->
  <div class="info-row">
    <label>وضعیت ارسال:</label>
    <span [class]="'status-badge status-' + order.status.toLowerCase()">
      {{ getStatusText(order.status) }}
    </span>
  </div>
</div>
```

## 6. مثال Vue.js Component

```vue
<template>
  <div class="order-shipping-info">
    <h3>اطلاعات ارسال</h3>
    
    <!-- شماره پیگیری -->
    <div v-if="order.trackingNumber" class="info-row">
      <label>شماره پیگیری:</label>
      <span class="tracking-number">{{ order.trackingNumber }}</span>
      <a :href="trackingUrl" 
         target="_blank" 
         class="btn-track">
        پیگیری مرسوله
      </a>
    </div>
    
    <!-- Pickup Reference -->
    <div v-if="order.pickupReference" class="info-row">
      <label>شماره پیک‌آپ:</label>
      <span class="pickup-reference">{{ order.pickupReference }}</span>
      <span class="badge badge-success">ثبت شده</span>
    </div>
    
    <!-- Pickup GUID (فقط برای Admin) -->
    <div v-if="isAdmin && order.pickupGUID" class="info-row admin-only">
      <label>GUID پیک‌آپ:</label>
      <small class="text-muted">{{ order.pickupGUID }}</small>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderShippingInfo',
  props: {
    order: {
      type: Object,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    trackingUrl() {
      if (!this.order.trackingNumber) return '';
      return `https://www.aramex.com/track/shipments?ShipmentNumber=${this.order.trackingNumber}`;
    }
  }
}
</script>
```

## 7. نمایش در لیست سفارشات (Order List)

```html
<table class="orders-table">
  <thead>
    <tr>
      <th>شماره سفارش</th>
      <th>مبلغ</th>
      <th>وضعیت</th>
      <th>شماره پیگیری</th>
      <th>پیک‌آپ</th>
      <th>عملیات</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let order of orders">
      <td>{{ order.orderNumber }}</td>
      <td>{{ order.totalAmount | currency:'OMR' }}</td>
      <td>
        <span [class]="'badge badge-' + order.status.toLowerCase()">
          {{ getStatusText(order.status) }}
        </span>
      </td>
      <td>
        <span *ngIf="order.trackingNumber" class="tracking-number-sm">
          {{ order.trackingNumber }}
        </span>
        <span *ngIf="!order.trackingNumber" class="text-muted">-</span>
      </td>
      <td>
        <!-- نمایش Pickup Reference -->
        <span *ngIf="order.pickupReference" class="pickup-ref-sm">
          <i class="fas fa-check-circle text-success"></i>
          {{ order.pickupReference }}
        </span>
        <span *ngIf="!order.pickupReference" class="text-muted">-</span>
      </td>
      <td>
        <button (click)="viewOrder(order.id)" class="btn btn-sm btn-primary">
          مشاهده
        </button>
      </td>
    </tr>
  </tbody>
</table>

<style>
.tracking-number-sm,
.pickup-ref-sm {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pickup-ref-sm i {
  font-size: 14px;
}
</style>
```

## 8. نمایش در صفحه جزئیات سفارش (Admin Panel)

```html
<div class="order-details-page">
  <div class="card">
    <div class="card-header">
      <h4>سفارش {{ order.orderNumber }}</h4>
    </div>
    
    <div class="card-body">
      <!-- ... اطلاعات دیگر سفارش ... -->
      
      <!-- Shipping & Pickup Information -->
      <div class="section">
        <h5>اطلاعات حمل و نقل</h5>
        
        <div class="row">
          <div class="col-md-6">
            <div class="detail-item">
              <strong>روش ارسال:</strong>
              <span>{{ getShippingMethodName(order.shippingMethod) }}</span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <strong>هزینه ارسال:</strong>
              <span>{{ order.shippingCost }} ریال عمان</span>
            </div>
          </div>
        </div>
        
        <!-- Tracking Number -->
        <div class="row" *ngIf="order.trackingNumber">
          <div class="col-md-12">
            <div class="detail-item highlight">
              <strong>شماره پیگیری (Tracking Number):</strong>
              <span class="tracking-code">{{ order.trackingNumber }}</span>
              <a [href]="'https://www.aramex.com/track/shipments?ShipmentNumber=' + order.trackingNumber"
                 target="_blank"
                 class="btn btn-sm btn-info ms-2">
                <i class="fas fa-external-link-alt"></i> پیگیری آنلاین
              </a>
            </div>
          </div>
        </div>
        
        <!-- Pickup Information -->
        <div class="pickup-info" *ngIf="order.pickupReference">
          <div class="row">
            <div class="col-md-6">
              <div class="detail-item highlight">
                <strong>شماره پیک‌آپ (Pickup ID):</strong>
                <span class="pickup-code">{{ order.pickupReference }}</span>
                <span class="badge badge-success ms-2">
                  <i class="fas fa-check"></i> ثبت شده
                </span>
              </div>
            </div>
            
            <div class="col-md-6" *ngIf="order.pickupGUID">
              <div class="detail-item">
                <strong>Pickup GUID:</strong>
                <small class="text-muted font-monospace">
                  {{ order.pickupGUID }}
                </small>
                <button class="btn btn-sm btn-outline-secondary ms-2"
                        (click)="copyToClipboard(order.pickupGUID)">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Pickup Warning -->
        <div class="alert alert-warning" 
             *ngIf="order.trackingNumber && !order.pickupReference">
          <i class="fas fa-exclamation-triangle"></i>
          مرسوله ایجاد شده اما پیک‌آپ ثبت نشده است.
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.detail-item {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-item.highlight {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
}

.tracking-code,
.pickup-code {
  font-family: 'Courier New', monospace;
  background: white;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  margin: 0 10px;
  font-weight: bold;
  color: #0056b3;
}

.pickup-info {
  margin-top: 20px;
  padding: 15px;
  background: #f0f8ff;
  border-radius: 8px;
  border: 2px solid #4CAF50;
}

.font-monospace {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}
</style>
```

## 9. TypeScript Interface

```typescript
// models/order.interface.ts
export interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subTotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  shippingMethod: ShippingMethod;
  trackingNumber?: string;
  pickupGUID?: string;         // GUID پیک‌آپ
  pickupReference?: string;    // شماره/ID پیک‌آپ
  notes?: string;
  isGift: boolean;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItem[];
}

export enum ShippingMethod {
  Pickup = 1,
  Nool = 2,
  Aramex = 3
}

export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export enum PaymentStatus {
  Unpaid = 'Unpaid',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded'
}
```

## 10. نکات مهم

### 📋 فیلدهای موجود در Order:
- **`trackingNumber`**: شماره پیگیری مرسوله Aramex (AWB Number)
- **`pickupReference`**: شماره/ID پیک‌آپ (این همان چیزی است که باید نمایش دهید)
- **`pickupGUID`**: GUID منحصر به فرد پیک‌آپ (اختیاری، برای admin)

### ✅ چه زمانی pickup ثبت می‌شود:
- فقط زمانی که `shippingMethod = 3` (Aramex)
- بعد از ایجاد موفق shipment
- به صورت خودکار توسط backend

### 🎨 نمایش در UI:
1. **برای کاربران عادی**: فقط `pickupReference` را نشان دهید
2. **برای Admin**: هم `pickupReference` و هم `pickupGUID`
3. از آیکون ✓ برای نشان دادن ثبت موفق پیک‌آپ استفاده کنید
4. اگر `trackingNumber` وجود دارد اما `pickupReference` نیست، هشدار نشان دهید

### 🔍 چک کردن وضعیت:
```typescript
hasPickup(order: Order): boolean {
  return !!order.pickupReference;
}

isAramexShipping(order: Order): boolean {
  return order.shippingMethod === 3;
}

shouldShowPickupWarning(order: Order): boolean {
  return this.isAramexShipping(order) && 
         !!order.trackingNumber && 
         !order.pickupReference;
}
```

---

## 📞 پشتیبانی

اگر سوالی داشتید یا نیاز به راهنمایی بیشتر بود، لطفاً تماس بگیرید.
