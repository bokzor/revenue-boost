#!/usr/bin/env node

/**
 * Auggie Quality Fixer - Simplified
 * Automatically fixes quality violations
 */

import { runValidation } from './auggie-utils.js';
import { runQualityChecks } from './auggie-quality-enforcer.js';

const args = process.argv.slice(2);
const SPECIFIC_FILE = args.find(arg => arg.startsWith('--file'))?.split('=')[1];

console.log(`
╔════════════════════════════════════════════════════════════════╗
║              🔧 AUGGIE QUALITY FIXER 🔧                       ║
╚════════════════════════════════════════════════════════════════╝

${SPECIFIC_FILE ? `File: ${SPECIFIC_FILE}` : 'Scope: Recent changes'}
`);

/**
 * Main execution - simplified
 */
async function main() {
  console.log('🔍 Running quality checks and fixes...\n');

  const qualityResults = await runQualityChecks('CURRENT', SPECIFIC_FILE);

  if (qualityResults.allPassed) {
    console.log('\n✅ All quality checks passed!');
  } else {
    console.log('\n⚠️  Some quality issues found - check output above');
  }

  const validationResults = await runValidation();
  const allPassed = validationResults.every(r => r.success);

  console.log(`
${'═'.repeat(60)}
📊 SUMMARY
${'═'.repeat(60)}

Quality: ${qualityResults.allPassed ? '✅ PASSED' : '⚠️  ISSUES FOUND'}
Validation: ${allPassed ? '✅ PASSED' : '❌ FAILED'}

${'═'.repeat(60)}
`);

  process.exit(allPassed && qualityResults.allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

