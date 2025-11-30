import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for Cloudflare Pages
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Trailing slashes for better static hosting compatibility
  trailingSlash: true,

  // Enable importing from parent app directory
  transpilePackages: ['../app'],

  // Turbopack configuration for aliases
  turbopack: {
    resolveAlias: {
      '~/domains': path.resolve(__dirname, '../app/domains'),
      '~/shared': path.resolve(__dirname, '../app/shared'),
      '~/lib': path.resolve(__dirname, '../app/lib'),
    },
  },

  // Webpack fallback for production builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '~/domains': path.resolve(__dirname, '../app/domains'),
      '~/shared': path.resolve(__dirname, '../app/shared'),
      '~/lib': path.resolve(__dirname, '../app/lib'),
    };
    return config;
  },
}

export default nextConfig
