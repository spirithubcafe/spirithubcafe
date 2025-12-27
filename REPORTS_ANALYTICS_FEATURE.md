# Reports & Analytics Feature

## Overview
The Reports & Analytics page provides comprehensive business insights and statistics for the SpiritHub Cafe e-commerce platform.

## Features Implemented

### 1. Sales Overview Chart
- **Daily View**: Shows sales data for the last 30 days
- **Weekly View**: Shows sales data for the last 12 weeks  
- **Monthly View**: Shows sales data for the last 12 months
- **Dual Axis Chart**: Displays both revenue (OMR) and order count
- **Export Functionality**: Export sales data to CSV/Excel format
- **Interactive**: Hover to see detailed information for each data point

### 2. Top Selling Products
- Lists the top 10 products ranked by quantity sold
- Shows:
  - Product rank with visual badges (Gold, Silver, Bronze for top 3)
  - Product image (if available)
  - Product name (supports Arabic translation)
  - Quantity sold
  - Number of orders containing the product
  - Total revenue generated
- **Export Functionality**: Export top products data to CSV format

### 3. Store Visits Tracking
- Tracks unique store visits per session
- Persists data in localStorage
- Increments on each new browser session
- Displayed in the metrics dashboard

### 4. Key Metrics Dashboard
Displays the following statistics:
- **Total Revenue**: Sum of all paid orders (in OMR)
- **Total Orders**: Count of all orders
- **Products Sold**: Total quantity of items sold
- **Customers**: Count of unique customers
- **Store Visits**: Total visitor count

### 5. Recent Orders
- Shows the last 5 orders
- Displays order number, status, and amount
- Color-coded status indicators

## File Structure

```
src/
├── components/admin/
│   ├── ReportsManagement.tsx    # Main reports page component
│   ├── SalesChart.tsx           # Sales overview chart component
│   └── TopProducts.tsx          # Top products list component
├── lib/
│   ├── analyticsUtils.ts        # Analytics calculation utilities
│   └── visitorTracking.ts      # Visitor tracking utilities
└── App.tsx                      # Added visitor tracking initialization
```

## Technical Details

### Libraries Used
- **recharts**: For rendering interactive charts
- **date-fns**: For date manipulation and formatting
- **lucide-react**: For icons

### Data Sources
- **Orders**: Fetched from `orderService.getAll()` API endpoint
- **Store Visits**: Tracked via localStorage and sessionStorage
- All calculations are performed client-side from order data

### Analytics Calculations

#### Sales Data Grouping
Sales are grouped by time period using these functions:
- `startOfDay()`: Groups by calendar day
- `startOfWeek()`: Groups by week (starting Sunday)
- `startOfMonth()`: Groups by calendar month

#### Top Products Ranking
Products are ranked by total quantity sold across all paid orders. The algorithm:
1. Filters for paid orders only
2. Aggregates quantities per product ID
3. Calculates revenue and order count per product
4. Sorts by quantity descending
5. Returns top N products

### Export Format
CSV files include:
- **Sales Export**: Date, Revenue (OMR), Orders
- **Products Export**: Product Name, Quantity Sold, Revenue (OMR), Order Count

## Internationalization
- Full Arabic (ar) and English (en) support
- RTL layout support for Arabic
- Translated labels and messages

## Future Enhancements
Consider implementing:
1. **Advanced Analytics Service**: Integration with Google Analytics, Plausible, or custom backend
2. **Date Range Selector**: Allow custom date ranges
3. **More Metrics**: Average order value, conversion rates, customer lifetime value
4. **Product Categories Analysis**: Sales breakdown by category
5. **Customer Segmentation**: RFM analysis, cohort analysis
6. **Real-time Updates**: WebSocket integration for live data
7. **Comparative Analytics**: Period-over-period comparisons
8. **Export to PDF**: Generate printable reports
9. **Scheduled Reports**: Email automated reports to admins

## Performance Notes
- Orders are fetched with a limit of 1000 records
- All calculations are performed client-side
- Charts are optimized with ResponsiveContainer
- For large datasets (>10k orders), consider server-side aggregation

## Usage

### Accessing the Reports
Navigate to: `/admin/reports` (requires admin authentication)

### Exporting Data
1. Click the "Export" button on either the Sales Chart or Top Products card
2. CSV file will download automatically
3. File naming format: `sales-{period}-{date}.csv` or `top-products-{date}.csv`

### Store Visit Tracking
- Automatically initialized when app loads
- New visits counted per browser session
- Data persists in localStorage
- Reset via: `resetVisitorCount()` in browser console (for testing)

## Browser Compatibility
- Modern browsers with ES6+ support
- localStorage and sessionStorage required
- Tested on Chrome, Firefox, Safari, Edge
