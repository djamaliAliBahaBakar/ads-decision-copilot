import type { NextConfig } from "next";

const csp = `
  default-src 'self';
  base-uri 'self';
  form-action 'self';
  object-src 'none';

  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://*.clerk.com
    https://*.clerk.services
    https://clerk.adsdecision.com
    https://accounts.adsdecision.com
    https://js.stripe.com
    https://*.sentry.io;

  style-src 'self' 'unsafe-inline';

  img-src 'self' data: blob:
    https://*.clerk.com
    https://*.clerk.services
    https://img.clerk.com
    https://images.clerk.dev
    https://images.clerkstage.dev
    https://*.stripe.com;

  font-src 'self' data:;

  connect-src 'self'
    https://*.clerk.com
    https://*.clerk.services
    https://clerk.adsdecision.com
    https://accounts.adsdecision.com
    https://api.stripe.com
    https://*.sentry.io;

  frame-src 'self'
    https://*.clerk.com
    https://*.clerk.services
    https://js.stripe.com;

  frame-ancestors 'self';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  async headers() {
    const cspValue = csp.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspValue },
          // optionnel mais recommandé :
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
