---
name: issue-to-pr
description: Professional GitHub issue analysis and fix workflow. When user asks to review an issue, first reproduce the bug, analyze critically, confirm or reject, write response. After confirmation, create branch, fix with tests, and create PR.
---

# Issue-to-PR Workflow Skill

This skill provides a professional software engineering workflow for handling GitHub issues. It follows a two-phase approach:

## Phase 1: Analysis & Confirmation (Reproduce First)

When triggered, the agent should:

1. **Reproduce the Issue**
   - Clone the repository if needed
   - Set up the environment
   - Follow the steps described in the issue
   - Document the exact conditions under which the bug occurs
   - Take screenshots or videos if applicable

2. **Analyze Critically**
   - Examine the codebase to understand the root cause
   - Check if the issue description is accurate and complete
   - Identify any missing information or edge cases
   - Determine if the issue is actually a bug or a feature request

3. **Confirm or Reject**
   - Based on the reproduction, confirm whether the bug exists
   - If confirmed, provide a detailed analysis of the root cause
   - If rejected, explain why the issue is not valid (e.g., user error, missing steps, intended behavior)
   - For each claim in the issue, provide a clear confirmation or rejection

4. **Write Response**
   - Post a comprehensive comment on the GitHub issue
   - Include:
     - Reproduction steps and results
     - Root cause analysis
     - Confirmation/rejection of each point
     - Next steps (e.g., "I'll create a branch to fix this")
     - Request for additional information if needed

## Phase 2: Fix & PR (After Confirmation)

Once the issue is confirmed and the user gives approval:

1. **Announce Work Started**
   - Immediately post a comment on the issue: "I'm starting work on this issue."
   - This keeps stakeholders informed and prevents duplicate efforts

2. **Write Implementation Plan**
   - Based on the root cause analysis, write a detailed plan as a comment on the issue
   - Include:
     - Step-by-step approach to fix the issue
     - Files that need to be modified
     - Tests that need to be added or updated
     - Any edge cases to consider
     - Estimated complexity/time estimate
   - Ask for feedback on the plan before proceeding

3. **Get Approval on Plan**
   - Wait for user confirmation on the plan
   - If user suggests changes, update the plan accordingly
   - Once approved, proceed with implementation

4. **Create Local Branch**
   - Create a new branch from the appropriate base
   - Branch name format: `issue/<issue-number>-short-description`
   - Push to remote if needed

5. **Implement the Fix**
   - Follow the approved plan step by step
   - Write clean, production-ready code
   - Follow the project's coding standards
   - Add necessary comments and documentation
   - Update the issue comment with progress if implementation takes multiple steps

6. **Write Tests**
   - Create tests that reproduce the bug
   - Ensure tests fail without the fix and pass with it
   - Cover edge cases and related scenarios
   - Run existing tests to ensure no regression

7. **Create Pull Request**
   - Commit changes with proper messages
   - Push the branch
   - Create a PR with:
     - Description linking to the issue
     - Explanation of the fix
     - Test results
     - Reference to the implementation plan
   - Request review from the user

## Input Format

The skill expects the user to provide:

- GitHub issue URL or number
- Repository URL or local path
- Any additional context needed for reproduction

## Output Format

The skill produces:

- Issue comments with analysis
- Branch with fix
- Pull request
- Test results

## Success Criteria

- Issue is either confirmed with reproducible steps or rejected with clear explanation
- Fix is implemented with comprehensive tests
- PR is created and ready for review
- All changes are reproducible by other developers

## Dependencies

- Git
- Node.js / Python / appropriate runtime
- Testing framework (Jest, pytest, etc.)
- GitHub CLI (gh) recommended

## Best Practices

- Always reproduce first before making any changes
- Write clear, detailed comments in both the issue and PR
- Follow the project's existing patterns and conventions
- Ensure all tests pass before creating the PR
- Keep commits small and focused
