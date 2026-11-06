/**
 * Company and contact details shown on the site and in the legal pages.
 *
 * Nothing here is filled in. Every "[NOT SET: ...]" value must be replaced by
 * the owner with real, checked details before the site goes live.
 */
export const siteConfig = {
  siteName: 'SelfPressBooks',
  domain: 'selfpressbooks.com',
  tagline: 'Publish your book. We print it on demand and post it to readers in the UK.',

  companyName: '[NOT SET: company name]',
  companyNumber: '[NOT SET: company registration number]',
  registeredAddress: '[NOT SET: registered address]',
  vatNumber: '[NOT SET: VAT number, or remove if not VAT registered]',
  contactEmail: '[NOT SET: contact email]',
  dataProtectionContact: '[NOT SET: data protection contact / ICO registration number]',
  governingLaw: '[NOT SET: governing law, e.g. England and Wales]',

  /** Delivery estimate text used on product pages and the Delivery page. */
  deliveryEstimate: 'typically 7–14 days after printing', // owner to confirm

  /**
   * India Post tracking page URL with {tracking} placeholder, e.g. a URL the
   * owner has confirmed works. Left empty so no unverified link is shown.
   */
  trackingUrlTemplate: '', // [NOT SET: tracking URL template]
};

/** Replaces {{key}} tokens in content-page text with siteConfig values. */
export function fillSiteTokens(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key: string) => {
    const v = (siteConfig as Record<string, unknown>)[key];
    return typeof v === 'string' ? v : m;
  });
}
