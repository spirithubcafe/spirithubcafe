import { useState } from 'react';
import { Check, Clipboard, Coffee, Loader2, Mail } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import type { PublicCampaignSubmitResponse, PublicMarketingCampaign } from '../../types/publicMarketingCampaign';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface MarketingCampaignPopupProps {
  campaign: PublicMarketingCampaign;
  open: boolean;
  submitting: boolean;
  error: string;
  result: PublicCampaignSubmitResponse | null;
  onDismiss: () => void;
  onSubmit: (email: string) => Promise<void>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MarketingCampaignPopup({ campaign, open, submitting, error, result, onDismiss, onSubmit }: MarketingCampaignPopupProps) {
  const { t, language } = useApp();
  const isArabic = language === 'ar';
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [copied, setCopied] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = email.trim();
    if (!EMAIL_PATTERN.test(normalized)) {
      setValidationError(t('marketingCampaign.invalidEmail'));
      return;
    }
    setValidationError('');
    void onSubmit(normalized);
  };

  const copyCode = async () => {
    if (!result?.discountCode) return;
    try {
      await navigator.clipboard.writeText(result.discountCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onDismiss(); }}>
      <DialogContent
        dir={isArabic ? 'rtl' : 'ltr'}
        mobileFullScreen
        className="overflow-hidden border-amber-900/10 bg-background p-0 sm:max-w-xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-background to-orange-50 px-6 py-8 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -end-16 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-sm">
              <Coffee className="h-6 w-6" aria-hidden="true" />
            </div>
            {!result ? (
              <>
                <DialogHeader className={isArabic ? 'text-right sm:text-right' : 'text-left sm:text-left'}>
                  <DialogTitle className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{campaign.headline}</DialogTitle>
                  <DialogDescription className="whitespace-pre-line text-sm leading-6 text-muted-foreground sm:text-base">{campaign.description || t('marketingCampaign.descriptionFallback')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor={`campaign-email-${campaign.id}`}>{t('marketingCampaign.emailLabel')}</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <Input id={`campaign-email-${campaign.id}`} type="email" autoComplete="email" inputMode="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={campaign.emailPlaceholder || t('marketingCampaign.emailPlaceholder')} className="h-12 ps-10" disabled={submitting} autoFocus />
                    </div>
                  </div>
                  <div aria-live="polite" className="min-h-5 text-sm text-destructive">{validationError || error}</div>
                  <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting}>
                    {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{campaign.buttonText}
                  </Button>
                  {campaign.closeText && <button type="button" className="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={onDismiss}>{campaign.closeText}</button>}
                  {campaign.termsText && <p className="text-center text-xs leading-5 text-muted-foreground">{campaign.termsText}</p>}
                </form>
              </>
            ) : (
              <div aria-live="polite" className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-7 w-7" /></div>
                <DialogHeader className="text-center sm:text-center"><DialogTitle className="text-2xl font-bold">{result.successTitle}</DialogTitle><DialogDescription className="whitespace-pre-line text-sm leading-6 sm:text-base">{result.successMessage}</DialogDescription></DialogHeader>
                {result.discountCode && <div className="rounded-xl border border-dashed border-primary/30 bg-background/80 p-4"><p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('marketingCampaign.discountCode')}</p><div className="flex items-center justify-center gap-2"><code className="rounded-md bg-muted px-4 py-2 text-lg font-bold tracking-widest">{result.discountCode}</code><Button type="button" variant="outline" size="icon" onClick={() => void copyCode()} aria-label={t('marketingCampaign.copyCode')}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</Button></div>{copied && <p className="mt-2 text-xs text-primary">{t('marketingCampaign.copied')}</p>}{result.discountType && result.discountValue != null && <p className="mt-3 text-sm text-foreground">{t('marketingCampaign.discountValue')}: {result.discountType === 'PERCENTAGE' ? `${result.discountValue}%` : result.discountValue}</p>}{result.minimumOrderAmount != null && <p className="mt-1 text-xs text-muted-foreground">{t('marketingCampaign.minimumOrder')}: {result.minimumOrderAmount}</p>}<p className="mt-3 text-xs text-muted-foreground">{t('marketingCampaign.displayOnly')}</p></div>}
                <Button type="button" size="lg" className="w-full" onClick={onDismiss}>{result.successButtonText || t('marketingCampaign.done')}</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
