import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { getCampaignTriggerConfiguration, useCampaignTriggers } from '../../hooks/useCampaignTriggers';
import { getMarketingCampaignSessionId, getMarketingCampaignVisitorId } from '../../lib/marketingCampaignIdentity';
import { publicMarketingCampaignService } from '../../services/publicMarketingCampaignService';
import { isMarketingCampaignRouteEligible, type PublicCampaignDevice, type PublicCampaignEventType, type PublicCampaignLanguage, type PublicCampaignSubmitResponse, type PublicMarketingCampaign } from '../../types/publicMarketingCampaign';
import { MarketingCampaignPopup } from './MarketingCampaignPopup';

function useCampaignDevice(): PublicCampaignDevice {
  const classify = (): PublicCampaignDevice => window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
  const [device, setDevice] = useState<PublicCampaignDevice>(classify);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setDevice(media.matches ? 'mobile' : 'desktop');
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return device;
}

export default function MarketingCampaignHost() {
  const location = useLocation();
  const { language, t } = useApp();
  const device = useCampaignDevice();
  const apiLanguage: PublicCampaignLanguage = language === 'ar' ? 'ar' : 'en';
  const eligibleRoute = isMarketingCampaignRouteEligible(location.pathname);
  const [campaign, setCampaign] = useState<PublicMarketingCampaign | null>(null);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<PublicCampaignSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const openedRef = useRef(false);
  const viewRecordedRef = useRef(false);
  const closeRecordedRef = useRef(false);
  const submittingRef = useRef(false);
  const identityRef = useRef<{ visitorId: string; sessionId: string } | null>(null);
  const lifecycleRef = useRef(0);

  if (!identityRef.current && typeof window !== 'undefined') {
    try {
      identityRef.current = { visitorId: getMarketingCampaignVisitorId(), sessionId: getMarketingCampaignSessionId() };
    } catch {
      identityRef.current = null;
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    lifecycleRef.current += 1;
    openedRef.current = false;
    viewRecordedRef.current = false;
    closeRecordedRef.current = false;
    submittingRef.current = false;
    setOpen(false);
    setCampaign(null);
    setResult(null);
    setSubmitting(false);
    setSubmissionError('');

    if (!eligibleRoute || !identityRef.current) return () => controller.abort();

    void publicMarketingCampaignService.getActive({
      language: apiLanguage,
      page: location.pathname,
      device,
      visitorId: identityRef.current.visitorId,
      signal: controller.signal,
    }).then((activeCampaign) => {
      if (!controller.signal.aborted) setCampaign(activeCampaign);
    }).catch(() => {
      if (!controller.signal.aborted) setCampaign(null);
    });

    return () => controller.abort();
  }, [apiLanguage, device, eligibleRoute, location.pathname]);

  const triggerConfig = useMemo(
    () => campaign ? getCampaignTriggerConfiguration(campaign, device === 'mobile') : { delayMs: null, scrollPercentage: null, exitIntent: false },
    [campaign, device],
  );
  const hasTrigger = triggerConfig.delayMs != null || triggerConfig.scrollPercentage != null || triggerConfig.exitIntent;

  const track = useCallback((eventType: PublicCampaignEventType) => {
    if (!campaign || !identityRef.current) return;
    void publicMarketingCampaignService.trackEvent(campaign.id, {
      eventType,
      sessionId: identityRef.current.sessionId,
      visitorId: identityRef.current.visitorId,
      languageCode: apiLanguage,
      pageUrl: location.pathname,
      variantKey: campaign.variantKey,
    }).catch(() => undefined);
  }, [apiLanguage, campaign, location.pathname]);

  const openCampaign = useCallback(() => {
    if (!campaign || openedRef.current || !hasTrigger) return;
    openedRef.current = true;
    setOpen(true);
  }, [campaign, hasTrigger]);

  useEffect(() => {
    if (!open || viewRecordedRef.current) return;
    viewRecordedRef.current = true;
    track('VIEW');
  }, [open, track]);

  useCampaignTriggers(Boolean(campaign) && !open && !openedRef.current && hasTrigger, triggerConfig, openCampaign);

  const dismiss = useCallback(() => {
    if (!open) return;
    if (!result && !closeRecordedRef.current) {
      closeRecordedRef.current = true;
      track('CLOSE');
    }
    setOpen(false);
  }, [open, result, track]);

  const submit = useCallback(async (email: string) => {
    if (!campaign || !identityRef.current || submittingRef.current) return;
    submittingRef.current = true;
    const generation = lifecycleRef.current;
    setSubmitting(true);
    setSubmissionError('');
    track('CTA_CLICK');
    try {
      const response = await publicMarketingCampaignService.submit(campaign.id, {
        email,
        languageCode: apiLanguage,
        sessionId: identityRef.current.sessionId,
        visitorId: identityRef.current.visitorId,
        page: location.pathname,
        device,
      });
      if (generation === lifecycleRef.current) setResult(response);
    } catch {
      if (generation === lifecycleRef.current) setSubmissionError(t('marketingCampaign.submitError'));
    } finally {
      if (generation === lifecycleRef.current) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }, [apiLanguage, campaign, device, location.pathname, t, track]);

  if (!campaign || !hasTrigger || !identityRef.current) return null;
  return <MarketingCampaignPopup campaign={campaign} open={open} submitting={submitting} error={submissionError} result={result} onDismiss={dismiss} onSubmit={submit} />;
}
