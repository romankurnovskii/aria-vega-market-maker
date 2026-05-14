---
name: issue-verify
description: >
  Phase 4 of the issue review pipeline. Use when asked to verify a PR fixes an issue, check
  for regressions after a fix, confirm no new bugs were introduced, do a final review pass,
  or sign off on a pull request that was opened by the fix agent. Requires pr.json from Skill 3.
  Triggers on: "verify the fix", "check this PR", "does the PR fix the issue", "any regressions?",
  "final review". Output: verify.json with approved or needs_rework verdict. Does NOT modify code.
---

# Skill 4 — Verify

**Role**: Quality gate. You confirm that the fix is correct, complete, and safe.
You are the last checkpoint before a human reviews the PR.

**Input**: `handoffs/pr.json` + the PR branch
**Output**: `handoffs/verify.json` with verdict: `approved` or `needs_rework`

**Hard constraint**: Do NOT modify any code. Observe and report only.

---

## Step 0 — Read pr.json

```bash
cat handoffs/pr.json
```

Also fetch the PR diff:

```bash
gh pr diff <pr_number>
# or: git diff main..issue/<N>-<description>
```

---

## Step 1 — Checkout the PR branch and run all tests

```bash
git fetch origin
git checkout issue/<N>-<description>

npm test   # full suite
```

Record: which tests pass, which fail. Compare against `pr.json.tests_all_pass`.

If tests that should pass are failing — immediate `needs_rework`.

---

## Step 2 — Verify the original issue tests specifically

```bash
npm test <pr.json.test_file_path>
```

Every test from Skill 2's test file must now pass. If any still fail — `needs_rework`.

---

## Step 3 — Review the diff critically

Read every line of `git diff main...<branch>`. Ask:

**Correctness**:

- Does the fix actually address the root cause, or just the symptom?
- Are there other call sites with the same bug that were not fixed?
- Are there untested paths in the changed code?

**Scope creep**:

- Did the fix agent change things not related to the issue? (flag if yes)
- Are there accidental refactors, whitespace changes, or unrelated improvements?

**Code quality**:

- Does the fix follow the project's existing patterns?
- Are there magic numbers, unclear variable names, missing error handling?
- Are there any obvious performance issues introduced?

**Safety**:

- Could the fix cause data loss or incorrect behavior in a related path?
- Are there security implications (input validation, auth, SQL, etc.)?

---

## Step 4 — Check for newly discovered bugs

While reviewing, note any issues you find that are:

- New bugs introduced by the fix → `needs_rework`
- Pre-existing bugs adjacent to the fix → document in `new_issues_found`, severity medium/low
- Out-of-scope issues from Skill 2 that were accidentally fixed → document (usually fine to keep)

For each new issue found: document `description`, `severity` (critical/high/medium/low), and `action`
(needs_rework / open_new_issue / acceptable_risk).

---

## Step 5 — Verdict

**Approve if**:

- All issue tests pass
- Full test suite passes
- Diff is clean, minimal, and correct
- No new bugs introduced
- Minor concerns (style, naming) can be left as PR review comments — do not block

**Needs rework if**:

- Any issue test still fails
- A new bug was introduced
- The fix is incorrect (treats symptom, not cause)
- Unrelated scope changes that could introduce risk

If `needs_rework`: write specific, actionable `rework_instructions` so Skill 2 can restart
with clear guidance. Be precise — "re-examine the null handling in foo.ts line 48" not "the fix is wrong".

---

## Step 6 — Post GitHub comment

Always post a verification comment on the PR:

**If approved**:

```
## Verification ✓

- All issue tests pass
- Full test suite: green
- Diff reviewed: change surface is appropriate
- No regressions found

Ready for human review.
```

**If needs rework**:

```
## Verification — needs rework

**Failing**: [list tests]
**Issue**: [description]
**Required change**: [specific instruction]
```

```bash
gh pr comment <pr_number> --body "..."
```

---

## Step 7 — Write verify.json

```bash
cat > handoffs/verify.json << 'EOF'
{
  "skill": "issue-verify",
  "timestamp": "...",
  "pr_url": "...",
  "original_issue_url": "...",
  "verdict": "approved",
  "all_failing_tests_now_pass": true,
  "new_failures": [],
  "diff_concerns": [],
  "new_issues_found": [],
  "rework_reason": null,
  "rework_instructions": null
}
EOF
```

If `needs_rework`, set `rework_instructions` to a concrete, actionable string.
Pass `verify.json` back to Skill 2 as additional context for the next cycle.

---

## Checklist

- [ ] Checked out PR branch and ran full test suite
- [ ] Issue test file specifically re-run
- [ ] Full diff reviewed line-by-line
- [ ] GitHub PR comment posted
- [ ] verify.json written to `handoffs/`
- [ ] If needs_rework: rework_instructions is specific and actionable
- [ ] If new bugs found: documented with severity and action
