import type { NextConfig } from "next";
import { URL } from 'url';

// Extract hostnames and protocols from your API URLs
const apiUrl = process.env.API_URL || 'http://localhost:15567';
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:15567';

// Parse the URLs to get the protocols and hostnames.
// A malformed env var must not hard-fail the production build — fall back to
// localhost and warn instead, so a bad dashboard value degrades images rather
// than taking the whole deploy down.
const FALLBACK_URL = 'http://localhost:15567';
const safeParseUrl = (value: string, name: string) => {
  try {
    return new URL(value);
  } catch {
    console.warn(`[next.config] ${name} is not a valid URL (${JSON.stringify(value)}); falling back to ${FALLBACK_URL}`);
    return new URL(FALLBACK_URL);
  }
};

const apiUrlObj = safeParseUrl(apiUrl, 'API_URL');
const publicApiUrlObj = safeParseUrl(publicApiUrl, 'NEXT_PUBLIC_API_URL');

// Create a map to store unique patterns (using string representation as key)
const patternsMap = new Map();

// Add patterns to the map
[apiUrlObj, publicApiUrlObj].forEach(urlObj => {
  const pattern = {
    protocol: urlObj.protocol.replace(':', ''),
    hostname: urlObj.hostname,
    port: urlObj.port || '',
    pathname: '**',
  };
  
  // Use a string key to identify unique patterns
  const key = `${pattern.protocol}-${pattern.hostname}-${pattern.port}`;
  patternsMap.set(key, pattern);
});

// Convert map values to array
const remotePatterns = [...patternsMap.values()];

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Lint findings must not be able to block a production deploy during an
  // incident. Lint still runs in CI and locally via `npm run lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;