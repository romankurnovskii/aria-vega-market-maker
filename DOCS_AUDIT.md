# Documentation Audit Finding: Missing "Price Enrichment" in INTERFACES.md

## Feature Implementation
Commit `1d7907c` (feat(api): enrich positions with price and range data (#22)) added the following fields to the `Position` interface in `packages/core/src/types/position.ts`:
- `lowerBoundPrice?: number;`
- `upperBoundPrice?: number;`
- `activeBin?: number;`
- `binCount?: number;`
- `rangePercent?: number;`

It also updated `apps/engine/src/server.ts` to populate these fields using `getPriceFromBinId`.

## Missing Documentation
The `docs/INTERFACES.md` file currently does not list these fields in its `Position` schema section.

---

# Documentation Audit Finding: "Stateless Rebalancing" status in ARCHITECTURE.md

## Feature Implementation
Commit `a7f315b` (refactor(core): remove awaiting_settlement task status for stateless rebalancing) implemented the "Stateless Rebalancing" proposal described in Appendix B of `docs/ARCHITECTURE.md`.

## Missing Documentation Updates
1. `docs/ARCHITECTURE.md` still lists Appendix B as "Status: Proposed".
2. Section 3.B (Stateful Rebalance Flow) is not yet marked as deprecated or superseded by the Stateless model in the main text, though the implementation has moved away from it.
3. The implementation checklist in B.7 is still mostly unchecked.
