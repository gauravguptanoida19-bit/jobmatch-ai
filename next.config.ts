import type { NextConfig } from 'next';

const isExport = process.env.OUTPUT_EXPORT === 'true' || process.env.GITHUB_ACTIONS === 'true';
const basePath = isExport ? '/jobmatch-ai' : '';

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: 'export',
        basePath,
        assetPrefix: `${basePath}/`,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        serverExternalPackages: ['pdf-parse', 'bcryptjs'],
        images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: '**',
            },
          ],
        },
      }),
};

export default nextConfig;
