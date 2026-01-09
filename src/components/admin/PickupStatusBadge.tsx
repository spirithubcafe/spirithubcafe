import React from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface PickupStatusBadgeProps {
  hasPickup: boolean;
  hasTracking: boolean;
  isAramex: boolean;
  pickupReference?: string;
  compact?: boolean;
  isArabic?: boolean;
}

export const PickupStatusBadge: React.FC<PickupStatusBadgeProps> = ({
  hasPickup,
  hasTracking,
  isAramex,
  pickupReference,
  compact = false,
  isArabic = false
}) => {
  // Don't show anything if not Aramex shipping
  if (!isAramex) {
    return null;
  }

  if (hasPickup && pickupReference) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        {compact ? (
          pickupReference
        ) : (
          <>
            {isArabic ? 'استلام: ' : 'Pickup: '}
            <span className="font-mono">{pickupReference}</span>
          </>
        )}
      </Badge>
    );
  }

  if (hasTracking && !hasPickup) {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-2 py-1 text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {isArabic ? 'بدون استلام' : 'No Pickup'}
      </Badge>
    );
  }

  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 px-2 py-1 text-xs">
      <XCircle className="h-3 w-3 mr-1" />
      {isArabic ? 'غير منشأ' : 'Not Created'}
    </Badge>
  );
};
