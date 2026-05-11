# Providers Architecture

The `providers` package contains components that connect to external data feeds and blockchain nodes.

## Components

- **`MeteoraApiProvider`**: Connects to the Meteora DLMM Datapi endpoint to query open positions, pool layouts, and historical market metrics.
- **`SolanaRpcProvider` & `HelioRpcProvider`**: Abstract connection points using the standard `@solana/web3.js` `Connection` client.
- **`RpcPool`**: Combines multiple RPC nodes into a round-robin load balancer. Handles automated rate-limiting failures (HTTP 429) via progressive Fibonacci backoffs.
