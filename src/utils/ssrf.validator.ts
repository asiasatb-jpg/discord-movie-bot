import { URL } from 'url';
import net from 'net';

/**
 * List of disallowed private/loopback IP blocks
 */
const PRIVATE_IPV4_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },         // 10.0.0.0/8
  { start: '172.16.0.0', end: '172.31.255.255' },      // 172.16.0.0/12
  { start: '192.168.0.0', end: '192.168.255.255' },    // 192.168.0.0/16
  { start: '127.0.0.0', end: '127.255.255.255' },      // 127.0.0.0/8 (Loopback)
  { start: '169.254.0.0', end: '169.254.255.255' },    // 169.254.0.0/16 (Link-local / AWS metadata)
  { start: '0.0.0.0', end: '0.255.255.255' },          // 0.0.0.0/8
];

function ipToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const ipNum = ipToNumber(ip);
  for (const range of PRIVATE_IPV4_RANGES) {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');
  // Loopback (::1), link-local (fe80::), unique local (fc00::, fd00::)
  return (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fe80:') ||
    lower.startsWith('fc00:') ||
    lower.startsWith('fd00:')
  );
}

/**
 * Validates a user-provided URL against SSRF and private network attacks.
 */
export function isSafeUrl(rawUrl: string): { isValid: boolean; reason?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(rawUrl);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, reason: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const rawHostname = parsed.hostname.toLowerCase();
    const cleanHostname = rawHostname.replace(/^\[|\]$/g, '');

    // Check for localhost or local domain names
    if (
      cleanHostname === 'localhost' ||
      cleanHostname.endsWith('.local') ||
      cleanHostname.endsWith('.internal') ||
      cleanHostname.endsWith('.corp') ||
      cleanHostname.endsWith('.lan')
    ) {
      return { isValid: false, reason: 'Local and internal domain names are blocked.' };
    }

    // Check if hostname is directly an IP
    if (net.isIP(cleanHostname)) {
      if (net.isIPv4(cleanHostname) && isPrivateIPv4(cleanHostname)) {
        return { isValid: false, reason: 'Private IPv4 addresses are blocked.' };
      }
      if (net.isIPv6(cleanHostname) && isPrivateIPv6(cleanHostname)) {
        return { isValid: false, reason: 'Private IPv6 addresses are blocked.' };
      }
    }

    return { isValid: true, parsedUrl: parsed };
  } catch {
    return { isValid: false, reason: 'Invalid URL format.' };
  }
}
