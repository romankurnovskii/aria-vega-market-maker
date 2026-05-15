# Agent Documentation System Rules

Every agent working in this repo **must** read this file first and keep the doc system in sync on every change.

---

## Doc System Overview

```
<monorepo-root>/
├── AGENTS.md                  ← you are here; entry point for all agents
├── README.md                  ← human-facing project summary (short)
├── .dev/                      ← NOT git-committed; scratch space for agents & developer
├── docs/                      ← root-level architecture docs
│   └── START_HERE.md          ← index of all docs in this dir
└── <package>/
    ├── docs/
    │   └── START_HERE.md      ← index of all docs in this package
    └── ...
```

---

## Rules — Read Before Every Task

### 1. Always read START_HERE.md first

Before touching any package, read its `docs/START_HERE.md`.
Before touching anything cross-cutting, read root `docs/START_HERE.md`.
If the file does not exist yet, **create it**.

### 2. Keep START_HERE.md up to date

After every task that adds, removes, or significantly changes a doc:

- Add or remove the entry in the relevant `START_HERE.md`.
- One line per doc: `- [filename.md](filename.md) — one-sentence description`.
- Entries are grouped by category (Architecture, API, Decisions, Q&A, etc.).

### 3. Keep README.md up to date

`README.md` lives at the monorepo root. It is **short** — never more than ~40 lines.

### 4. Architecture questions → Q&A doc

Record questions in `docs/QA.md` using the standard layout.

### 5. Use .dev/ for intermediate work

When a task requires throwaway scripts or draft templates, write them under `.dev/`.

### 6. Creating a new package in the monorepo

Scaffold these files immediately:

```
<package>/
└── docs/
    ├── START_HERE.md    ← index
    └── ARCHITECTURE.md  ← high-level design of this package
```

Then add a reference to the new package's `docs/START_HERE.md` in the **root** `docs/START_HERE.md`.

### 7. Avoid Repeating Known Bugs

Before modifying Solana or Meteora integration logic, you **must** read [docs/SOLANA_CLMM_FINDINGS.md](docs/SOLANA_CLMM_FINDINGS.md). This document contains critical anti-patterns and SDK quirks discovered in this repository.
