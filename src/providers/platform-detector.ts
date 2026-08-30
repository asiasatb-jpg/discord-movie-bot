import { isSafeUrl } from '../utils/ssrf.validator.js';
import { PlatformDetectionResult } from '../types/movie.types.js';

interface WhitelistDomainRule {
  platformName: string;
  domainMatch: (host: string) => boolean;
  parse: (url: URL) => { extractedId?: string; searchQueryHint?: string };
}

const WHITELIST_PROVIDERS: WhitelistDomainRule[] = [
  {
    platformName: 'Netflix',
    domainMatch: (host) => host.includes('netflix.com'),
    parse: (url) => {
      // e.g. https://www.netflix.com/title/70136122 or /watch/70136122
      const match = url.pathname.match(/\/(?:title|watch)\/(\d+)/i);
      return { extractedId: match ? match[1] : undefined };
    },
  },
  {
    platformName: 'Amazon Prime Video',
    domainMatch: (host) => host.includes('primevideo.com') || host.includes('amazon.com'),
    parse: (url) => {
      // e.g. https://www.primevideo.com/detail/0S301Q5... or /gp/video/detail/B0...
      const match = url.pathname.match(/\/(?:detail|gp\/video\/detail)\/([a-zA-Z0-9_-]+)/i);
      return { extractedId: match ? match[1] : undefined };
    },
  },
  {
    platformName: 'Disney+',
    domainMatch: (host) => host.includes('disneyplus.com'),
    parse: (url) => {
      // e.g. https://www.disneyplus.com/movies/interstellar/XXXXX
      const match = url.pathname.match(/\/(?:movies|series|video)\/([^/]+)/i);
      const titleHint = match ? match[1].replace(/-/g, ' ') : undefined;
      return { searchQueryHint: titleHint };
    },
  },
  {
    platformName: 'Apple TV+',
    domainMatch: (host) => host.includes('tv.apple.com'),
    parse: (url) => {
      // e.g. https://tv.apple.com/us/movie/interstellar/umc.cmc.XXXX
      const match = url.pathname.match(/\/movie\/([^/]+)/i);
      const titleHint = match ? match[1].replace(/-/g, ' ') : undefined;
      return { searchQueryHint: titleHint };
    },
  },
  {
    platformName: 'YouTube Movies',
    domainMatch: (host) => host.includes('youtube.com') || host.includes('youtu.be'),
    parse: (url) => {
      // e.g. https://www.youtube.com/watch?v=XXXX or /movie/XXXX
      if (url.searchParams.has('v')) {
        return { extractedId: url.searchParams.get('v') || undefined };
      }
      const match = url.pathname.match(/\/(?:watch|movie|v)\/([a-zA-Z0-9_-]+)/i);
      return { extractedId: match ? match[1] : undefined };
    },
  },
  {
    platformName: 'Google TV / Google Play Movies',
    domainMatch: (host) => host.includes('play.google.com'),
    parse: (url) => {
      const match = url.pathname.match(/\/store\/movies\/details\/([^?]+)/i);
      const titleHint = match ? decodeURIComponent(match[1]).replace(/_/g, ' ') : undefined;
      return { searchQueryHint: titleHint };
    },
  },
  {
    platformName: 'HBO Max',
    domainMatch: (host) => host.includes('hbomax.com') || host.includes('max.com'),
    parse: (url) => {
      const match = url.pathname.match(/\/(?:feature|movie)\/([a-zA-Z0-9_-]+)/i);
      return { extractedId: match ? match[1] : undefined };
    },
  },
  {
    platformName: 'Vidio',
    domainMatch: (host) => host.includes('vidio.com'),
    parse: (url) => {
      // e.g. https://www.vidio.com/premier/XXXX/movie-name
      const match = url.pathname.match(/\/premier\/\d+\/([^/?]+)/i);
      const titleHint = match ? match[1].replace(/-/g, ' ') : undefined;
      return { searchQueryHint: titleHint };
    },
  },
  {
    platformName: 'Hulu',
    domainMatch: (host) => host.includes('hulu.com'),
    parse: (url) => {
      const match = url.pathname.match(/\/movie\/([^/?]+)/i);
      const titleHint = match ? match[1].replace(/-/g, ' ') : undefined;
      return { searchQueryHint: titleHint };
    },
  },
  {
    platformName: 'Crunchyroll',
    domainMatch: (host) => host.includes('crunchyroll.com'),
    parse: (url) => {
      const match = url.pathname.match(/\/series\/([a-zA-Z0-9_-]+)\/([^/?]+)/i);
      const titleHint = match ? match[2].replace(/-/g, ' ') : undefined;
      return { searchQueryHint: titleHint };
    },
  },
];

export class PlatformDetector {
  /**
   * Evaluates if a given URL belongs to a legal whitelisted streaming provider
   */
  public detect(rawUrl: string): PlatformDetectionResult {
    const safetyCheck = isSafeUrl(rawUrl);
    if (!safetyCheck.isValid || !safetyCheck.parsedUrl) {
      return { isSupported: false };
    }

    const url = safetyCheck.parsedUrl;
    const hostname = url.hostname.toLowerCase();

    for (const rule of WHITELIST_PROVIDERS) {
      if (rule.domainMatch(hostname)) {
        const parsed = rule.parse(url);
        return {
          isSupported: true,
          platformName: rule.platformName,
          platformDomain: hostname,
          extractedId: parsed.extractedId,
          searchQueryHint: parsed.searchQueryHint,
          normalizedUrl: url.toString(),
        };
      }
    }

    return {
      isSupported: false,
      platformDomain: hostname,
    };
  }
}

export const platformDetector = new PlatformDetector();
