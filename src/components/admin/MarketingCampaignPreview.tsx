import type { MarketingCampaignTranslationInput } from '../../types/marketingCampaign';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../hooks/useApp';

interface MarketingCampaignPreviewProps {
  translation: MarketingCampaignTranslationInput;
  language: 'en' | 'ar';
}

export function MarketingCampaignPreview({ translation, language }: MarketingCampaignPreviewProps) {
  const { t } = useApp();
  const isArabic = language === 'ar';
  return (
    <Card className="overflow-hidden border-primary/20 bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {t('admin.marketingCampaigns.adminPreview')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="mx-auto max-w-md rounded-2xl border bg-background p-6 text-center shadow-sm"
        >
          <div className="mb-2 text-xl font-bold">{translation.headline || (isArabic ? 'العنوان' : 'Headline')}</div>
          <p className="mb-5 whitespace-pre-line text-sm text-muted-foreground">
            {translation.description || (isArabic ? 'وصف الحملة' : 'Campaign description')}
          </p>
          <div className="mb-3 rounded-md border bg-muted/30 px-3 py-2 text-start text-sm text-muted-foreground">
            {translation.emailPlaceholder || (isArabic ? 'البريد الإلكتروني' : 'Email address')}
          </div>
          <div className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            {translation.buttonText || (isArabic ? 'إرسال' : 'Submit')}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {translation.closeText || (isArabic ? 'لاحقاً' : 'Maybe later')}
          </div>
          {translation.termsText && <p className="mt-4 text-xs text-muted-foreground">{translation.termsText}</p>}
          <div className="mt-5 border-t pt-4">
            <div className="font-semibold">{translation.successTitle || (isArabic ? 'تم بنجاح' : 'Success')}</div>
            <p className="mt-1 text-sm text-muted-foreground">{translation.successMessage}</p>
            {translation.successButtonText && (
              <div className="mt-3 inline-flex rounded-md border px-3 py-1.5 text-xs font-medium">
                {translation.successButtonText}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
