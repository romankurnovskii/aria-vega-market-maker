# OpenAPI Specification Reference

This custom skill references and utilizes the official OpenAPI specification of the Aria Vega Market Maker control plane.

## Schema Location

The official OpenAPI yaml definition can be viewed here:

- [openapi.yaml](file:///Users/r/dev/github/aria-vega-market-maker/apps/engine/src/openapi.yaml)

## Supported Introspection Endpoints

- **GET** `/health` — System Health Check
- **GET** `/strategies` — List Available Strategies
- **GET** `/steps` — List Available Pipeline Steps
- **GET** `/positions` — List Active Positions for the wallet
- **GET** `/assignments` — List Persistent Assignments
- **POST** `/assignments` — Create a Position Assignment
- **DELETE** `/assignments/{id}` — Delete a Position Assignment
- **POST** `/strategies/{id}/evaluate` — Evaluate Strategy Ad-hoc
