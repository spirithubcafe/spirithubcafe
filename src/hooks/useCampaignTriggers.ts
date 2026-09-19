import { useEffect } from 'react';

export interface CampaignTriggerConfiguration {
  delayMs: number | null;
  scrollPercentage: number | null;
  exitIntent: boolean;
}

export const getCampaignTriggerConfiguration = (campaign: {
  triggerType: string;
  triggerDelaySeconds: number | null;
  scrollPercentage: number | null;
  exitIntentEnabled: boolean;
}, isMobile: boolean): CampaignTriggerConfiguration => {
  const type = campaign.triggerType.trim().toUpperCase();
  const delayValid = type === 'DELAY' && Number.isFinite(campaign.triggerDelaySeconds) && campaign.triggerDelaySeconds! >= 0 && campaign.triggerDelaySeconds! <= 86400;
  const scrollValid = type === 'SCROLL' && Number.isFinite(campaign.scrollPercentage) && campaign.scrollPercentage! >= 0 && campaign.scrollPercentage! <= 100;
  return {
    delayMs: delayValid ? campaign.triggerDelaySeconds! * 1000 : null,
    scrollPercentage: scrollValid ? campaign.scrollPercentage : null,
    exitIntent: campaign.exitIntentEnabled && !isMobile,
  };
};

export function useCampaignTriggers(
  enabled: boolean,
  config: CampaignTriggerConfiguration,
  onTrigger: () => void,
) {
  useEffect(() => {
    if (!enabled || config.delayMs == null) return;
    const timer = window.setTimeout(onTrigger, config.delayMs);
    return () => window.clearTimeout(timer);
  }, [config.delayMs, enabled, onTrigger]);

  useEffect(() => {
    if (!enabled || config.scrollPercentage == null) return;
    const threshold = config.scrollPercentage;
    const onScroll = () => {
      const scrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const progress = scrollable === 0 ? 100 : Math.min(100, Math.max(0, window.scrollY / scrollable * 100));
      if (progress >= threshold) onTrigger();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [config.scrollPercentage, enabled, onTrigger]);

  useEffect(() => {
    if (!enabled || !config.exitIntent) return;
    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 8 && !event.relatedTarget) onTrigger();
    };
    document.addEventListener('mouseout', onMouseLeave);
    return () => document.removeEventListener('mouseout', onMouseLeave);
  }, [config.exitIntent, enabled, onTrigger]);
}
