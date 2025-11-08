#!/usr/bin/env node

/**
 * Autonomous Campaign Implementation Agent
 * 
 * This agent works through the Campaign Implementation Plan autonomously:
 * 1. Reads tasks from CAMPAIGN_IMPLEMENTATION_PLAN.md
 * 2. Executes tasks in dependency order
 * 3. Validates each task with tests
 * 4. Updates TASK_TRACKER.md with progress
 * 5. Continues until blocked or complete
 * 
 * Usage:
 *   npm run auggie:campaign           # Interactive mode
 *   npm run auggie:campaign -- --auto # Fully autonomous
 *   npm run auggie:campaign -- --task TASK-F001  # Specific task
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { executeAuggie, runValidation } from './auggie-utils.js';
import { runQualityChecks } from './auggie-quality-enforcer.js';

const PROJECT_ROOT = process.cwd();
const PLAN_FILE = join(PROJECT_ROOT, 'CAMPAIGN_IMPLEMENTATION_PLAN.md');
const TRACKER_FILE = join(PROJECT_ROOT, 'TASK_TRACKER.md');
const QUICK_START_FILE = join(PROJECT_ROOT, 'QUICK_START_GUIDE.md');

// Parse command line arguments
const args = process.argv.slice(2);
const AUTO_MODE = args.includes('--auto');
const SPECIFIC_TASK = args.find(arg => arg.startsWith('TASK-'))?.trim();
const QUIET_MODE = args.includes('--quiet');
const PRINT_MODE = !args.includes('--no-print');
const FIX_TODOS = !args.includes('--no-todos'); // Fix TODOs by default

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🤖 AUTONOMOUS CAMPAIGN IMPLEMENTATION AGENT 🤖            ║
╚════════════════════════════════════════════════════════════════╝

Mode: ${AUTO_MODE ? 'FULLY AUTONOMOUS' : 'INTERACTIVE'}
Quiet: ${QUIET_MODE ? 'Yes' : 'No'}
Print: ${PRINT_MODE ? 'Yes' : 'No'}
${SPECIFIC_TASK ? `Target Task: ${SPECIFIC_TASK}` : 'Target: All tasks in order'}

Reading implementation plan...
`);



/**
 * Parse tasks from implementation plan
 */
function parseTasks() {
  if (!existsSync(PLAN_FILE)) {
    console.error(`❌ Implementation plan not found: ${PLAN_FILE}`);
    process.exit(1);
  }

  const content = readFileSync(PLAN_FILE, 'utf-8');
  const tasks = [];
  
  // Regex to match task sections
  const taskRegex = /### (TASK-[A-Z]\d+): (.+?)\n\*\*Dependencies\*\*: (.+?)\n\*\*Status\*\*: (.+?)\n/g;
  
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    const [, id, title, dependencies, status] = match;
    tasks.push({
      id,
      title: title.trim(),
      dependencies: dependencies.trim() === 'None' ? [] : dependencies.split(',').map(d => d.trim()),
      status: status.trim(),
    });
  }

  return tasks;
}

/**
 * Get next task to execute
 */
function getNextTask(tasks, completedTasks) {
  // If specific task requested, return it
  if (SPECIFIC_TASK) {
    return tasks.find(t => t.id === SPECIFIC_TASK);
  }

  // Find first task where all dependencies are complete
  for (const task of tasks) {
    // Skip if already complete
    if (completedTasks.includes(task.id)) continue;
    if (task.status.includes('COMPLETE')) continue;
    
    // Check if all dependencies are met
    const dependenciesMet = task.dependencies.every(dep => 
      completedTasks.includes(dep) || 
      tasks.find(t => t.id === dep)?.status.includes('COMPLETE')
    );
    
    if (dependenciesMet) {
      return task;
    }
  }
  
  return null;
}

/**
 * Update task tracker
 */
function updateTaskTracker(taskId, status, actualHours = null) {
  if (!existsSync(TRACKER_FILE)) {
    console.warn(`⚠️  Task tracker not found: ${TRACKER_FILE}`);
    return;
  }

  let content = readFileSync(TRACKER_FILE, 'utf-8');
  
  // Update task status in tracker
  const taskRegex = new RegExp(`(\\| ${taskId} \\| .+? \\| )([^|]+)(\\| .+? \\|)`, 'g');
  content = content.replace(taskRegex, `$1${status}$3`);
  
  // Update actual hours if provided
  if (actualHours !== null) {
    const hoursRegex = new RegExp(`(\\| ${taskId} \\| .+? \\| .+? \\| .+? \\| )(-)(\\| .+? \\|)`, 'g');
    content = content.replace(hoursRegex, `$1${actualHours}h$3`);
  }
  
  // Update completion date
  const today = new Date().toISOString().split('T')[0];
  const dateRegex = new RegExp(`(\\| ${taskId} \\| .+? \\| .+? \\| .+? \\| .+? \\| .+? \\| )(-)(\\|)`, 'g');
  content = content.replace(dateRegex, `$1${today}$3`);
  
  writeFileSync(TRACKER_FILE, content, 'utf-8');
  console.log(`✅ Updated task tracker: ${taskId} -> ${status}`);
}



/**
 * Main execution loop
 */
async function main() {
  const tasks = parseTasks();
  console.log(`📋 Found ${tasks.length} tasks in implementation plan\n`);

  if (SPECIFIC_TASK) {
    const task = tasks.find(t => t.id === SPECIFIC_TASK);
    if (!task) {
      console.error(`❌ Task not found: ${SPECIFIC_TASK}`);
      process.exit(1);
    }
    console.log(`🎯 Executing specific task: ${task.id} - ${task.title}\n`);
  }

  const completedTasks = [];
  let iteration = 0;
  const MAX_ITERATIONS = SPECIFIC_TASK ? 1 : 10;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🔄 ITERATION ${iteration}/${MAX_ITERATIONS}`);
    console.log(`${'═'.repeat(60)}\n`);

    // Get next task
    const nextTask = getNextTask(tasks, completedTasks);
    
    if (!nextTask) {
      console.log('✅ No more tasks available (all complete or blocked)');
      break;
    }

    console.log(`📌 Next Task: ${nextTask.id} - ${nextTask.title}`);
    console.log(`   Status: ${nextTask.status}`);
    console.log(`   Dependencies: ${nextTask.dependencies.length > 0 ? nextTask.dependencies.join(', ') : 'None'}\n`);

    // PRE-TASK QUALITY CHECKS
    console.log('🔍 Running pre-task quality checks...\n');
    try {
      await runQualityChecks(nextTask.id, nextTask.title);
    } catch (error) {
      console.error('⚠️  Pre-task quality checks failed:', error.message);
      if (!AUTO_MODE) {
        console.log('\n⏸️  Pausing for manual review...');
        break;
      }
    }

    // Build the prompt for Auggie (simplified to avoid tool errors)
    const prompt = `Execute task ${nextTask.id}: ${nextTask.title}

Read CAMPAIGN_IMPLEMENTATION_PLAN.md for full details.

REQUIREMENTS:
- Search for existing code FIRST before creating new
- Reuse existing functions and components
- NO duplicate code (DRY)
- ONLY implement what is in acceptance criteria (YAGNI)
- Keep functions under 50 lines
- Use proper TypeScript types (NO any)
- Write tests as specified

Reference: /Users/bokzor/WebstormProjects/split-pop/app

Implement this task completely.`;

    // Execute task with Auggie
    const startTime = Date.now();
    const result = await executeAuggie(prompt, { quiet: QUIET_MODE, print: PRINT_MODE });
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    if (!result.success) {
      console.error(`\n❌ Task execution failed: ${nextTask.id}`);
      console.error(`Error: ${result.error}`);
      
      if (!AUTO_MODE) {
        console.log('\n⏸️  Pausing for manual intervention...');
        break;
      }
    }

    // Run validation
    const validationResults = await runValidation();
    const allValidationPassed = validationResults.every(r => r.success);

    // POST-TASK QUALITY CHECKS
    console.log('\n🔍 Running post-task quality checks...\n');
    let qualityChecksPassed = false;
    let qualityResults = null;

    try {
      qualityResults = await runQualityChecks(nextTask.id, null);
      qualityChecksPassed = qualityResults.allPassed;
    } catch (error) {
      console.error('⚠️  Post-task quality checks failed:', error.message);
      qualityChecksPassed = false;
    }

    // Determine final status
    const allPassed = allValidationPassed && qualityChecksPassed;

    if (allPassed) {
      console.log(`\n✅ Task ${nextTask.id} completed successfully!`);
      console.log(`   ✅ Validation passed`);
      console.log(`   ✅ Quality checks passed`);
      completedTasks.push(nextTask.id);
      updateTaskTracker(nextTask.id, '✅ COMPLETE', duration);
    } else {
      console.log(`\n❌ Task ${nextTask.id} FAILED quality standards!`);
      if (!allValidationPassed) console.log(`   ❌ Validation failed`);
      if (!qualityChecksPassed) console.log(`   ❌ Quality checks failed`);

      // MANDATORY FIX: Quality violations must be fixed
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║              ⚠️  QUALITY VIOLATIONS DETECTED ⚠️               ║
╚════════════════════════════════════════════════════════════════╝

Quality standards are MANDATORY. The task cannot be marked complete
until all quality violations are fixed.

Attempting automatic fix...
`);

      // Attempt to fix quality violations automatically
      const fixPrompt = `Fix ALL quality violations in ${nextTask.id} NOW.

REQUIRED ACTIONS (implement these fixes):
1. DRY: Extract duplicate code into utility functions and use them
2. SOLID: Break down functions over 50 lines into smaller functions
3. Unused: Remove all unused imports, variables, and functions
4. Over-engineering: Simplify complex abstractions
5. Type safety: Replace all any types with proper TypeScript types

CRITICAL: Actually implement these fixes in the code.
Do not just report violations - FIX them.
Run typecheck and lint after fixing to verify.`;

      const fixResult = await executeAuggie(fixPrompt, { quiet: QUIET_MODE, print: PRINT_MODE });

      if (fixResult.success) {
        console.log('\n🔄 Re-running quality checks after fixes...\n');

        // Re-run quality checks
        try {
          qualityResults = await runQualityChecks(nextTask.id, null);
          qualityChecksPassed = qualityResults.allPassed;
        } catch (error) {
          console.error('⚠️  Quality re-check failed:', error.message);
          qualityChecksPassed = false;
        }

        // Re-run validation
        const revalidationResults = await runValidation();
        const revalidationPassed = revalidationResults.every(r => r.success);

        if (qualityChecksPassed && revalidationPassed) {
          console.log(`\n✅ Quality violations FIXED! Task ${nextTask.id} now complete!`);
          completedTasks.push(nextTask.id);
          updateTaskTracker(nextTask.id, '✅ COMPLETE', duration);
        } else {
          console.log(`\n❌ Quality violations still present after fix attempt`);
          updateTaskTracker(nextTask.id, '🔴 BLOCKED - QUALITY', duration);

          console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ⛔ TASK BLOCKED ⛔                          ║
╚════════════════════════════════════════════════════════════════╝

Task ${nextTask.id} is BLOCKED due to unresolved quality violations.

Manual intervention required:
1. Review quality check output above
2. Fix all violations manually
3. Run: npm run auggie:quality:post ${nextTask.id}
4. Verify all checks pass
5. Re-run task: npm run auggie:task -- ${nextTask.id}

The agent cannot proceed until quality standards are met.
`);

          // STOP execution - quality is mandatory
          break;
        }
      } else {
        console.log(`\n❌ Automatic fix failed`);
        updateTaskTracker(nextTask.id, '🔴 BLOCKED - QUALITY', duration);

        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ⛔ TASK BLOCKED ⛔                          ║
╚════════════════════════════════════════════════════════════════╝

Task ${nextTask.id} is BLOCKED due to quality violations.

Manual intervention required.
`);

        // STOP execution
        break;
      }
    }

    // If specific task mode, exit after one task
    if (SPECIFIC_TASK) {
      break;
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Iterations: ${iteration}`);
  console.log(`Tasks Completed: ${completedTasks.length}`);
  console.log(`Completed Tasks: ${completedTasks.join(', ') || 'None'}`);
  console.log(`${'═'.repeat(60)}\n`);

  // FIX TODOs after completing tasks
  if (FIX_TODOS && completedTasks.length > 0) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              FIXING TODOs IN MODIFIED CODE                    ║
╚════════════════════════════════════════════════════════════════╝
`);

    const fixTodosPrompt = `Find and fix TODO and FIXME comments in recently modified code.

INSTRUCTIONS:
- Find TODOs in files modified during recent tasks
- Prioritize FIXME and critical TODOs
- Check if functionality already exists before implementing
- Follow DRY, YAGNI, SOLID principles
- Remove TODO comment when fixed
- Run tests to verify

Fix up to 5 TODOs.`;

    try {
      const result = await executeAuggie(fixTodosPrompt, { quiet: QUIET_MODE });

      if (result.success) {
        console.log('\n✅ TODO fixing completed');

        // Run validation after fixing TODOs
        const validationResults = await runValidation();
        const allPassed = validationResults.every(r => r.success);

        if (allPassed) {
          console.log('✅ All validation passed after TODO fixes');
        } else {
          console.log('⚠️  Some validation failed after TODO fixes');
        }
      } else {
        console.log('\n⚠️  TODO fixing encountered issues');
      }
    } catch (error) {
      console.error('⚠️  Error during TODO fixing:', error.message);
    }
  }
}

// Run the agent
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

