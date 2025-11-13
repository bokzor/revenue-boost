/**
 * Prisma Configuration
 * 
 * Modern Prisma configuration file (replaces deprecated package.json#prisma)
 * See: https://pris.ly/prisma-config
 */

export default {
  seed: {
    command: 'tsx prisma/seed.ts',
  },
} as any;

