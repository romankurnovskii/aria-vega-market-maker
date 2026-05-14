---
name: issue-fix-pr
description: >
  Phase 3 of the issue review pipeline. Use when asked to implement a fix for a confirmed and
  reproduced bug, make failing tests pass, create a branch and open a PR. Requires repro.json
  from Skill 2 and a set of failing tests. Triggers on: "fix this bug", "implement the fix",
  "create a PR for issue #N", "make the tests pass". Output: pr.json + merged branch + PR.
  Does NOT re-analyze or re-scope — trusts repro.json exactly.
---

# Skill 3 — Fix & PR

**Role**: Implementer. Your job is narrow: make the failing tests pass without breaking anything else.
The test file from Skill 2 is your spec — do not go beyond it.

**Input**: `.dev/handoffs/repro.json` + the test file it references
**Output**: `.dev/handoffs/pr.json` + branch + open PR

**Hard constraint**: Do NOT re-scope the fix. If you find additional bugs, document them in `pr.json`
but do not fix them. Trust `repro.json.out_of_scope` — those are deliberate exclusions.

---

## Step 0 — Read repro.json

```bash
cat .dev/handoffs/repro.json
```

Check: `repro_confirmed == true`. If not, stop.

Read carefully:

- `test_file_path` — your acceptance criteria
- `caveats` — constraints the fix must respect
- `edge_cases` — cases your fix must handle
- `out_of_scope` — things you must NOT fix

---

## Step 1 — Run the failing tests to confirm baseline

```bash
npm test <test_file_path>
# Expected: the issue tests fail, regression guards pass
```

If tests already pass — the bug was fixed elsewhere. Document this in pr.json and stop.

---

## Step 2 — Create a branch

```bash
git checkout -b issue/<N>-<short-description>
# e.g.: issue/8-negative-input-throws-range-error
```

Branch name format: `issue/<number>-<3-5-word-kebab-description>`

---

## Step 3 — Implement the fix

**Principles**:

- Fix only what the tests require — minimum viable change
- Follow the project's existing patterns (error handling, naming, logging)
- If the fix touches a shared utility: check other callers aren't broken
- Prefer throwing/explicit errors over silent coercion unless the project's pattern says otherwise
- Add inline comments only where the reasoning is non-obvious

**Common pitfalls to avoid**:

- Don't add a guard in one place if the same input path exists in 3 other places — fix all of them or document the gap
- Don't change function signatures if callers exist outside the test file
- Don't silently swallow errors — if you catch, you must either re-throw or log

---

## Step 4 — Run tests iteratively

```bash
# Run just the issue tests
npm test <test_file_path>

# Once those pass, run the full suite
npm test
```

All issue tests must pass. Full suite must pass (or failures must be pre-existing — document this).

If you can't make a test pass without breaking something else: stop, document the conflict in
`pr.json.known_tradeoffs`, and ask the user for guidance.

---

## Step 5 — Review your own diff

```bash
git diff main
```

Before committing, verify:

- [ ] No unintended files changed
- [ ] No debug code, console.log, or TODO left in
- [ ] Change surface is as small as possible
- [ ] New code follows the project's style (lint passes)

```bash
npm run lint   # or: flake8, cargo clippy, etc.
```

---

## Step 6 — Commit and push

```bash
git add -p   # stage interactively — review every hunk
git commit -m "fix: <concise description of what changed and why>

Fixes #<N>

- <bullet: what changed>
- <bullet: why this approach>
"
git push origin issue/<N>-<description>
```

Commit message format: `fix: <description>` with issue reference and brief rationale.

---

## Step 7 — Open the PR

```bash
gh pr create \
  --title "fix: <description> (issue #N)" \
  --body "$(cat << 'EOF'
## What

<One paragraph: what the bug was and what the fix does.>

## Why this approach

<One paragraph: why this fix is correct and any alternatives considered.>

## Test coverage

- Added: `tests/issues/issue-N.test.ts`
- All existing tests: passing
- Edge cases covered: <list from repro.json>

## Review guidance

<Where to focus code review — specific files/lines if possible.>

Closes #N
EOF
)" \
  --base main
```

---

## Step 8 — Write pr.json

```bash
mkdir -p .dev/handoffs
cat > .dev/handoffs/pr.json << 'EOF'
{
  "skill": "issue-fix-pr",
  "timestamp": "...",
  "issue_url": "...",
  "branch_name": "issue/N-...",
  "pr_url": "https://github.com/.../pull/...",
  "pr_number": ...,
  "files_changed": [
    { "path": "...", "change_summary": "..." }
  ],
  "tests_added": ["tests/issues/issue-N.test.ts"],
  "tests_all_pass": true,
  "regression_check_passed": true,
  "regression_check_notes": "...",
  "known_tradeoffs": [],
  "review_guidance": "..."
}
EOF
```

---

## Checklist before handing off

- [ ] Branch exists and is pushed
- [ ] PR is open with correct title, body, and issue reference
- [ ] All issue tests pass
- [ ] Full test suite passes (or pre-existing failures documented)
- [ ] Lint passes
- [ ] Diff reviewed — no debug code, no unintended changes
- [ ] pr.json written to `.dev/handoffs/`
- [ ] known_tradeoffs documents any compromises made
