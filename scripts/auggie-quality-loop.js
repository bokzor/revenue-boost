#!/usr/bin/env node

/**
 * Autonomous Quality Loop - Simplified
 * Executes a task and validates with quality checks
 */

import { executeAuggie, runValidation } from './auggie-utils.js';
import { runQualityChecks } from './auggie-quality-enforcer.js';

const MAX_ITERATIONS = 3;

/**
 * Main loop - simplified
 */
async function autonomousQualityLoop(task) {
  console.log('🚀 Starting Quality Loop');
  console.log(`📝 Task: ${task}\n`);

  let iteration = 0;
  let allPassed = false;

  while (iteration < MAX_ITERATIONS && !allPassed) {
    iteration++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 ITERATION ${iteration}/${MAX_ITERATIONS}`);
    console.log('='.repeat(60));

    const prompt = iteration === 1 ? task : 'Fix the validation errors from previous iteration';
    const result = await executeAuggie(prompt);

    if (!result.success) {
      console.log('\n❌ Execution failed');
      break;
    }

    const validationResults = await runValidation();
    const validationPassed = validationResults.every(r => r.success);

    if (validationPassed) {
      console.log('\n🔍 Running quality checks...');
      const qualityResults = await runQualityChecks(null, task);

      const finalValidation = await runValidation();
      allPassed = finalValidation.every(r => r.success) && qualityResults.allPassed;

      if (allPassed) {
        console.log('\n🎉 SUCCESS! All checks passed.');
        break;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(allPassed ? '✅ COMPLETED SUCCESSFULLY' : '❌ NEEDS MANUAL REVIEW');
  console.log(`Iterations: ${iteration}/${MAX_ITERATIONS}`);
  console.log('='.repeat(60));

  return allPassed;
}

const args = process.argv.slice(2);
const task = args.join(' ');

if (!task) {
  console.error('Usage: node auggie-quality-loop.js "your task description"');
  process.exit(1);
}

try {
  const success = await autonomousQualityLoop(task);
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}

