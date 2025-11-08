# Auggie Autonomous Agent - Usage Guide

## 🤖 Overview

The Auggie Campaign Agent is an autonomous system that works through the Campaign Implementation Plan automatically, executing tasks, running tests, and tracking progress.

**Key Features**:
- ✅ Reads tasks from `CAMPAIGN_IMPLEMENTATION_PLAN.md`
- ✅ Executes tasks in dependency order
- ✅ Validates each task with automated tests
- ✅ Updates `TASK_TRACKER.md` with progress
- ✅ Continues until blocked or complete
- ✅ Supports interactive and fully autonomous modes

---

## 🚀 Quick Start

### 1. Interactive Mode (Recommended for First Use)

Executes one task at a time, pauses for review:

```bash
cd revenue-boost
npm run auggie:campaign
```

**What it does**:
- Finds the next task with all dependencies met
- Executes the task using Augment CLI
- Runs validation (build, typecheck, lint, tests)
- Updates task tracker
- Pauses for you to review before continuing

---

### 2. Fully Autonomous Mode

Runs continuously until blocked or complete:

```bash
npm run auggie:campaign:auto
```

**What it does**:
- Executes tasks one after another
- Doesn't pause between tasks
- Continues even if validation fails
- Stops only when blocked or all tasks complete

⚠️ **Warning**: This mode can make many changes quickly. Use with caution!

---

### 3. Quiet Mode

Reduces output for cleaner logs:

```bash
npm run auggie:campaign:quiet
```

**What it does**:
- Suppresses verbose Auggie output
- Shows only key progress updates
- Useful for CI/CD or background execution

---

### 4. Execute Specific Task

Run a single specific task:

```bash
npm run auggie:task -- TASK-F001
```

**Example**:
```bash
# Fix build issues
npm run auggie:task -- TASK-F001

# Create campaign list component
npm run auggie:task -- TASK-F107

# Run E2E tests
npm run auggie:task -- TASK-T008
```

---

## 📋 Available Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run auggie:campaign` | Interactive mode | First time, learning, careful execution |
| `npm run auggie:campaign:auto` | Fully autonomous | Overnight runs, bulk execution |
| `npm run auggie:campaign:quiet` | Quiet mode | CI/CD, background tasks |
| `npm run auggie:task -- TASK-ID` | Specific task | Fix one task, retry failed task |

---

## 🎯 How It Works

### Task Selection Algorithm

1. **Parse Tasks**: Reads all tasks from `CAMPAIGN_IMPLEMENTATION_PLAN.md`
2. **Check Dependencies**: For each task, verifies all dependencies are complete
3. **Select Next**: Picks the first task with all dependencies met
4. **Execute**: Runs the task using Augment CLI
5. **Validate**: Runs build, typecheck, lint, and tests
6. **Update**: Updates `TASK_TRACKER.md` with results
7. **Repeat**: Continues to next task

### Task Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Read CAMPAIGN_IMPLEMENTATION_PLAN.md                │
│    - Parse all tasks                                    │
│    - Extract dependencies                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Find Next Task                                       │
│    - Check dependencies met                             │
│    - Skip completed tasks                               │
│    - Select highest priority                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Execute Task with Auggie                             │
│    - Build detailed prompt                              │
│    - Include acceptance criteria                        │
│    - Run: auggie --print "Execute TASK-XXX..."         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Run Validation                                       │
│    - npm run build                                      │
│    - npm run typecheck                                  │
│    - npm run lint                                       │
│    - npm run test:run                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Update Progress                                      │
│    - Update TASK_TRACKER.md                             │
│    - Mark task complete or needs fixing                 │
│    - Record actual time spent                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Continue or Stop                                     │
│    - If auto mode: continue to next task               │
│    - If interactive: pause for review                   │
│    - If blocked: stop and report                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Progress Tracking

The agent automatically updates `TASK_TRACKER.md`:

**Before**:
```markdown
| TASK-F001 | Fix Build Issues | 🔴 BLOCKED | 3h | - | - | - |
```

**After**:
```markdown
| TASK-F001 | Fix Build Issues | ✅ COMPLETE | 3h | 4h | Agent | 2025-11-08 |
```

---

## 🎓 Best Practices

### When to Use Interactive Mode
- ✅ First time running the agent
- ✅ Learning how it works
- ✅ Critical tasks (database migrations, etc.)
- ✅ When you want to review each change

### When to Use Autonomous Mode
- ✅ Overnight execution
- ✅ Bulk task execution
- ✅ CI/CD pipelines
- ✅ When you trust the process

### When to Use Specific Task Mode
- ✅ Fixing a failed task
- ✅ Re-running a specific task
- ✅ Testing the agent on one task
- ✅ Skipping to a specific task

---

## 🔧 Configuration

### Augment CLI Modes

The agent uses Augment CLI with these flags:

**`--print` mode** (default):
- Shows full output from Auggie
- Displays code changes
- Verbose logging
- Good for learning and debugging

**`--quiet` mode**:
- Minimal output
- Only shows key events
- Good for CI/CD
- Faster execution

**Example**:
```bash
# Verbose output
npm run auggie:campaign

# Quiet output
npm run auggie:campaign:quiet

# Custom flags
node ../scripts/auggie-campaign-agent.js --auto --quiet
```

---

## 🐛 Troubleshooting

### Agent Stops Immediately

**Problem**: Agent exits after parsing tasks

**Solution**:
```bash
# Check if tasks are parsed correctly
node ../scripts/auggie-campaign-agent.js --task TASK-F001
```

### Validation Always Fails

**Problem**: Build/tests fail after every task

**Solution**:
1. Run validation manually: `npm run build && npm run test:run`
2. Fix the underlying issues
3. Restart the agent

### Task Dependencies Not Met

**Problem**: Agent says "No more tasks available"

**Solution**:
1. Check `TASK_TRACKER.md` for completed tasks
2. Manually mark prerequisite tasks as complete if they are
3. Or run specific task: `npm run auggie:task -- TASK-XXX`

### Auggie Command Not Found

**Problem**: `auggie: command not found`

**Solution**:
```bash
# Install Augment CLI globally
npm install -g @augment/cli

# Or use npx
npx @augment/cli --version
```

---

## 📈 Monitoring Progress

### Real-time Monitoring

Watch the agent work:
```bash
# In one terminal
npm run auggie:campaign:auto

# In another terminal
watch -n 5 'tail -n 50 TASK_TRACKER.md'
```

### Check Progress

```bash
# View task tracker
cat TASK_TRACKER.md | grep "✅ COMPLETE"

# Count completed tasks
grep -c "✅ COMPLETE" TASK_TRACKER.md

# View current status
head -n 30 TASK_TRACKER.md
```

---

## 🎯 Example Workflows

### Workflow 1: Careful Execution

```bash
# Start with first task
npm run auggie:campaign

# Review changes
git diff

# If good, continue
npm run auggie:campaign

# Repeat...
```

### Workflow 2: Overnight Batch

```bash
# Start autonomous mode before leaving
nohup npm run auggie:campaign:auto > auggie.log 2>&1 &

# Check progress next morning
tail -f auggie.log
cat TASK_TRACKER.md
```

### Workflow 3: Fix Specific Issues

```bash
# Build is broken, fix it
npm run auggie:task -- TASK-F001

# Verify
npm run build

# Continue with next tasks
npm run auggie:campaign
```

---

## 🔒 Safety Features

1. **Dependency Checking**: Won't run tasks until dependencies are met
2. **Validation**: Runs tests after each task
3. **Progress Tracking**: Updates tracker so you can resume
4. **Interactive Mode**: Pauses for review by default
5. **Max Iterations**: Stops after 10 iterations (configurable)

---

## 📚 Related Documentation

- **Implementation Plan**: `CAMPAIGN_IMPLEMENTATION_PLAN.md`
- **Quick Start Guide**: `QUICK_START_GUIDE.md`
- **Task Tracker**: `TASK_TRACKER.md`
- **Build Issues**: `BUILD_ISSUES_SUMMARY.md`
- **Augment CLI Docs**: https://docs.augmentcode.com/cli/overview

---

## 🆘 Getting Help

If the agent isn't working as expected:

1. **Check the logs**: Look for error messages
2. **Run manually**: Try executing Auggie commands manually
3. **Verify setup**: Ensure Augment CLI is installed and configured
4. **Check dependencies**: Verify prerequisite tasks are complete
5. **Review plan**: Check `CAMPAIGN_IMPLEMENTATION_PLAN.md` for task details

---

**Ready to start?** Run: `npm run auggie:campaign`

Good luck! 🚀

