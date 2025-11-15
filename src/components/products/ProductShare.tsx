import React, { useState } from 'react';
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface ProductShareProps {
  productName: string;
  productUrl: string;
  productDescription?: string;
  language?: string;
}

export const ProductShare: React.FC<ProductShareProps> = ({
  productName,
  productUrl,
  productDescription,
  language = 'en',
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const shareText = language === 'ar'
    ? `تحقق من ${productName} في سبيريت هب كافيه`
    : `Check out ${productName} at Spirit Hub Cafe`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareText);
    const body = encodeURIComponent(
      `${shareText}\n\n${productDescription || ''}\n\n${productUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${productUrl}`)}`;
    window.open(url, '_blank');
  };

  // Web Share API for mobile devices
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="group relative overflow-hidden border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Share2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
          <span className="relative z-10">
            {language === 'ar' ? 'مشاركة' : 'Share'}
          </span>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-600" />
            {language === 'ar' ? 'مشاركة المنتج' : 'Share Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-1.5">
          {/* Social Media Options - Compact Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={shareOnFacebook}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 hover:bg-blue-50 transition-all duration-200"
              title="Facebook"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-200 shadow-md">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Facebook</span>
            </button>

            <button
              onClick={shareOnTwitter}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 hover:bg-sky-50 transition-all duration-200"
              title="Twitter"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-500 group-hover:bg-sky-600 group-hover:scale-110 transition-all duration-200 shadow-md">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Twitter</span>
            </button>

            <button
              onClick={shareOnWhatsApp}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 hover:bg-green-50 transition-all duration-200"
              title="WhatsApp"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500 group-hover:bg-green-600 group-hover:scale-110 transition-all duration-200 shadow-md">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">WhatsApp</span>
            </button>

            <button
              onClick={shareOnLinkedIn}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 hover:bg-blue-50 transition-all duration-200"
              title="LinkedIn"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-700 group-hover:bg-blue-800 group-hover:scale-110 transition-all duration-200 shadow-md">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">LinkedIn</span>
            </button>

            <button
              onClick={shareViaEmail}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 hover:bg-gray-50 transition-all duration-200"
              title={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-600 group-hover:bg-gray-700 group-hover:scale-110 transition-all duration-200 shadow-md">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">
                {language === 'ar' ? 'إيميل' : 'Email'}
              </span>
            </button>

            <button
              onClick={copyToClipboard}
              className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 hover:bg-amber-50 transition-all duration-200"
              title={language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500 group-hover:bg-amber-600 group-hover:scale-110 transition-all duration-200 shadow-md">
                {isCopied ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-700">
                {isCopied
                  ? language === 'ar'
                    ? 'نُسخ'
                    : 'Copied'
                  : language === 'ar'
                  ? 'نسخ'
                  : 'Copy'}
              </span>
            </button>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">
                    {language === 'ar' ? 'أو' : 'Or'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleNativeShare}
                className="group flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 hover:bg-purple-50 transition-all duration-200 border border-purple-200"
              >
                <Share2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'المزيد من الخيارات' : 'More Options'}
                </span>
              </button>
            </>
          )}
        </div>
      </DialogContent>

      {/* Shimmer Animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Dialog>
  );
};
