import { REGION_INFO } from '../config/regionInfo.ts';
import type { RegionCode } from './regionUtils.ts';

/**
 * Deterministic business answers for Phase 2A. Every fact (hours, address, map link) comes from
 * REGION_INFO; nothing is hard-coded here, and nothing is invented for refund, cancellation, payment or
 * allergy questions - those only hand the customer to support.
 */

const contactFor = (region: RegionCode) => (REGION_INFO[region] ?? REGION_INFO.om).contact;

export const buildHoursMessage = (region: RegionCode, isAr: boolean): string => {
  const contact = contactFor(region);
  const hours = isAr ? contact.workingHours.ar : contact.workingHours.en;
  const address = isAr ? contact.address.ar : contact.address.en;

  return isAr
    ? ['\u0647\u0630\u0647 \u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644 \u0644\u062f\u064a\u0646\u0627:', '', `- **\u0627\u0644\u0639\u0645\u0644:** ${hours}`, `- **\u0627\u0644\u0645\u0648\u0642\u0639:** ${address}`].join('\n')
    : ['Here are our opening hours:', '', `- **Working hours:** ${hours}`, `- **Location:** ${address}`].join('\n');
};

export const buildLocationMessage = (region: RegionCode, isAr: boolean): string => {
  const contact = contactFor(region);
  const address = isAr ? contact.address.ar : contact.address.en;

  return isAr
    ? ['\u0647\u0630\u0627 \u0645\u0648\u0642\u0639\u0646\u0627:', '', `- **\u0627\u0644\u0639\u0646\u0648\u0627\u0646:** ${address}`, `- **\u0627\u0644\u062e\u0631\u064a\u0637\u0629:** ${contact.googleMapsUrl}`].join('\n')
    : ['Here is where you can find us:', '', `- **Address:** ${address}`, `- **Google Maps:** ${contact.googleMapsUrl}`].join('\n');
};

/** Neutral opening line shown above the contact details for complaints and high-risk questions. */
export const buildSupportPrefix = (intent: string | undefined, isAr: boolean): string => {
  if (intent === 'complaint') {
    return isAr
      ? '\u0646\u0623\u0633\u0641 \u0644\u0633\u0645\u0627\u0639 \u0630\u0644\u0643.'
      : "I'm sorry to hear that.";
  }

  if (intent === 'sensitive_support') {
    return isAr
      ? '\u064a\u0645\u0643\u0646 \u0644\u0641\u0631\u064a\u0642\u0646\u0627 \u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631\u0629.'
      : 'Our team can help you with this directly.';
  }

  return '';
};

export const buildClarifyMessage = (isAr: boolean): string =>
  isAr
    ? '\u0644\u0645 \u0623\u0641\u0647\u0645 \u0637\u0644\u0628\u0643 \u062a\u0645\u0627\u0645\u0627\u064b. \u064a\u0645\u0643\u0646\u0646\u064a \u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0641\u064a \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0642\u0647\u0648\u0629 \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644 \u0623\u0648 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645. \u0645\u0627\u0630\u0627 \u062a\u062d\u062a\u0627\u062c\u061f'
    : 'I did not quite understand. I can help you choose coffee, share delivery information and opening hours, or connect you with support. What do you need?';

export const buildToolLimitMessage = (isAr: boolean, hasProducts: boolean): string => {
  if (hasProducts) {
    return isAr ? '\u0625\u0644\u064a\u0643 \u0623\u0642\u0631\u0628 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u062a\u064a \u0648\u062c\u062f\u062a\u0647\u0627:' : 'Here are the closest matches I found:';
  }

  return isAr
    ? '\u062a\u0639\u0630\u0651\u0631 \u0625\u062a\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u064a\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062f\u0629 \u0635\u064a\u0627\u063a\u062a\u0647 \u0623\u0648 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645.'
    : "I couldn't finish that request. You can rephrase it or contact support.";
};
