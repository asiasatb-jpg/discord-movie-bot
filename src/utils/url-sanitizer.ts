import { URL } from 'url';

/**
 * List of known URL shorteners and ad-redirect domains that must be blocked
 */
const BLOCKED_SHORTENER_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'adf.ly',
  'ouo.io',
  'ouo.press',
  'shorte.st',
  'linkvertise.com',
  'bc.vc',
  'is.gd',
  'buff.ly',
  'cutt.ly',
  'rb.gy',
  't.co',
  'goo.gl',
  'ow.ly',
  'adfly.com',
  'flylink.io',
];

/**
 * Tracking, affiliate, and analytics query parameters to strip completely
 */
const TRACKING_QUERY_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'referrer',
  'referral',
  'affiliate_id',
  'aff_id',
  'aff',
  'click_id',
  'clickid',
  'tracking_id',
  'track_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'zanpid',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
];

/**
 * Sanitizes and cleans a URL, ensuring:
 * 1. No tracking query params (UTM, ref, affiliate, click_id)
 * 2. No ad-shorteners or link-locking redirect services
 * 3. Returns clean canonical URL
 */
export function sanitizeUrl(rawUrl?: string): { isValid: boolean; cleanUrl?: string; isShortener?: boolean } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false };
  }

  try {
    const url = new URL(rawUrl.trim());

    // Only allow standard http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { isValid: false };
    }

    const hostname = url.hostname.toLowerCase();

    // Check if domain is a URL shortener or ad redirector
    for (const shortener of BLOCKED_SHORTENER_DOMAINS) {
      if (hostname === shortener || hostname.endsWith(`.${shortener}`)) {
        return { isValid: false, isShortener: true };
      }
    }

    // Strip tracking and affiliate parameters
    for (const param of TRACKING_QUERY_PARAMS) {
      url.searchParams.delete(param);
    }

    // Also strip any query starting with utm_ or aff_
    const keysToDelete: string[] = [];
    url.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_') || lower.startsWith('aff_') || lower.startsWith('tracking_')) {
        keysToDelete.push(key);
      }
    });
    for (const k of keysToDelete) {
      url.searchParams.delete(k);
    }

    return {
      isValid: true,
      cleanUrl: url.toString(),
    };
  } catch {
    return { isValid: false };
  }
}
