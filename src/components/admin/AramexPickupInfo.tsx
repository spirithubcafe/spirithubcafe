import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  PackageCheck, 
  Copy, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { motion } from 'framer-motion';
import type { Order } from '../../types/order';

interface AramexPickupInfoProps {
  order: Order;
  isArabic: boolean;
  onPickupCancelled?: () => void;
}

export const AramexPickupInfo: React.FC<AramexPickupInfoProps> = ({
  order,
  isArabic,
  onPickupCancelled
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Check if order uses Aramex shipping
  const isAramexShipping = order.shippingMethod === 3;
  const hasPickup = !!order.pickupReference;
  const hasTracking = !!order.trackingNumber;

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle pickup cancellation
  const handleCancelPickup = async () => {
    if (!order.pickupGUID) {
      setCancelError(isArabic ? 'معرف الاستلام غير موجود' : 'Pickup GUID not found');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      // Import aramex service dynamically to avoid circular dependencies
      const { cancelAramexPickup } = await import('../../services/aramexService');
      
      const response = await cancelAramexPickup(order.pickupGUID);

      if (response.success) {
        setShowCancelDialog(false);
        
        // Show success message
        if (onPickupCancelled) {
          onPickupCancelled();
        }
      } else {
        setCancelError(
          response.message || 
          (isArabic ? 'فشل إلغاء الاستلام' : 'Failed to cancel pickup')
        );
      }
    } catch (error: any) {
      console.error('Error cancelling pickup:', error);
      setCancelError(
        error.message || 
        (isArabic ? 'حدث خطأ أثناء إلغاء الاستلام' : 'Error cancelling pickup')
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // Don't show component if not Aramex shipping
  if (!isAramexShipping) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={hasPickup ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className={`h-5 w-5 ${hasPickup ? 'text-green-600' : 'text-orange-600'}`} />
                <span>{isArabic ? 'معلومات الاستلام - أرامكس' : 'Aramex Pickup Information'}</span>
              </div>
              
              {hasPickup && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {isArabic ? 'إجراءات' : 'Actions'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                      {isArabic ? 'إدارة الاستلام' : 'Pickup Management'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(order.pickupReference!, 'reference')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {isArabic ? 'نسخ رقم الاستلام' : 'Copy Pickup ID'}
                    </DropdownMenuItem>
                    
                    {order.pickupGUID && (
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(order.pickupGUID!, 'guid')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {isArabic ? 'نسخ GUID' : 'Copy GUID'}
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => setShowCancelDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isArabic ? 'إلغاء الاستلام' : 'Cancel Pickup'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Pickup Status */}
            <div className="mb-4">
              {hasPickup ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? 'تم تسجيل الاستلام' : 'Pickup Registered'}
                </Badge>
              ) : hasTracking ? (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isArabic ? 'الشحنة جاهزة ولكن الاستلام غير مسجل' : 'Shipment Ready but Pickup Not Registered'}
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 border-gray-200 px-3 py-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  {isArabic ? 'لم يتم إنشاء الشحنة بعد' : 'Shipment Not Created Yet'}
                </Badge>
              )}
            </div>

            {/* Pickup Details */}
            {hasPickup && (
              <div className="space-y-4">
                {/* Pickup Reference */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {isArabic ? 'رقم الاستلام' : 'Pickup Reference'}
                    </p>
                    <p className="font-mono font-bold text-lg text-green-700">
                      {order.pickupReference}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(order.pickupReference!, 'reference')}
                  >
                    {copiedField === 'reference' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 ml-2 text-xs">
                          {isArabic ? 'تم النسخ!' : 'Copied!'}
                        </span>
                      </>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Pickup GUID (Admin Only) */}
                {order.pickupGUID && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      {isArabic ? 'معرف الاستلام الفريد (GUID)' : 'Pickup GUID'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-gray-600 break-all flex-1">
                        {order.pickupGUID}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.pickupGUID!, 'guid')}
                        className="ml-2 shrink-0"
                      >
                        {copiedField === 'guid' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Information Note */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    {isArabic ? (
                      <>
                        <strong>ملاحظة:</strong> تم تسجيل طلب الاستلام بنجاح مع أرامكس. 
                        سيقوم السائق بزيارة عنوانك لاستلام الشحنة.
                      </>
                    ) : (
                      <>
                        <strong>Note:</strong> Pickup request has been successfully registered with Aramex. 
                        A courier will visit your address to collect the shipment.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Warning when shipment exists but no pickup */}
            {hasTracking && !hasPickup && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-800 mb-1">
                      {isArabic ? 'تحذير: الاستلام غير مسجل' : 'Warning: Pickup Not Registered'}
                    </p>
                    <p className="text-sm text-orange-700">
                      {isArabic ? (
                        <>
                          تم إنشاء الشحنة برقم تتبع <span className="font-mono font-bold">{order.trackingNumber}</span> 
                          ولكن لم يتم تسجيل طلب الاستلام. يرجى التواصل مع فريق الدعم.
                        </>
                      ) : (
                        <>
                          Shipment created with tracking number <span className="font-mono font-bold">{order.trackingNumber}</span> 
                          but pickup request was not registered. Please contact support team.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No shipment created yet */}
            {!hasTracking && !hasPickup && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  {isArabic ? (
                    'لم يتم إنشاء شحنة أرامكس لهذا الطلب بعد.'
                  ) : (
                    'Aramex shipment has not been created for this order yet.'
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cancel Pickup Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? 'تأكيد إلغاء الاستلام' : 'Confirm Pickup Cancellation'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {isArabic ? (
                    <>
                      هل أنت متأكد من رغبتك في إلغاء طلب الاستلام رقم{' '}
                      <span className="font-mono font-bold text-black">{order.pickupReference}</span>؟
                    </>
                  ) : (
                    <>
                      Are you sure you want to cancel pickup request{' '}
                      <span className="font-mono font-bold text-black">{order.pickupReference}</span>?
                    </>
                  )}
                </p>
                
                {cancelError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {cancelError}
                    </p>
                  </div>
                )}
                
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    {isArabic ? (
                      <>
                        <strong>تحذير:</strong> سيؤدي هذا الإجراء إلى إلغاء طلب الاستلام في نظام أرامكس. 
                        لن يقوم السائق بزيارتك لاستلام الشحنة.
                      </>
                    ) : (
                      <>
                        <strong>Warning:</strong> This will cancel the pickup request in Aramex system. 
                        The courier will not visit to collect the shipment.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelPickup}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isArabic ? 'جاري الإلغاء...' : 'Cancelling...'}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isArabic ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
