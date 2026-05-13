---
name: issue-reproduce
description: >
  Phase 2 of the issue review pipeline. Use when asked to reproduce a confirmed bug, write
  failing tests for an issue, enumerate edge cases before a fix, or prepare the test harness.
  Requires triage.json from Skill 1. Triggers on: "reproduce this bug", "write failing tests",
  "set up tests for issue #N", "what are the edge cases". Output: repro.json + failing test file.
  Does NOT implement any fix — tests must be left failing.
---

# Skill 2 — Reproduce & Test Design

**Role**: Test engineer. Your job is to prove the bug exists via a failing test, then enumerate
every edge case and caveat before the fix agent touches anything.

**Input**: `handoffs/triage.json`
**Output**: `handoffs/repro.json` + a new test file with failing tests

**Hard constraint**: Tests must be **left failing**. Do NOT fix the bug. Do NOT modify source files.
The fix agent (Skill 3) must be able to make the tests pass from a clean state.

---

## Step 0 — Read triage.json

```bash
cat handoffs/triage.json
```

Check: `verdict == "confirmed"`. If not, stop and report to user.

Use `root_cause_hypothesis` and `relevant_files` to focus your work.

---

## Step 1 — Set up the environment

```bash
# Install dependencies
npm install   # or: pip install -r requirements.txt / cargo build / etc.

# Confirm existing tests pass before you touch anything
npm test      # baseline must be green
```

If baseline is already broken, document it in `caveats` — do not proceed blindly.

---

## Step 2 — Reproduce manually

Follow or derive reproduction steps from the issue. Document exactly:

- What input / state triggers the bug
- What actually happens vs. what should happen
- Whether the bug is consistent or intermittent

If intermittent: identify the conditions (concurrency, load, timing) and note how you'll simulate them.

---

## Step 3 — Write the failing test(s)

Create a new test file: `tests/issues/issue-<N>.<ext>` (or equivalent location for the project).

**Test design rules**:

1. One test per distinct failure mode
2. Tests must **fail** on the current code — verify this by running them
3. Test names must be descriptive: `"should throw on negative input, not return NaN"`
4. Each test must contain a comment: `// ISSUE #N: this test is intentionally failing`
5. Cover the happy path too — confirm existing behavior isn't accidentally broken by a fix

**Edge cases to always consider**:

- Empty / null / undefined input
- Boundary values (0, -1, MAX_INT, empty string, empty array)
- Concurrent/parallel access if relevant
- Large inputs (performance edge)
- Invalid type inputs
- State that requires prior setup (auth, DB rows, etc.)

**Example structure**:

```typescript
// tests/issues/issue-8.test.ts
// ISSUE #8: negative input returns NaN instead of throwing

describe('issue #8 — negative input handling', () => {
  it('should throw RangeError for negative values', () => {
    // ISSUE #8: currently returns NaN
    expect(() => myFunction(-1)).toThrow(RangeError);
  });

  it('should handle zero correctly', () => {
    // edge case: zero is a boundary
    expect(myFunction(0)).toBe(0);
  });

  it('should not regress on valid positive input', () => {
    // regression guard
    expect(myFunction(5)).toBe(25);
  });
});
```

---

## Step 4 — Run and confirm tests fail

```bash
npm test tests/issues/issue-<N>.test.ts
```

Expected: the bug-demonstrating tests fail. Regression guards pass.
If ALL tests pass — the bug isn't reproducible as written. Update `repro_confirmed: false` and explain.

---

## Step 5 — Document caveats and out-of-scope items

**Caveats**: things the fix agent must know that aren't obvious

- "This race condition requires a 50ms sleep in the test to reliably trigger"
- "The test mocks the DB — real behavior may differ for large datasets"

**Out of scope**: issues found during reproduction that are separate bugs

- These get their own entries in `repro.json.out_of_scope` — do NOT fix them

---

## Step 6 — Write repro.json

```bash
mkdir -p handoffs
cat > handoffs/repro.json << 'EOF'
{
  "skill": "issue-reproduce",
  "timestamp": "...",
  "issue_url": "...",
  "triage_used": true,
  "repro_confirmed": true,
  "repro_steps": ["..."],
  "repro_environment": { "os": "...", "runtime": "..." },
  "test_file_path": "tests/issues/issue-N.test.ts",
  "failing_tests": [
    { "name": "...", "expected": "...", "actual": "..." }
  ],
  "edge_cases": [
    { "description": "...", "expected_behavior": "...", "covered": true }
  ],
  "caveats": ["..."],
  "out_of_scope": ["..."]
}
EOF
```

---

## Checklist before handing off

- [ ] `npm test` (full suite) passes except for the new issue tests
- [ ] New test file exists at `tests/issues/issue-<N>.*`
- [ ] Each failing test has a `// ISSUE #N:` comment
- [ ] repro.json written to `handoffs/`
- [ ] All edge cases documented (covered or explicitly noted as not covered)
- [ ] Caveats section explains any test simulation/mocking decisions
- [ ] Out-of-scope issues documented — NOT fixed
