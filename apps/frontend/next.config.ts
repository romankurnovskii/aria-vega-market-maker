/**
 * @file next.config.ts
 * @description Next.js configuration — enables ESLint/TS error bypass during builds,
 *              transpiles local workspace packages, and resolves .js→.ts extension aliases.
 *
 * @features
 * - ignoreDuringBuilds — allows builds with lint errors
 * - ignoreBuildErrors — allows builds with TS errors
 * - transpilePackages — compiles @lp-system/* workspace packages
 * - webpack extensionAlias — resolves .js imports to .ts sources
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@lp-system/config', '@lp-system/logger'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
