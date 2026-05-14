---
name: issue-review-pipeline
description: >
  Multi-phase GitHub issue review and fix pipeline. Use this skill whenever someone asks to
  review a GitHub issue, analyze a bug report, reproduce an issue, fix a bug and open a PR,
  or verify a pull request fixes the original issue. Also triggers for phrases like "look at
  this issue", "check if this suggestion introduces bugs", "review this critically with the
  codebase", "write tests for this issue", or "confirm the fix works". Each phase is handled
  by a focused sub-skill — read this file first to know which one to invoke.
---

# Issue Review Pipeline — Coordinator

This pipeline separates issue handling into **4 focused phases**, each with a dedicated skill.
No single agent does everything. Each phase produces a JSON handoff artifact that gates the next.

## When to use which skill

| User says                                                      | Start at                                             |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| "review this issue", "analyze issue #N", "is this a real bug?" | **Skill 1 — issue-triage**                           |
| "reproduce this bug", "write failing tests for #N"             | **Skill 2 — issue-reproduce** (requires triage.json) |
| "fix this and open a PR", "implement the fix"                  | **Skill 3 — issue-fix-pr** (requires repro.json)     |
| "verify the PR", "check if fix works", "no regressions?"       | **Skill 4 — issue-verify** (requires pr.json)        |
| "review issue #N end to end"                                   | Start at Skill 1, proceed through all phases         |

## Sub-skill locations

- `skills/issue-triage/SKILL.md` — Phase 1: read, analyze, confirm or reject
- `skills/issue-reproduce/SKILL.md` — Phase 2: reproduce, write failing tests, enumerate edge cases
- `skills/issue-fix-pr/SKILL.md` — Phase 3: implement fix, verify tests pass, open PR
- `skills/issue-verify/SKILL.md` — Phase 4: re-run tests, review diff, sign off or send back

## Handoff format

Each phase writes a JSON file inside `.dev/handoffs/` that the next phase reads as its input context.
This prevents agents from re-doing prior work, keeps each agent's scope narrow, and prevents git root repository clutter in accordance with Rule #5 of `RULE[AGENTS.md]`.

```
.dev/handoffs/triage.json  →  .dev/handoffs/repro.json  →  .dev/handoffs/pr.json  →  .dev/handoffs/verify.json
```

See `references/handoff-schema.md` for the full JSON schema for each file.

## Gating rules

- **Skill 2 must not start** if `triage.json.verdict == "rejected"` — stop and report to user
- **Skill 3 must not start** if `repro.json.repro_confirmed == false`
- **Skill 4 must not start** until a real PR URL exists in `pr.json`
- **If verify returns `needs_rework`**: restart from Skill 2 with the verify.json as additional context

## CRITICAL: What each agent must NOT do

- **Triage agent**: must not write any code or tests. Read only.
- **Reproduce agent**: must not attempt any fix. Write tests that FAIL — do not make them pass.
- **Fix agent**: must not re-analyze or re-scope. Trust repro.json. Fix exactly what's there.
- **Verify agent**: must not modify code. Observe and report only.
