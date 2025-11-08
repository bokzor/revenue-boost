#!/usr/bin/env node

/**
 * Interactive Auggie Workflow
 * 
 * A conversational interface for the autonomous quality loop
 * that allows you to guide Auggie through complex tasks with minimal input.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function runAuggieLoop(task) {
  return new Promise((resolve) => {
    const proc = spawn('node', ['scripts/auggie-quality-loop.js', task], {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

const QUICK_TASKS = {
  '1': { name: 'Fix all errors', task: 'Fix all build, lint, and type errors' },
  '2': { name: 'Refactor duplicates', task: 'Find and refactor all code duplication' },
  '3': { name: 'Add error handling', task: 'Add comprehensive error handling to all public APIs' },
  '4': { name: 'Update tests', task: 'Update all tests to match recent code changes' },
  '5': { name: 'Improve types', task: 'Improve TypeScript types and remove any usage' },
  '6': { name: 'Clean up code', task: 'Remove unused code, imports, and dead code' },
  '7': { name: 'Add documentation', task: 'Add JSDoc comments to all public functions' },
  '8': { name: 'Security audit', task: 'Review code for security vulnerabilities and fix them' },
};

async function showMenu() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 AUGGIE INTERACTIVE WORKFLOW');
  console.log('='.repeat(70));
  console.log('\nQuick Tasks:');
  
  for (const [key, { name }] of Object.entries(QUICK_TASKS)) {
    console.log(`  ${key}. ${name}`);
  }
  
  console.log('\n  c. Custom task');
  console.log('  h. Help');
  console.log('  q. Quit');
  console.log('');
}

async function showHelp() {
  console.log('\n' + '='.repeat(70));
  console.log('📚 HELP');
  console.log('='.repeat(70));
  console.log(`
How it works:
1. Choose a task (quick task or custom)
2. Auggie executes the task autonomously
3. Validates with build/lint/tests
4. Applies quality checks (DRY, YAGNI, SOLID)
5. Reports success or asks for help

Tips:
- Be specific with custom tasks
- Let Auggie complete before giving new tasks
- Review the output to understand what changed
- Use quick tasks for common operations

Quality Principles:
- DRY: Don't Repeat Yourself
- YAGNI: You Aren't Gonna Need It
- SOLID: Single responsibility, Open/closed, etc.

The system will:
✅ Make changes automatically
✅ Fix validation errors
✅ Refactor duplicated code
✅ Update all related code
❌ Only ask when truly stuck

Examples of good custom tasks:
- "Add input validation to the user registration form"
- "Refactor the payment processing module to use async/await"
- "Add unit tests for the authentication service"
- "Improve error messages in the API responses"
`);
}

async function runCustomTask() {
  console.log('\n' + '-'.repeat(70));
  console.log('Custom Task');
  console.log('-'.repeat(70));
  console.log('Describe what you want Auggie to do.');
  console.log('Be specific and focused on one thing.\n');
  
  const task = await question('Task: ');
  
  if (!task.trim()) {
    console.log('❌ Task cannot be empty');
    return false;
  }

  console.log(`\n🚀 Starting task: ${task}`);
  const success = await runAuggieLoop(task);
  
  return success;
}

async function main() {
  console.log('Welcome to Auggie Interactive Workflow!');
  console.log('Type "h" for help or choose a task to begin.\n');

  let running = true;

  while (running) {
    await showMenu();
    const choice = await question('Choose an option: ');

    switch (choice.toLowerCase().trim()) {
      case 'q':
        console.log('\n👋 Goodbye!');
        running = false;
        break;

      case 'h':
        await showHelp();
        await question('\nPress Enter to continue...');
        break;

      case 'c':
        await runCustomTask();
        await question('\nPress Enter to continue...');
        break;

      default:
        if (QUICK_TASKS[choice]) {
          const { name, task } = QUICK_TASKS[choice];
          console.log(`\n🚀 Starting: ${name}`);
          await runAuggieLoop(task);
          await question('\nPress Enter to continue...');
        } else {
          console.log('❌ Invalid choice. Please try again.');
        }
    }
  }

  rl.close();
}

// Run the interactive workflow
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

