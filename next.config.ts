import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  // Tell Vercel to include these files in the serverless bundle
  outputFileTracingIncludes: {
    "/api/cron": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
  // Add environment variable to help Playwright find its files
  env: {
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
  },
};

export default nextConfig;
