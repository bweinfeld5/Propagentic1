# PropAgentic Background Agent Workflows

## Daily Workflow
1. **Morning Check**: Review Task Master for priority tasks
2. **Status Update**: Check build status and any failing tests
3. **Implementation**: Work on highest priority pending tasks
4. **Progress Logging**: Update Task Master with implementation details
5. **Quality Check**: Ensure code follows PropAgentic standards

## Feature Implementation Workflow
```
1. Get Next Task
   └── Use Task Master `next_task` to identify priority

2. Analyze Requirements
   └── Review task details and acceptance criteria
   └── Check existing code patterns
   └── Identify dependencies

3. Plan Implementation
   └── Break down into subtasks if complex
   └── Log implementation plan in Task Master
   └── Set task status to 'in-progress'

4. Implement Solution
   └── Follow PropAgentic coding standards
   └── Use existing UI components
   └── Implement proper error handling
   └── Add TypeScript types

5. Test & Validate
   └── Test in development environment
   └── Verify Firebase integration works
   └── Check responsive design
   └── Validate accessibility

6. Document & Commit
   └── Update task with implementation notes
   └── Create descriptive commit message
   └── Set task status to 'done'
   └── Create PR if needed
```

## Bug Fix Workflow
```
1. Identify Issue
   └── Review error reports or failing tests
   └── Reproduce the bug locally

2. Root Cause Analysis
   └── Trace through code to find source
   └── Check related Firebase rules/queries
   └── Review recent changes

3. Implement Fix
   └── Make minimal, targeted changes
   └── Ensure fix doesn't break other features
   └── Add error handling if needed

4. Test Fix
   └── Verify bug is resolved
   └── Run related tests
   └── Check for regression issues

5. Document & Deploy
   └── Log fix details in Task Master
   └── Create commit with clear description
   └── Update any related documentation
```

## Code Review Workflow
```
1. Review Changes
   └── Check TypeScript compliance
   └── Verify PropAgentic patterns followed
   └── Ensure proper error handling
   └── Check Firebase security implications

2. Test Changes
   └── Pull branch and test locally
   └── Verify functionality works as expected
   └── Check for performance issues

3. Provide Feedback
   └── Comment on specific lines if issues found
   └── Suggest improvements following PropAgentic standards
   └── Approve if all checks pass
```

## Emergency Response Workflow
```
1. Build Failure
   └── Immediately investigate TypeScript errors
   └── Check for missing dependencies
   └── Fix compilation issues
   └── Verify build passes before continuing

2. Security Issue
   └── Stop all other work
   └── Assess severity and impact
   └── Implement immediate fix
   └── Document security improvement

3. Production Issue
   └── Identify affected functionality
   └── Implement hotfix if possible
   └── Coordinate with team for deployment
   └── Post-mortem analysis
```

## Task Master Integration Commands
```bash
# Get next task to work on
task-master next

# Update task status
task-master set-status --id=<task-id> --status=in-progress

# Add implementation notes
task-master update-subtask --id=<subtask-id> --prompt="Implementation details..."

# Mark task complete
task-master set-status --id=<task-id> --status=done

# Add new task if discovered
task-master add-task --prompt="New task description" --priority=high
```

## Quality Checklist
- [ ] TypeScript compilation passes
- [ ] No console errors in browser
- [ ] Responsive design works on mobile
- [ ] Firebase queries are efficient
- [ ] Error handling is implemented
- [ ] UI follows PropAgentic design system
- [ ] Code follows existing patterns
- [ ] Security best practices followed 