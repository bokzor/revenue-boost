#!/usr/bin/env node

/**
 * Auggie Quality Enforcer - Simplified
 * Enforces code quality principles
 */

import { executeAuggie } from './auggie-utils.js';

/**
 * Run quality checks on code
 */
async function runQualityChecks(taskId, taskDescription) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              QUALITY CHECKS - ${taskId || 'CURRENT'}
╚════════════════════════════════════════════════════════════════╝
`);

  const prompt = taskDescription
    ? `Analyze and FIX quality issues for: ${taskDescription}

SEARCH for existing code to reuse:
- Similar functions, components, utilities
- Existing interfaces/types
- Reusable implementations

FIX these violations NOW:
1. DRY: Extract duplicate code into utilities
2. YAGNI: Remove unnecessary features/abstractions
3. SOLID: Break down large functions (>50 lines)
4. Unused: Remove unused imports/variables/functions
5. Type Safety: Replace 'any' with proper types

IMPLEMENT fixes, don't just report them.`
    : `Find and FIX all quality violations in recently modified code.

FIX these violations NOW:
1. DRY: Extract duplicate code into utilities
2. YAGNI: Remove unnecessary features/abstractions
3. SOLID: Break down large functions (>50 lines)
4. Unused: Remove unused imports/variables/functions
5. Type Safety: Replace 'any' with proper types

IMPLEMENT fixes, don't just report them.`;

  const result = await executeAuggie(prompt, { quiet: false });

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              QUALITY CHECK ${result.success ? 'COMPLETE' : 'FAILED'}
╚════════════════════════════════════════════════════════════════╝
`);

  return { success: result.success, allPassed: result.success };
}

// Backward compatibility aliases
async function preTaskChecks(taskId, taskDescription) {
  return runQualityChecks(taskId, taskDescription);
}

async function postTaskChecks(taskId) {
  return runQualityChecks(taskId, null);
}

// Export for use in other scripts
export { runQualityChecks, preTaskChecks, postTaskChecks };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const taskId = process.argv[2];
  const taskDescription = process.argv[3];
  runQualityChecks(taskId, taskDescription).catch(console.error);
}

