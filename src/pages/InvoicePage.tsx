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
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasTriggeredAutoPrint = useRef(false);
  const pdfFileCacheRef = useRef<{ orderNumber: string; file: File } | null>(null);
  const pdfLibsRef = useRef<{
    html2canvas: (typeof import('html2canvas'))['default'];
    jsPDF: (typeof import('jspdf'))['jsPDF'];
  } | null>(null);

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
    const previousTitle = document.title;
    const titleOrderNumber = order?.orderNumber || safeOrderNumber;
    document.title = titleOrderNumber || 'Invoice';

    return () => {
      document.title = previousTitle;
    };
  }, [order?.orderNumber, safeOrderNumber]);

  useEffect(() => {
    if (!autoPrint || !frameLoaded || !invoiceHtml || hasTriggeredAutoPrint.current) {
      return;
    }

    hasTriggeredAutoPrint.current = true;
    setShowActionSheet(true);
  }, [autoPrint, frameLoaded, invoiceHtml]);

  useEffect(() => {
    return () => {
      pdfFileCacheRef.current = null;
    };
  }, []);

  const waitForDocumentReady = async (doc: Document) => {
    const images = Array.from(doc.images || []);
    const pendingImages = images.filter((img) => !img.complete);

    if (pendingImages.length) {
      await Promise.all(
        pendingImages.map(
          (img) =>
            new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
        ),
      );
    }

    if ('fonts' in doc) {
      try {
        await (doc as Document & { fonts?: FontFaceSet }).fonts?.ready;
      } catch {
        // Ignore font readiness errors and continue.
      }
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  };

  const generateInvoicePdfFile = async (): Promise<File> => {
    if (!order || !invoiceHtml) {
      throw new Error('Invoice is not ready yet.');
    }

    if (pdfFileCacheRef.current?.orderNumber === order.orderNumber) {
      return pdfFileCacheRef.current.file;
    }

    const desktopFrame = document.createElement('iframe');
    desktopFrame.setAttribute('aria-hidden', 'true');
    desktopFrame.style.position = 'fixed';
    desktopFrame.style.top = '-99999px';
    desktopFrame.style.left = '-99999px';
    desktopFrame.style.width = '1024px';
    desktopFrame.style.height = '1600px';
    desktopFrame.style.opacity = '0';
    desktopFrame.style.pointerEvents = 'none';
    desktopFrame.srcdoc = invoiceHtml;
    document.body.appendChild(desktopFrame);

    try {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => reject(new Error('Invoice rendering timed out.')), 15000);
        desktopFrame.onload = () => {
          window.clearTimeout(timeoutId);
          resolve();
        };
      });

      const doc = desktopFrame.contentDocument;
      if (!doc) throw new Error('Unable to load invoice document.');

      await waitForDocumentReady(doc);
      const pdfLibs = await (async () => {
        if (pdfLibsRef.current) return pdfLibsRef.current;
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ]);
        const libs = { html2canvas, jsPDF };
        pdfLibsRef.current = libs;
        return libs;
      })();

      const renderWidth = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth, 1024);
      const renderHeight = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, 1400);

      const canvas = await pdfLibs.html2canvas(doc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fafafa',
        width: renderWidth,
        height: renderHeight,
        windowWidth: renderWidth,
        windowHeight: renderHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const pdf = new pdfLibs.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const blob = pdf.output('blob');
      const file = new File([blob], `${order.orderNumber}.pdf`, { type: 'application/pdf' });
      pdfFileCacheRef.current = { orderNumber: order.orderNumber, file };
      return file;
    } finally {
      desktopFrame.remove();
    }
  };

  const handleShare = async () => {
    setShareMessage(null);
    setIsPreparingPdf(true);

    try {
      const pdfFile = await generateInvoicePdfFile();
      const openPdfForManualShare = () => {
        const fallbackUrl = URL.createObjectURL(pdfFile);
        const opened = window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          setShareMessage('Unable to open PDF. Please allow popups and try again.');
          return false;
        }
        window.setTimeout(() => URL.revokeObjectURL(fallbackUrl), 60000);
        setShareMessage('Direct share is blocked by this browser. PDF opened for manual sharing.');
        return true;
      };

      const fileShareSupported =
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] });

      if (navigator.share && fileShareSupported) {
        try {
          await navigator.share({
            title: `Invoice ${order?.orderNumber || safeOrderNumber}`,
            files: [pdfFile],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
          // Some browsers reject file-share in this context (transient activation/user-agent restrictions).
          openPdfForManualShare();
          return;
        }
      }

      openPdfForManualShare();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setShareMessage('Unable to prepare PDF right now.');
    } finally {
      setIsPreparingPdf(false);
    }
  };

  const handlePrint = async () => {
    setShareMessage(null);
    setIsPreparingPdf(true);

    try {
      const pdfFile = await generateInvoicePdfFile();
      const pdfUrl = URL.createObjectURL(pdfFile);
      const printWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

      if (!printWindow) {
        setShareMessage('Unable to open PDF. Please allow popups and try again.');
        return;
      }

      // Give the PDF viewer a moment to load before triggering print.
      window.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // If auto-print is blocked, user can print from the opened PDF viewer.
        }
      }, 700);
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    } catch (_err: any) {
      setShareMessage('Unable to prepare PDF for printing.');
    } finally {
      setIsPreparingPdf(false);
    }
  };

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

      {showActionSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center p-3">
          <div className="w-full sm:max-w-sm bg-white rounded-2xl shadow-xl p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Invoice actions</h2>
            <p className="text-sm text-gray-600 mb-4">Choose how you want to continue.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPreparingPdf}
                className="h-11 rounded-lg bg-[#2c2c2c] text-white text-sm font-medium disabled:opacity-60"
              >
                {isPreparingPdf ? 'Preparing...' : 'Print PDF'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={isPreparingPdf}
                className="h-11 rounded-lg bg-[#c8a97e] text-white text-sm font-medium disabled:opacity-60"
              >
                {isPreparingPdf ? 'Preparing...' : 'Share PDF'}
              </button>
            </div>
            {shareMessage && (
              <p className="mt-3 text-xs text-gray-600">{shareMessage}</p>
            )}
            <button
              type="button"
              onClick={() => setShowActionSheet(false)}
              className="mt-3 w-full h-10 rounded-lg border border-gray-300 text-sm text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
