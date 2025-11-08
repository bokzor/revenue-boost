#!/usr/bin/env node

/**
 * Shared utilities for Auggie scripts
 */

import { spawn } from 'child_process';

const PROJECT_ROOT = process.cwd();

/**
 * Execute Augment CLI command
 */
export async function executeAuggie(prompt, options = {}) {
  const { quiet = false, print = true } = options;
  
  const args = [];
  if (print) args.push('--print');
  if (quiet) args.push('--quiet');
  args.push(prompt);

  if (!quiet) {
    console.log(`\n🤖 Auggie: ${prompt.substring(0, 80)}...`);
  }
  
  return new Promise((resolve, reject) => {
    const auggie = spawn('auggie', args, {
      cwd: PROJECT_ROOT,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    auggie.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (!quiet) process.stdout.write(output);
    });

    auggie.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      if (!quiet) process.stderr.write(output);
    });

    auggie.on('close', (code) => {
      resolve({ 
        success: code === 0, 
        output: stdout, 
        error: stderr, 
        code 
      });
    });

    auggie.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Execute shell command
 */
export async function executeCommand(command) {
  return new Promise((resolve) => {
    const proc = spawn(command, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    let error = '';

    proc.stdout.on('data', (data) => output += data.toString());
    proc.stderr.on('data', (data) => error += data.toString());

    proc.on('close', (code) => {
      resolve({ success: code === 0, output, error, code });
    });
  });
}

/**
 * Run validation checks (build, typecheck, lint, tests)
 */
export async function runValidation() {
  console.log('\n📋 Running validation checks...\n');

  const checks = [
    { name: 'Build', command: 'npm run build' },
    { name: 'Type Check', command: 'npm run typecheck' },
    { name: 'Lint', command: 'npm run lint' },
    { name: 'Tests', command: 'npm run test:run' },
  ];

  const results = [];

  for (const check of checks) {
    console.log(`  Running ${check.name}...`);
    const result = await executeCommand(check.command);
    results.push({ ...check, success: result.success });

    if (result.success) {
      console.log(`  ✅ ${check.name} passed`);
    } else {
      console.log(`  ❌ ${check.name} failed`);
    }
  }

  return results;
}

