import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { orderService } from '../services';
import type { Order } from '../types/order';
import { generatePremiumInvoiceHTML } from '../components/admin/InvoicePrint';
import { useApp } from '../hooks/useApp';

export const InvoicePage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasTriggeredAutoPrint = useRef(false);

  const autoPrint = searchParams.get('autoPrint') === '1';
  const safeOrderNumber = orderNumber ? decodeURIComponent(orderNumber) : '';

  useEffect(() => {
    let isActive = true;

    const loadOrder = async () => {
      if (!safeOrderNumber) {
        setError('Missing order number.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await orderService.getOrderByNumber(safeOrderNumber);
        if (!isActive) return;

        if (!response.data) {
          setError('Order not found.');
          setOrder(null);
          return;
        }

        setOrder(response.data);
      } catch (err: any) {
        if (!isActive) return;
        const message = err?.message || 'Failed to load invoice.';
        setError(message);
        setOrder(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadOrder();

    return () => {
      isActive = false;
    };
  }, [safeOrderNumber]);

  const invoiceHtml = useMemo(() => {
    if (!order) return '';
    return generatePremiumInvoiceHTML(order, isArabic);
  }, [order, isArabic]);

  useEffect(() => {
    if (!autoPrint || !frameLoaded || !invoiceHtml || hasTriggeredAutoPrint.current) {
      return;
    }

    hasTriggeredAutoPrint.current = true;
    const timer = window.setTimeout(() => {
      const frameWindow = iframeRef.current?.contentWindow;
      if (frameWindow) {
        frameWindow.focus();
        frameWindow.print();
        return;
      }
      window.print();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoPrint, frameLoaded, invoiceHtml]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-gray-600">
        Loading invoice...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to load invoice</h1>
          <p className="text-gray-600">{error || 'The requested order could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <iframe
        ref={iframeRef}
        title={`Invoice ${order.orderNumber}`}
        srcDoc={invoiceHtml}
        onLoad={() => setFrameLoaded(true)}
        className="block w-full min-h-screen border-0"
      />
    </div>
  );
};

