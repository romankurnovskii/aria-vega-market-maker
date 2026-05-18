# Providers Architecture

The `providers` package contains components that connect to external data feeds and execution gateways.

## Data Flow

The system uses a **split data-access pattern**:

- **Read path**: `HummingbotProvider` / `MeteoraApiProvider` → Meteora Datapi API (`dlmm.datapi.meteora.ag`)
  - Pool info, positions, PnL, market snapshots
- **Write path**: `HummingbotProvider` → Hummingbot Gateway API (`localhost:8000`)
  - Open/close positions, add/remove liquidity, wallet management

## Components

- **`HummingbotProvider`**: Primary provider for all engine operations. Uses Meteora Datapi for read queries and Hummingbot API for write operations and wallet management. Lives under `hummingbot/`.
- **`MeteoraApiProvider`**: Dedicated provider for Meteora DLMM Datapi queries. Used as a read-only data source with rich caching. Lives under `meteora/`.

## Pure Utilities

- **`getBinIdFromPrice`**: Calculates the active bin ID from a price, bin step, and token decimals.
- **`getPriceFromBinId`**: Inverse of `getBinIdFromPrice`.
- **`calculateConcentratedLiquidityPrices`**: Computes entry pricing perspectives for CL positions.
- **`parseDecimalToRaw`**: Safely converts decimal string to raw integer string.

## Cache Strategy

| Cache            | TTL     | Used By                                                   |
| ---------------- | ------- | --------------------------------------------------------- |
| Pool data (full) | 10s     | `getPoolInfo`, `getMarketSnapshot`, `resolvePoolDecimals` |
| Pool decimals    | Forever | `getPositions` (lazily populated)                         |
| Position cache   | 30s     | `getPositions`                                            |
