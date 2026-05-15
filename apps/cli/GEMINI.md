# CLI Architectural Mandates

## Core Principles
- **No Direct On-Chain Logic:** The CLI tool MUST NOT implement on-chain logic (e.g., transaction building, signing primitives beyond keypair loading, or protocol-specific program calls) directly.
- **Executor Reuse:** All on-chain operations MUST be delegated to the `@lp-system/executor` package. The CLI's role is to gather input, prepare the `Decision` object, and invoke the executor.
- **Step Reuse:** Calculation logic for ranges, amounts, and other strategy parameters SHOULD be encapsulated in `@lp-system/steps` and reused within the CLI.

## Workflow
1. Parse CLI arguments and environment variables.
2. Initialize necessary providers from `@lp-system/providers`.
3. Initialize the executor from `@lp-system/executor`.
4. Orchestrate strategy logic using `@lp-system/steps`.
5. Execute the resulting `Decision` via `executor.apply()`.
