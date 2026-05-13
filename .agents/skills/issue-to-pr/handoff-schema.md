# Handoff JSON Schemas

All handoff files live in the workspace root (or a `handoffs/` subdirectory if specified).

---

## triage.json — output of Skill 1

```json
{
  "skill": "issue-triage",
  "timestamp": "ISO8601",
  "issue_url": "https://github.com/org/repo/issues/N",
  "issue_number": 8,
  "verdict": "confirmed | rejected | needs_more_info",
  "confidence": "high | medium | low",
  "summary": "One sentence: what the issue actually claims.",
  "root_cause_hypothesis": "Where in the code this likely originates and why.",
  "relevant_files": [{ "path": "src/foo.ts", "reason": "Contains the logic described in the issue" }],
  "gaps_found": [
    "Issue claims X but the code does Y — the claim is partially wrong",
    "Missing reproduction steps for case Z"
  ],
  "new_bugs_risk": ["Proposed fix in issue comment would break edge case W"],
  "rejected_reason": "null if confirmed, otherwise: why the issue is invalid",
  "recommended_approach": "High-level fix direction for Skill 2 to validate"
}
```

**Gate**: if `verdict == "rejected"`, stop. Report to user. Do not proceed to Skill 2.

---

## repro.json — output of Skill 2

```json
{
  "skill": "issue-reproduce",
  "timestamp": "ISO8601",
  "issue_url": "...",
  "triage_used": true,
  "repro_confirmed": true,
  "repro_steps": ["Step 1: ...", "Step 2: ..."],
  "repro_environment": {
    "os": "...",
    "runtime": "node 20.x / python 3.11 / etc",
    "relevant_versions": {}
  },
  "test_file_path": "tests/issues/issue-8.test.ts",
  "failing_tests": [{ "name": "should reject negative input", "expected": "throws", "actual": "returns NaN" }],
  "edge_cases": [{ "description": "Empty array input", "expected_behavior": "return empty result", "covered": true }],
  "caveats": ["Race condition only manifests under load > 100 rps — test uses a mock"],
  "out_of_scope": ["Performance optimization mentioned in comments — separate issue"]
}
```

**Gate**: if `repro_confirmed == false`, stop. Report to user. Do not proceed to Skill 3.

---

## pr.json — output of Skill 3

```json
{
  "skill": "issue-fix-pr",
  "timestamp": "ISO8601",
  "issue_url": "...",
  "branch_name": "issue/8-fix-negative-input-handling",
  "pr_url": "https://github.com/org/repo/pull/42",
  "pr_number": 42,
  "files_changed": [{ "path": "src/foo.ts", "change_summary": "Added guard for negative values" }],
  "tests_added": ["tests/issues/issue-8.test.ts"],
  "tests_all_pass": true,
  "regression_check_passed": true,
  "regression_check_notes": "Ran full test suite, 0 failures",
  "known_tradeoffs": ["Chose to throw instead of coerce — matches existing error handling pattern"],
  "review_guidance": "Focus on lines 42-55 in src/foo.ts — that's the entire change surface"
}
```

**Gate**: PR must exist and `tests_all_pass == true` before Skill 4 starts.

---

## verify.json — output of Skill 4

```json
{
  "skill": "issue-verify",
  "timestamp": "ISO8601",
  "pr_url": "...",
  "original_issue_url": "...",
  "verdict": "approved | needs_rework",
  "all_failing_tests_now_pass": true,
  "new_failures": [],
  "diff_concerns": [{ "file": "src/foo.ts", "line": 48, "concern": "Magic number 42 — should be a named constant" }],
  "new_issues_found": [
    { "description": "Adjacent function bar() has the same bug", "severity": "medium", "action": "open new issue" }
  ],
  "rework_reason": "null if approved",
  "rework_instructions": "null if approved, otherwise specific instructions for Skill 2 re-run"
}
```

**If `needs_rework`**: pass `verify.json` back as context when restarting Skill 2.
