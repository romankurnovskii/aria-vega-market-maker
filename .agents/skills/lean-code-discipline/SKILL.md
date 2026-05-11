---
name: lean-code-discipline
description: >
  Enforce strict code generation discipline: no placeholders, no stub methods, no TODO comments, no unrequested features, no dead code. Use this skill whenever generating, editing, or reviewing code for an AI agent or any software project. Trigger on: any code generation task, any architecture-driven implementation, any request to write or modify code, any review of generated code for quality. This skill is especially critical when the user provides an architecture block, a spec, or a list of required features — the agent must implement ONLY what is described, nothing more. If you're about to write a function, class, or block of code, this skill applies.
---

# Lean Code Discipline

Strict rules for disciplined, production-quality code generation. Every rule below is mandatory — not a suggestion.

---

## Core Mandate

**Implement only what is explicitly requested or explicitly described in the architecture/spec.**

Nothing more. Nothing less.

---

## Rule 1 — No Placeholders

Never emit:

- `# TODO: implement this`
- `pass  # implement later`
- `throw new NotImplementedException()`
- `// placeholder`
- `return null; // TODO`
- `/* ... */` as a body substitute
- `"your logic here"` strings
- `raise NotImplementedError`
- Any variant of the above

**If a method body cannot be fully implemented with the information given, do not create the method at all.** Ask the user for the missing spec instead.

---

## Rule 2 — No Unrequested Methods or Functions

Only create methods/functions that are:

1. Explicitly named in the architecture block or spec, **or**
2. Directly required as a private helper to implement something in (1) — with no alternative

Do **not** add:

- Convenience wrappers the user didn't ask for
- Overloaded variants "just in case"
- Utility functions that might be useful someday
- Getter/setter pairs when only one was specified
- `toString()`, `equals()`, `hashCode()` unless requested or required by the language/framework
- Logging, metrics, or instrumentation hooks unless specified

**When in doubt, leave it out.**

---

## Rule 3 — No Dead Code

Do not emit:

- Commented-out code blocks
- Unused imports or `require` statements
- Variables declared but never read
- Functions defined but never called (within the generated scope)
- Unreachable branches (`if false`, `while false`, etc.)
- Disabled feature flags left as stubs
- Old/alternative implementations left as comments

Every line of code in the output must serve an active purpose in the current deliverable.

---

## Rule 4 — No Speculative Architecture

Do not add:

- Abstract base classes not specified in the architecture
- Interfaces "for future extensibility"
- Factory patterns when a direct instantiation was requested
- Dependency injection containers unless specified
- Plugin systems, hooks, or event buses not in the spec
- Config files for features not yet requested
- Environment variable handling for things not described

Implement the simplest structure that satisfies the explicit requirements. Refactoring for extensibility is a future task the user will ask for.

---

## Rule 5 — Follow Only Good Patterns

When implementation choices exist, always prefer:

| Situation       | Prefer                                | Avoid                                            |
| --------------- | ------------------------------------- | ------------------------------------------------ |
| Error handling  | Explicit, typed errors / Result types | Silent swallowing, bare `except`, `catch (e) {}` |
| Naming          | Descriptive, unambiguous names        | `temp`, `data`, `obj`, `foo`, `x`                |
| Function length | Single responsibility, short          | Monolithic functions doing many things           |
| State           | Immutable by default                  | Mutating shared state unnecessarily              |
| Side effects    | Isolated and explicit                 | Hidden side effects inside "pure" functions      |
| Types           | Typed / annotated                     | `any`, untyped `object`, erased generics         |
| Async           | Consistent (all async or all sync)    | Mixed sync/async in the same call chain          |
| Dependencies    | Only what's needed                    | Importing heavy libraries for one small util     |

These patterns apply regardless of whether the user specified them. They are baseline quality floors.

---

## Rule 6 — Architecture Block Is the Contract

When the user provides an architecture block (class diagram, interface list, module spec, API contract, etc.):

1. Read it completely before writing a single line of code.
2. Identify every entity (class, function, endpoint, type) explicitly listed.
3. Implement **each listed entity fully** — no stubs.
4. Implement **only listed entities** — nothing extra.
5. If the architecture is ambiguous or incomplete for a required entity, **stop and ask** before guessing.

The architecture block is the contract. Do not extend it unilaterally.

---

## Checklist Before Emitting Code

Run this before finalizing any code output:

- [ ] Does every method have a complete, working body? (No placeholders)
- [ ] Was every method/class/function requested or architecturally required?
- [ ] Is every import/require actually used?
- [ ] Is every variable actually read?
- [ ] Is every function actually called (or is it a public API entry point)?
- [ ] Are there any commented-out blocks? (Remove them)
- [ ] Are there any TODO/FIXME/HACK comments? (Resolve or remove)
- [ ] Did I add anything not in the spec? (Remove it)
- [ ] Did I skip anything that IS in the spec? (Implement it)

If any box is unchecked, fix before outputting.

---

## When Requirements Are Unclear

Do this — in order:

1. **State specifically what is unclear.** Name the method, field, or behavior you cannot implement without more information.
2. **Ask one focused question** to resolve the ambiguity.
3. **Wait for the answer** before writing code for that part.
4. Do not write a stub as a placeholder while waiting.

---

## What Good Output Looks Like

```
User: "Implement the UserRepository class from the architecture block.
       It has: findById(id), save(user), delete(id)"

✅ GOOD:
- findById fully implemented with real query logic
- save fully implemented with persistence logic
- delete fully implemented
- No extra methods added (no findAll, no update, no count)
- No unused imports
- No TODO comments

❌ BAD:
- findById returns null  // TODO: implement
- Added findByEmail "because it's usually needed"
- Added a helper cacheUser() that nothing calls
- Commented out an old implementation
- import SomeLib  // might need this later
```

---

## Summary

> Write only what was asked.  
> Write it completely.  
> Write it cleanly.  
> Delete what isn't used.  
> Ask before guessing.
