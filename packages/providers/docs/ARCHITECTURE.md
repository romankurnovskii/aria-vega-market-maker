# Providers Architecture

The `providers` package contains components that connect to external data feeds and execution gateways. Following the refactor to use Hummingbot, this package is simplified to use a single provider that communicates with the Hummingbot API.

## Components

- **`HummingbotProvider`**: Connects to the Hummingbot API server to query pool information and market data. This replaces the legacy direct integrations with specific DEX APIs and RPC nodes. Lives under the `hummingbot/` directory.

## Legacy Components (Removed/Deprecated)

- **`MeteoraApiProvider`**: (Removed) Connected to the Meteora DLMM Datapi endpoint.
- **`SolanaRpcProvider`**: (Removed) Direct connection to Solana RPC nodes.
- **`HeliusRpcProvider`**: (Removed) Specialized RPC connection for Helius endpoints.
- **`RpcPool`**: (Removed) Load balancer for multiple RPC nodes.
