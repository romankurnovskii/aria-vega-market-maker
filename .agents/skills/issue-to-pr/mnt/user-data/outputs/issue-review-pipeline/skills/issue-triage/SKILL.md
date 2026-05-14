---
name: issue-triage
description: >
  Phase 1 of the issue review pipeline. Use when asked to review a GitHub issue critically,
  analyze whether a bug report is valid, check if a proposed fix introduces new bugs, assess
  gap or caveats in an issue description, or do a first-pass code analysis with the codebase.
  Triggers on: "review this issue", "is this a real bug", "analyze issue #N", "review critically
  and find gaps", "review with the codebase", "check this suggestion". Output: triage.json.
  Does NOT write code or tests — read-only phase.
---

# Skill 1 — Issue Triage

**Role**: Critical reader. Your job is to determine if the issue is valid and worth fixing,
identify gaps in the issue description, and flag risks in any proposed solutions.

**Output**: `.dev/handoffs/triage.json` (see `../../references/handoff-schema.md` for full schema)

**Hard constraint**: Do NOT write code, run tests, or attempt a fix. Read only.

---

## Step 1 — Fetch the issue

Use the GitHub CLI or API to retrieve the full issue:

- Title, description, all comments
- Any linked PRs or referenced commits
- Labels, milestone, assignees

```bash
gh issue view <N> --repo <owner/repo> --json title,body,comments,labels
```

Note any proposed solutions in the comments — these need critical review too.

---

## Step 2 — Read the relevant codebase

Do NOT read the entire codebase. Be surgical:

1. From the issue description, identify which features/areas are affected
2. Use `grep`, `find`, or file tree browsing to locate relevant files
3. Read those files carefully — function signatures, error handling, edge cases
4. Cross-reference any specific line numbers or function names mentioned in the issue

**What to look for**:

- Does the code actually behave as the issue claims?
- Is the proposed fix (if any) correct? Would it introduce new bugs?
- Are there related functions that have the same problem?
- Are there tests already covering this path?

---

## Step 3 — Critical analysis

For each claim in the issue, evaluate:

| Claim        | Evidence in code                | Assessment                          |
| ------------ | ------------------------------- | ----------------------------------- |
| "X causes Y" | What does the code actually do? | Confirmed / Partially wrong / Wrong |

**Specific things to check**:

- **Accuracy**: Does the issue description match code behavior?
- **Completeness**: Are there reproduction steps? Are they sufficient?
- **Scope**: Is the proposed fix narrow enough? Does it handle all cases?
- **Risk**: Would the suggested approach break anything adjacent?
- **Gaps**: What's NOT mentioned that should be?

---

## Step 4 — Verdict

Choose one:

- `confirmed` — bug is real, reproducible path is clear, worth proceeding
- `rejected` — issue is invalid (user error, intended behavior, wrong repo, etc.)
- `needs_more_info` — insufficient detail to confirm; list exactly what's missing

If `rejected`, write a clear explanation and stop — do NOT proceed to Skill 2.

---

## Step 5 — Write triage.json

```bash
mkdir -p .dev/handoffs
cat > .dev/handoffs/triage.json << 'EOF'
{
  "skill": "issue-triage",
  "timestamp": "...",
  "issue_url": "...",
  "verdict": "confirmed",
  "confidence": "high",
  "summary": "...",
  "root_cause_hypothesis": "...",
  "relevant_files": [...],
  "gaps_found": [...],
  "new_bugs_risk": [...],
  "rejected_reason": null,
  "recommended_approach": "..."
}
EOF
```

---

## Step 6 — Post GitHub comment (optional but recommended)

If verdict is `confirmed`, post a concise comment on the issue:

- What you found
- Root cause hypothesis
- What you'll do next (if proceeding to Phase 2)

If `rejected`, post a polite, clear explanation.

```bash
gh issue comment <N> --repo <owner/repo> --body "..."
```

---

## Checklist before handing off

- [ ] triage.json written to `.dev/handoffs/`
- [ ] verdict is one of: confirmed / rejected / needs_more_info
- [ ] relevant_files lists actual paths (verify they exist)
- [ ] new_bugs_risk addresses any proposed solutions in the issue
- [ ] If rejected: explanation is clear and non-dismissive
- [ ] If confirmed: recommended_approach is specific enough for Skill 2 to act on
