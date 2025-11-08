#!/usr/bin/env node

/**
 * Auggie Type Safety Fixer - Simplified
 * Fixes type safety violations
 */

import { executeAuggie, executeCommand } from './auggie-utils.js';

const args = process.argv.slice(2);
const SPECIFIC_FILE = args.find(arg => arg.startsWith('--file'))?.split('=')[1];

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🔧 TYPE SAFETY FIXER 🔧                             ║
╚════════════════════════════════════════════════════════════════╝

${SPECIFIC_FILE ? `File: ${SPECIFIC_FILE}` : 'Scope: All files with violations'}
`);

/**
 * Main execution - simplified
 */
async function main() {
  const prompt = `Find and FIX all type safety violations.

${SPECIFIC_FILE ? `Focus on file: ${SPECIFIC_FILE}` : 'Search all TypeScript files'}

FIX these NOW:
1. Replace 'any' with proper types or 'unknown'
2. Remove 'as any' assertions - use type guards
3. Add proper type annotations to functions
4. Fix Record<string, any> with proper interfaces

IMPLEMENT the fixes, don't just report them.`;

  const result = await executeAuggie(prompt);

  if (result.success) {
    console.log('\n📋 Verifying...\n');
    const typecheck = await executeCommand('npm run typecheck');

    if (typecheck.success) {
      console.log('\n✅ Type safety violations fixed!\n');
      process.exit(0);
    }
  }

  console.log('\n⚠️  Some issues remain - check output above\n');
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

