# Payment & Order API - Complete Guide

Complete documentation for Payment and Order management APIs in Spirithub Café system.

---

## Table of Contents

1. [Payment API](#payment-api)
   - [Payment Flow](#payment-flow)
   - [Payment Endpoints](#payment-endpoints)
   - [Payment Integration Examples](#payment-integration-examples)
2. [Orders API](#orders-api)
   - [Order Endpoints](#order-endpoints)
   - [Order Integration Examples](#order-integration-examples)
3. [Complete E-commerce Flow](#complete-e-commerce-flow)
4. [React Service Implementation](#react-service-implementation)

---

## Payment API

### Base URL
```
https://spirithubapi.sbc.om/api/payment
```

### Authentication
- Most payment endpoints are public (for customer checkout)
- Admin endpoints require JWT Bearer token with `PaymentsManage` permission

---

### Payment Flow

```
1. Customer completes order → POST /api/orders
2. System returns order with orderNumber
3. Initiate payment → POST /api/payment/initiate
4. Redirect customer to Bank Muscat gateway
5. Customer completes payment
6. Bank redirects back → GET/POST /api/payment/callback
7. System updates order payment status
8. Show success/failure page to customer
```

---

### Payment Endpoints

#### 1. Initiate Payment

**Endpoint:** `POST /api/payment/initiate`

**Description:** Start payment process with Bank Muscat gateway

**Request Body:**
```typescript
interface PaymentRequestDto {
  orderId: string;           // Required: Order number
  amount: number;            // Required: Payment amount
  currency?: string;         // Default: "OMR"
  
  // Billing Information
  billingName?: string;
  billingEmail?: string;
  billingTel?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  
  // Delivery Information
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountry?: string;
  deliveryTel?: string;
  
  // Additional Parameters
  merchantParam1?: string;   // Custom data field 1
  merchantParam2?: string;   // Custom data field 2
  merchantParam3?: string;   // Custom data field 3
  merchantParam4?: string;   // Custom data field 4
  merchantParam5?: string;   // Custom data field 5
  promoCode?: string;
  customerId?: string;
  language?: string;         // "EN" or "AR"
}
```

**Response:**
```typescript
interface PaymentGatewayResultDto {
  success: boolean;
  paymentUrl?: string;          // Bank Muscat gateway URL
  encryptedRequest?: string;    // Encrypted payment data
  accessCode?: string;          // Gateway access code
  errorMessage?: string;        // Error if failed
  orderId?: string;
}
```

**Example Request:**
```json
{
  "orderId": "ORD-20241110-0001",
  "amount": 45.500,
  "currency": "OMR",
  "billingName": "Ahmed Al Balushi",
  "billingEmail": "ahmed@example.com",
  "billingTel": "+96899123456",
  "billingAddress": "Building 123, Street 456",
  "billingCity": "Muscat",
  "billingState": "Muscat",
  "billingCountry": "Oman",
  "deliveryName": "Ahmed Al Balushi",
  "deliveryAddress": "Building 123, Street 456",
  "deliveryCity": "Muscat",
  "deliveryCountry": "Oman",
  "deliveryTel": "+96899123456",
  "language": "EN"
}
```

**Example Response:**
```json
{
  "success": true,
  "paymentUrl": "https://smartpay.bankmuscat.com/payment",
  "encryptedRequest": "ABC123...XYZ789",
  "accessCode": "AVXK12345678",
  "orderId": "ORD-20241110-0001"
}
```

**Error Response:**
```json
{
  "error": "Payment gateway is currently disabled"
}
```

---

#### 2. Payment Callback (Success/Failure)

**Endpoint:** `GET/POST /api/payment/callback`

**Description:** Bank Muscat redirects here after payment (handled automatically)

**Query Parameters:**
- `encResp`: Encrypted response from gateway
- `orderNo`: Order number

**Response:** Redirects to:
- Success: `/payment/success?orderId=XXX&trackingId=YYY`
- Cancelled: `/payment/cancelled?orderId=XXX`
- Failed: `/payment/failed?orderId=XXX&reason=ZZZ`

---

#### 3. Get Payment Status

**Endpoint:** `GET /api/payment/status/{orderId}`

**Description:** Check payment status for an order

**Response:**
```typescript
interface PaymentStatusDto {
  orderId: string;
  status: string;           // "Pending", "Success", "Failed", "Cancelled"
  trackingId?: string;
  amount: number;
  currency: string;
  paymentDate?: string;     // ISO date string
  message?: string;
}
```

**Example:**
```bash
GET /api/payment/status/ORD-20241110-0001
```

**Response:**
```json
{
  "orderId": "ORD-20241110-0001",
  "status": "Success",
  "trackingId": "412345678901",
  "amount": 45.500,
  "currency": "OMR",
  "paymentDate": "2024-11-10T14:30:00Z",
  "message": "Payment completed successfully"
}
```

---

#### 4. Get Payment by Tracking ID

**Endpoint:** `GET /api/payment/tracking/{trackingId}`

**Description:** Get payment details by bank tracking ID

**Example:**
```bash
GET /api/payment/tracking/412345678901
```

---

#### 5. Verify Payment

**Endpoint:** `POST /api/payment/verify`

**Description:** Verify payment completion and amount

**Request:**
```typescript
interface PaymentVerificationDto {
  orderId: string;
  expectedAmount: number;
}
```

**Response:**
```json
{
  "orderId": "ORD-20241110-0001",
  "isValid": true,
  "message": "Payment verified successfully"
}
```

---

#### 6. Get Payment History (Authenticated)

**Endpoint:** `GET /api/payment/history/{customerId}?limit=10`

**Authentication:** Required (Bearer token)

**Description:** Get customer's payment history

**Response:**
```json
[
  {
    "orderId": "ORD-20241110-0001",
    "status": "Success",
    "trackingId": "412345678901",
    "amount": 45.500,
    "currency": "OMR",
    "paymentDate": "2024-11-10T14:30:00Z"
  }
]
```

---

#### 7. Get Pending Payments (Admin Only)

**Endpoint:** `GET /api/payment/pending?olderThanMinutes=30`

**Authentication:** Required (Admin with `PaymentsManage` permission)

**Response:**
```json
{
  "count": 3,
  "payments": [
    {
      "orderId": "ORD-20241110-0002",
      "status": "Pending",
      "amount": 32.500,
      "currency": "OMR"
    }
  ]
}
```

---

#### 8. Gateway Status

**Endpoint:** `GET /api/payment/gateway/status`

**Description:** Check if payment gateway is enabled

**Response:**
```json
{
  "enabled": true,
  "gateway": "Bank Muscat SmartPay",
  "message": "Payment gateway is active"
}
```

---

## Orders API

### Base URL
```
https://spirithubapi.sbc.om/api/orders
```

### Authentication
- `POST /api/orders` - Public (for customer checkout)
- All other endpoints - Require `OrdersManage` or `OrdersDelete` permission

---

### Order Endpoints

#### 1. Create Order

**Endpoint:** `POST /api/orders`

**Description:** Create a new order (public endpoint for checkout)

**Request Body:**
```typescript
interface OrderCreateDto {
  // Customer Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Shipping Address
  addressLine1: string;
  addressLine2?: string;
  countryId: number;
  cityId: number;
  postalCode?: string;
  
  // Shipping Details
  shippingMethodId: number;
  shippingCost: number;
  
  // Gift Information (optional)
  isGift?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientAddressLine1?: string;
  giftRecipientAddressLine2?: string;
  giftRecipientCountryId?: number;
  giftRecipientCityId?: number;
  giftRecipientPostalCode?: string;
  giftMessage?: string;
  
  // Additional
  notes?: string;
  userId?: string;
  
  // Order Items (minimum 1 required)
  items: OrderItemCreateDto[];
}

interface OrderItemCreateDto {
  productId: number;
  productVariantId?: number;
  quantity: number;          // Minimum: 1
}
```

**Example Request:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Al Balushi",
  "email": "ahmed@example.com",
  "phone": "+96899123456",
  "addressLine1": "Building 123, Street 456",
  "addressLine2": "Way 789, Al Khuwair",
  "countryId": 1,
  "cityId": 1,
  "postalCode": "100",
  "shippingMethodId": 1,
  "shippingCost": 2.500,
  "isGift": false,
  "notes": "Please deliver after 5 PM",
  "items": [
    {
      "productId": 5,
      "quantity": 2
    },
    {
      "productId": 8,
      "productVariantId": 15,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 42,
    "orderNumber": "ORD-20241110-0001",
    "status": "Pending",
    "paymentStatus": "Pending",
    "subTotal": 43.000,
    "taxAmount": 0.000,
    "shippingCost": 2.500,
    "totalAmount": 45.500,
    "createdAt": "2024-11-10T14:25:30Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Product not found or out of stock"
}
```

---

#### 2. Get Orders (Paginated)

**Endpoint:** `GET /api/orders`

**Authentication:** Required (`OrdersManage` permission)

**Query Parameters:**
```typescript
interface OrderQueryParameters {
  page?: number;              // Default: 1
  pageSize?: number;          // Default: 20, Max: 100
  status?: string;            // Filter by status
  paymentStatus?: string;     // Filter by payment status
  searchTerm?: string;        // Search in customer name, email, order number
  fromDate?: string;          // ISO date
  toDate?: string;            // ISO date
}
```

**Example:**
```bash
GET /api/orders?page=1&pageSize=20&status=Pending&searchTerm=ahmed
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "orderNumber": "ORD-20241110-0001",
      "customerName": "Ahmed Al Balushi",
      "email": "ahmed@example.com",
      "phone": "+96899123456",
      "status": "Pending",
      "paymentStatus": "Pending",
      "totalAmount": 45.500,
      "createdAt": "2024-11-10T14:25:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150
  }
}
```

---

#### 3. Get Order by ID

**Endpoint:** `GET /api/orders/{id}`

**Authentication:** Required (`OrdersManage` permission)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "orderNumber": "ORD-20241110-0001",
    "status": "Processing",
    "paymentStatus": "Paid",
    "subTotal": 43.000,
    "taxAmount": 0.000,
    "shippingCost": 2.500,
    "totalAmount": 45.500,
    "firstName": "Ahmed",
    "lastName": "Al Balushi",
    "email": "ahmed@example.com",
    "phone": "+96899123456",
    "addressLine1": "Building 123, Street 456",
    "addressLine2": "Way 789, Al Khuwair",
    "country": "Oman",
    "city": "Muscat",
    "postalCode": "100",
    "shippingMethod": "Standard Delivery",
    "trackingNumber": "BM1234567890",
    "isGift": false,
    "notes": "Please deliver after 5 PM",
    "createdAt": "2024-11-10T14:25:30Z",
    "updatedAt": "2024-11-10T15:30:00Z",
    "items": [
      {
        "id": 85,
        "productId": 5,
        "productName": "Ethiopian Yirgacheffe",
        "quantity": 2,
        "unitPrice": 18.500,
        "taxPercentage": 0,
        "taxAmount": 0.000,
        "totalAmount": 37.000
      },
      {
        "id": 86,
        "productId": 8,
        "productVariantId": 15,
        "productName": "Colombian Supremo",
        "variantInfo": "250g, Ground",
        "quantity": 1,
        "unitPrice": 6.000,
        "taxPercentage": 0,
        "taxAmount": 0.000,
        "totalAmount": 6.000
      }
    ],
    "payments": [
      {
        "orderId": "ORD-20241110-0001",
        "status": "Success",
        "gatewayReference": "412345678901",
        "amount": 45.500,
        "currency": "OMR",
        "createdAt": "2024-11-10T14:30:00Z"
      }
    ]
  }
}
```

---

#### 4. Get Order by Order Number

**Endpoint:** `GET /api/orders/number/{orderNumber}`

**Authentication:** Required (`OrdersManage` permission)

**Example:**
```bash
GET /api/orders/number/ORD-20241110-0001
```

---

#### 5. Update Order Status

**Endpoint:** `PUT /api/orders/{id}/status`

**Authentication:** Required (`OrdersManage` permission)

**Request:**
```json
{
  "status": "Processing"
}
```

**Valid Statuses:**
- `Pending` - Order placed, awaiting payment
- `Processing` - Order is being prepared
- `Shipped` - Order has been shipped
- `Delivered` - Order delivered to customer
- `Cancelled` - Order cancelled
- `Refunded` - Order refunded

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully"
}
```

---

#### 6. Update Payment Status

**Endpoint:** `PUT /api/orders/{id}/payment-status`

**Authentication:** Required (`OrdersManage` permission)

**Request:**
```json
{
  "paymentStatus": "Paid"
}
```

**Valid Payment Statuses:**
- `Pending` - Awaiting payment
- `Paid` - Payment received
- `Failed` - Payment failed
- `Refunded` - Payment refunded

**Response:**
```json
{
  "success": true,
  "message": "Payment status updated successfully"
}
```

---

#### 7. Update Shipping Information

**Endpoint:** `PUT /api/orders/{id}/shipping`

**Authentication:** Required (`OrdersManage` permission)

**Request:**
```json
{
  "shippingMethodId": 2,
  "trackingNumber": "BM1234567890",
  "shippingCost": 3.500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipping information updated successfully"
}
```

---

#### 8. Delete Order

**Endpoint:** `DELETE /api/orders/{id}`

**Authentication:** Required (`OrdersDelete` permission - Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

---

## Complete E-commerce Flow

### Customer Checkout Flow

```
1. Customer adds products to cart
   └─> Store cart items in state/localStorage

2. Customer proceeds to checkout
   └─> POST /api/orders with customer info and cart items
   └─> Response: { orderNumber: "ORD-20241110-0001", totalAmount: 45.500 }

3. Initiate payment
   └─> POST /api/payment/initiate with order details
   └─> Response: { paymentUrl: "...", encryptedRequest: "..." }

4. Redirect to payment gateway
   └─> Create form with encrypted data
   └─> Submit to Bank Muscat gateway
   └─> Customer completes payment

5. Payment callback
   └─> Bank redirects to /api/payment/callback
   └─> System processes payment
   └─> Redirects customer to success/failure page

6. Verify payment (optional)
   └─> POST /api/payment/verify
   └─> Confirm payment status and amount

7. Track order
   └─> GET /api/payment/status/{orderId}
   └─> Show order status to customer
```

---

## React Service Implementation

### Payment Service

```typescript
// services/paymentService.ts
import axios from 'axios';

const API_BASE = 'https://spirithubapi.sbc.om/api/payment';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  billingName?: string;
  billingEmail?: string;
  billingTel?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryCountry?: string;
  deliveryTel?: string;
  language?: string;
}

export interface PaymentGatewayResult {
  success: boolean;
  paymentUrl?: string;
  encryptedRequest?: string;
  accessCode?: string;
  errorMessage?: string;
  orderId?: string;
}

export interface PaymentStatus {
  orderId: string;
  status: string;
  trackingId?: string;
  amount: number;
  currency: string;
  paymentDate?: string;
  message?: string;
}

class PaymentService {
  // Initiate payment
  async initiatePayment(request: PaymentRequest): Promise<PaymentGatewayResult> {
    const response = await axios.post(`${API_BASE}/initiate`, request);
    return response.data;
  }

  // Get payment status
  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    const response = await axios.get(`${API_BASE}/status/${orderId}`);
    return response.data;
  }

  // Verify payment
  async verifyPayment(orderId: string, expectedAmount: number) {
    const response = await axios.post(`${API_BASE}/verify`, {
      orderId,
      expectedAmount
    });
    return response.data;
  }

  // Check gateway status
  async getGatewayStatus() {
    const response = await axios.get(`${API_BASE}/gateway/status`);
    return response.data;
  }

  // Get payment history (authenticated)
  async getPaymentHistory(customerId: string, limit: number = 10) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(
      `${API_BASE}/history/${customerId}?limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }

  // Redirect to payment gateway
  redirectToGateway(paymentUrl: string, encryptedRequest: string, accessCode: string) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;

    const encInput = document.createElement('input');
    encInput.type = 'hidden';
    encInput.name = 'encRequest';
    encInput.value = encryptedRequest;

    const accessInput = document.createElement('input');
    accessInput.type = 'hidden';
    accessInput.name = 'access_code';
    accessInput.value = accessCode;

    form.appendChild(encInput);
    form.appendChild(accessInput);
    document.body.appendChild(form);
    form.submit();
  }
}

export default new PaymentService();
```

### Order Service

```typescript
// services/orderService.ts
import axios from 'axios';

const API_BASE = 'https://spirithubapi.sbc.om/api/orders';

export interface OrderItem {
  productId: number;
  productVariantId?: number;
  quantity: number;
}

export interface OrderCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  countryId: number;
  cityId: number;
  postalCode?: string;
  shippingMethodId: number;
  shippingCost: number;
  isGift?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientAddressLine1?: string;
  giftMessage?: string;
  notes?: string;
  items: OrderItem[];
}

export interface OrderDetails {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: any[];
  payments: any[];
  // ... other fields
}

class OrderService {
  // Create order
  async createOrder(order: OrderCreateRequest) {
    const response = await axios.post(`${API_BASE}`, order);
    return response.data;
  }

  // Get orders (admin)
  async getOrders(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    paymentStatus?: string;
    searchTerm?: string;
  }) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE}`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Get order by ID (admin)
  async getOrderById(id: number): Promise<OrderDetails> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  // Get order by number (admin)
  async getOrderByNumber(orderNumber: string): Promise<OrderDetails> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE}/number/${orderNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }

  // Update order status (admin)
  async updateOrderStatus(id: number, status: string) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put(
      `${API_BASE}/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  // Update payment status (admin)
  async updatePaymentStatus(id: number, paymentStatus: string) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put(
      `${API_BASE}/${id}/payment-status`,
      { paymentStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  // Update shipping (admin)
  async updateShipping(id: number, data: {
    shippingMethodId: number;
    trackingNumber?: string;
    shippingCost?: number;
  }) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put(
      `${API_BASE}/${id}/shipping`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  // Delete order (admin)
  async deleteOrder(id: number) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.delete(`${API_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}

export default new OrderService();
```

### React Component Example - Checkout

```typescript
// components/Checkout.tsx
import React, { useState } from 'react';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

interface CartItem {
  productId: number;
  productVariantId?: number;
  quantity: number;
  price: number;
}

export const Checkout: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Assume cart items are in state/context
  const [cartItems] = useState<CartItem[]>([
    { productId: 5, quantity: 2, price: 18.500 }
  ]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    countryId: 1,
    cityId: 1,
    postalCode: '',
    shippingMethodId: 1,
    shippingCost: 2.500,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Create order
      const orderResponse = await orderService.createOrder({
        ...formData,
        items: cartItems.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity
        }))
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      const { orderNumber, totalAmount } = orderResponse.data;

      // Step 2: Initiate payment
      const paymentResponse = await paymentService.initiatePayment({
        orderId: orderNumber,
        amount: totalAmount,
        currency: 'OMR',
        billingName: `${formData.firstName} ${formData.lastName}`,
        billingEmail: formData.email,
        billingTel: formData.phone,
        billingAddress: formData.addressLine1,
        billingCity: formData.cityId.toString(),
        billingCountry: 'Oman',
        deliveryName: `${formData.firstName} ${formData.lastName}`,
        deliveryAddress: formData.addressLine1,
        deliveryCity: formData.cityId.toString(),
        deliveryCountry: 'Oman',
        deliveryTel: formData.phone,
        language: 'EN'
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.errorMessage);
      }

      // Step 3: Redirect to payment gateway
      paymentService.redirectToGateway(
        paymentResponse.paymentUrl!,
        paymentResponse.encryptedRequest!,
        paymentResponse.accessCode!
      );

    } catch (err: any) {
      setError(err.message || 'Failed to process checkout');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
};
```

### React Component Example - Order Status

```typescript
// components/OrderStatus.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import paymentService from '../services/paymentService';

export const OrderStatus: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentStatus();
    
    // Poll every 5 seconds for pending payments
    const interval = setInterval(() => {
      if (status?.status === 'Pending') {
        loadPaymentStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const loadPaymentStatus = async () => {
    try {
      const result = await paymentService.getPaymentStatus(orderId!);
      setStatus(result);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load payment status', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="order-status">
      <h1>Order Status</h1>
      
      <div className="status-card">
        <p><strong>Order ID:</strong> {status.orderId}</p>
        <p><strong>Status:</strong> {status.status}</p>
        {status.trackingId && (
          <p><strong>Tracking ID:</strong> {status.trackingId}</p>
        )}
        <p><strong>Amount:</strong> {status.amount} {status.currency}</p>
        {status.paymentDate && (
          <p><strong>Payment Date:</strong> {new Date(status.paymentDate).toLocaleString()}</p>
        )}
      </div>

      {status.status === 'Success' && (
        <div className="success-message">
          ✓ Payment completed successfully!
        </div>
      )}

      {status.status === 'Failed' && (
        <div className="error-message">
          ✗ Payment failed. Please try again.
        </div>
      )}

      {status.status === 'Pending' && (
        <div className="pending-message">
          ⏳ Payment is being processed...
        </div>
      )}
    </div>
  );
};
```

---

## Important Notes

### Payment Security

1. **Never store sensitive payment data** - All payment processing happens through Bank Muscat gateway
2. **Use HTTPS** - All API calls must be over secure connection
3. **Validate callbacks** - System automatically validates payment callbacks from gateway
4. **Verify amounts** - Always verify payment amount matches order total

### Order Statuses

**Order Status Flow:**
```
Pending → Processing → Shipped → Delivered
   ↓
Cancelled/Refunded
```

**Payment Status Flow:**
```
Pending → Paid
   ↓
Failed/Refunded
```

### Testing

Use Bank Muscat's test environment for development:
- Test cards provided by Bank Muscat
- Sandbox gateway URL
- Test credentials in appsettings

### Error Handling

Always handle these scenarios:
- Payment gateway timeout
- Insufficient stock
- Invalid product IDs
- Network failures
- Duplicate payments

---

## Support

For issues or questions:
- API Documentation: https://spirithubapi.sbc.om/swagger
- Technical Support: Contact system administrator

