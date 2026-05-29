# Aria Vega Market Maker

Aria Vega Market Maker is a specialized, automated liquidity provision and trading system. It features a robust backend engine and a modern React-based frontend to monitor, build, and deploy market-making strategies efficiently.

## Overview

This project is built as a monorepo containing:

- **Engine**: The core market-making daemon that interfaces with exchanges and manages trading logic.
- **Frontend**: A sleek, user-friendly interface to track active positions, visualize trading pipelines, and view real-time logs.

![Aria Vega Market Maker GUI](./docs/assets/gui_screenshot.png)

## Requirements

- **Node.js** (v24 or compatible)
- **pnpm** (Package manager)
- **Docker & Docker Compose**
- **Hummingbot**: This system **requires running hummingbot bot services** concurrently for executing trading strategies on crypto exchanges.

## Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the development environment (Engine + Frontend):**

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **Access the Interface:**
   Navigate to `http://localhost:8442` in your browser.

_Note: For architecture details and documentation, please see [docs/START_HERE.md](./docs/START_HERE.md)._
