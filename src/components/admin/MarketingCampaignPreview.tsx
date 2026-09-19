import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { MarketingCampaignTranslationInput } from '../../types/marketingCampaign';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../hooks/useApp';

interface MarketingCampaignPreviewProps {
  translation: MarketingCampaignTranslationInput;
  language: 'en' | 'ar';
}

type PreviewState = 'signup' | 'success';

export function MarketingCampaignPreview({ translation, language }: MarketingCampaignPreviewProps) {
  const { t } = useApp();
  const [previewState, setPreviewState] = useState<PreviewState>('signup');
  const isArabic = language === 'ar';
  const copy = isArabic
    ? {
        signup: 'التسجيل', success: 'النجاح', headline: 'العنوان', description: 'وصف الحملة',
        emailPlaceholder: 'البريد الإلكتروني', submit: 'إرسال', close: 'ربما لاحقاً',
        successTitle: 'تم بنجاح', successMessage: 'شكراً لانضمامك إلينا.',
        successButton: 'متابعة التسوق', closePreview: 'إغلاق المعاينة',
      }
    : {
        signup: 'Signup', success: 'Success', headline: 'Headline', description: 'Campaign description',
        emailPlaceholder: 'Email address', submit: 'Submit', close: 'Maybe later',
        successTitle: 'Success', successMessage: 'Thank you for joining us.',
        successButton: 'Continue shopping', closePreview: 'Close preview',
      };
  const signupEmailPlaceholder = translation.emailPlaceholder || copy.emailPlaceholder;
  const successContent = {
    heading: translation.successTitle || copy.successTitle,
    description: translation.successMessage || copy.successMessage,
    buttonLabel: translation.successButtonText || copy.successButton,
  };

  return (
    <Card className="overflow-hidden border-primary/15 bg-muted/15">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
            {t('admin.marketingCampaigns.adminPreview')}
          </CardTitle>
          <div className="inline-flex rounded-lg border bg-background p-1 shadow-xs" role="group" aria-label="Preview state">
            {(['signup', 'success'] as const).map((state) => (
              <button
                key={state}
                type="button"
                aria-pressed={previewState === state}
                onClick={() => setPreviewState(state)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewState === state
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {copy[state]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-muted/25 px-3 py-7 sm:px-7 sm:py-10">
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          lang={language}
          className={`relative mx-auto w-full max-w-[470px] rounded-2xl border border-border/70 bg-background px-6 py-8 text-start shadow-lg sm:px-10 sm:py-10 ${
            isArabic ? 'font-[Cairo] leading-relaxed' : ''
          }`}
        >
          <button
            type="button"
            aria-label={copy.closePreview}
            className="absolute end-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          {previewState === 'signup' ? (
            <div className="space-y-6 pt-3">
              <div className="space-y-3 pe-7">
                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                  {translation.headline || copy.headline}
                </h3>
                <p className={`whitespace-pre-line text-sm text-muted-foreground ${isArabic ? 'leading-7' : 'leading-6'}`}>
                  {translation.description || copy.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex min-h-12 items-center rounded-lg border border-input bg-background px-4 text-sm text-muted-foreground shadow-xs">
                  {signupEmailPlaceholder}
                </div>
                <div className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 text-center text-sm font-semibold text-primary-foreground shadow-sm">
                  {translation.buttonText || copy.submit}
                </div>
              </div>

              <div className="space-y-3 text-center">
                <div className="text-xs font-medium text-muted-foreground">
                  {translation.closeText || copy.close}
                </div>
                {translation.termsText && (
                  <p className={`text-[11px] text-muted-foreground/80 ${isArabic ? 'leading-6' : 'leading-5'}`}>
                    {translation.termsText}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center py-4 text-center">
              <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-6" strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                {successContent.heading}
              </h3>
              <p className={`mt-3 max-w-sm whitespace-pre-line text-sm text-muted-foreground ${isArabic ? 'leading-7' : 'leading-6'}`}>
                {successContent.description}
              </p>
              <div className="mt-6 flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-center text-sm font-semibold text-primary-foreground shadow-sm">
                {successContent.buttonLabel}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
