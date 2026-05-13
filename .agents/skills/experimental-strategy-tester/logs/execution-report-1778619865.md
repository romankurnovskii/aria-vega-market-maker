## Monitoring Started for Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi at Wed May 13 00:04:25 IDT 2026

### Update: Wed May 13 00:04:25 IDT 2026

```text
market-maker-1  | 21:04:09.413 [lifecycle] INFO: '[Discovery] Discovered new live position: 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:04:10.455 [lifecycle] INFO: '[Tick Loop] Evaluating position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi on chain [solana]'
market-maker-1  | 21:04:10.455 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:04:10.913 [lifecycle] INFO: '[Tick Loop] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi details: Pool Price: 94.8054060373668 | Bounds: [-5902, -5898] | In-Range: false'
market-maker-1  | 21:04:10.913 [lifecycle] INFO: '[Tick Loop] No execution required for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:04:17.848 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:04:17.849 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
```

### Update: Wed May 13 00:05:25 IDT 2026

```text
market-maker-1  | 21:05:12.535 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778619912531_371 (pending_close) for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:05:13.587 [lifecycle] INFO: '[Execution Monitor] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi state updated to REBALANCING'
market-maker-1  | 21:05:13.590 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'close' on position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi"
market-maker-1  | 21:05:13.590 [solana-executor] INFO: '[SolanaExecutor] Creating CLOSE transaction for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:05:14.181 [solana-executor] INFO: '[SolanaExecutor] Found position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi on-chain in bin range [-5902, -5898]. Building removal transactions...'
market-maker-1  | 21:05:14.182 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building RemoveLiquidity Txs for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi (Bins: -5902 to -5898)'
market-maker-1  | 21:05:14.544 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building ClosePosition Tx for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi in pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6'
market-maker-1  | 21:05:15.353 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/15 for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi (Action: close). Elapsed: 0ms.'
market-maker-1  | 21:05:17.855 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/15 for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi (Action: close). Elapsed: 2502ms.'
market-maker-1  | 21:05:20.124 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #3/15 for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi (Action: close). Elapsed: 4771ms.'
market-maker-1  | 21:05:22.378 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #4/15 for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi (Action: close). Elapsed: 7025ms.'
market-maker-1  | 21:05:24.698 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #5/15 for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi (Action: close). Elapsed: 9345ms.'
```

### Update: Wed May 13 00:06:25 IDT 2026

```text
market-maker-1  | 21:06:09.428 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778619912531_371 (pending_close) for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:06:10.765 [lifecycle] INFO: '[Execution Monitor] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi state updated to REBALANCING'
market-maker-1  | 21:06:10.768 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'close' on position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi"
market-maker-1  | 21:06:10.768 [solana-executor] INFO: '[SolanaExecutor] Creating CLOSE transaction for position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:06:11.083 [solana-executor] ERROR: '[SolanaExecutor] Execution sequence failed: Cannot close position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi: not found on-chain for wallet HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh'
market-maker-1  | 21:06:11.083 [lifecycle] WARN: '[Execution Monitor] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi was not found on-chain (already closed). Proceeding with rebalance flow.'
market-maker-1  | 21:06:13.242 [lifecycle] INFO: '[Tick Loop] Evaluating position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi on chain [solana]'
market-maker-1  | 21:06:13.242 [lifecycle] INFO: '[Tick Loop] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Wed May 13 00:07:25 IDT 2026

```text
market-maker-1  | 21:07:19.408 [lifecycle] INFO: '[Execution Monitor] Updating assignment asg_exp_test position ID from 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi to 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 21:07:21.468 [lifecycle] INFO: '[Tick Loop] Evaluating position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi on chain [solana]'
market-maker-1  | 21:07:21.468 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:07:21.486 [lifecycle] WARN: '[Tick Loop] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi was not found on-chain. Marking as CLOSED and archiving.'
```

### Update: Wed May 13 00:08:25 IDT 2026

```text
market-maker-1  | 21:07:21.468 [lifecycle] INFO: '[Tick Loop] Evaluating position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi on chain [solana]'
market-maker-1  | 21:07:21.468 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi'
market-maker-1  | 21:07:21.486 [lifecycle] WARN: '[Tick Loop] Position 6jxesvvM1TXhsBhGZb2C9TibCaiWmmP4BusWvzuhdeoi was not found on-chain. Marking as CLOSED and archiving.'
```

### Update: Wed May 13 00:09:25 IDT 2026

```text

```

### Update: Wed May 13 00:10:25 IDT 2026

```text

```

### Update: Wed May 13 00:11:25 IDT 2026

```text

```

### Update: Wed May 13 00:12:26 IDT 2026

```text

```

### Update: Wed May 13 00:13:26 IDT 2026

```text

```

### Update: Wed May 13 00:14:26 IDT 2026

```text

```

### Update: Wed May 13 00:15:26 IDT 2026

```text

```

## Dynamic Monitoring Started for Assignment asg_exp_test at Wed May 13 00:16:19 IDT 2026

### Initial Position Tracked: 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f

### Update: Wed May 13 00:16:19 IDT 2026

```text

```

### Update: Wed May 13 00:17:20 IDT 2026

```text

```

### Update: Wed May 13 00:18:20 IDT 2026

```text

```

### Update: Wed May 13 00:19:20 IDT 2026

```text

```

### Update: Wed May 13 00:20:20 IDT 2026

```text

```

### Update: Wed May 13 00:21:20 IDT 2026

```text

```

### Update: Wed May 13 00:22:20 IDT 2026

```text

```

### Update: Wed May 13 00:23:21 IDT 2026

```text

```

### Update: Wed May 13 00:24:21 IDT 2026

```text

```

### Update: Wed May 13 00:25:21 IDT 2026

```text

```

### Update: Wed May 13 00:26:21 IDT 2026

```text

```

### Update: Wed May 13 00:27:21 IDT 2026

```text

```

### Update: Wed May 13 00:28:21 IDT 2026

```text

```

### Update: Wed May 13 00:29:22 IDT 2026

```text

```

### Update: Wed May 13 00:30:22 IDT 2026

```text

```

### Update: Wed May 13 00:31:22 IDT 2026

```text

```

### Update: Wed May 13 00:32:22 IDT 2026

```text

```

### Update: Wed May 13 00:33:22 IDT 2026

```text

```

### Update: Wed May 13 00:34:23 IDT 2026

```text

```

### Update: Wed May 13 00:35:23 IDT 2026

```text

```

### Update: Wed May 13 00:36:23 IDT 2026

```text

```

### Update: Wed May 13 00:37:23 IDT 2026

```text

```

### Update: Wed May 13 00:38:23 IDT 2026

```text

```

### Update: Wed May 13 00:39:23 IDT 2026

```text

```

### Update: Wed May 13 00:40:24 IDT 2026

```text

```

### Update: Wed May 13 00:41:24 IDT 2026

```text

```

### Update: Wed May 13 00:42:24 IDT 2026

```text

```

### Update: Wed May 13 00:43:24 IDT 2026

```text

```

### Update: Wed May 13 00:44:24 IDT 2026

```text

```

### Update: Wed May 13 00:45:24 IDT 2026

```text

```

### Update: Wed May 13 00:46:25 IDT 2026

```text

```

### Update: Wed May 13 00:47:25 IDT 2026

```text

```

### Update: Wed May 13 00:48:25 IDT 2026

```text

```

### Update: Wed May 13 00:49:25 IDT 2026

```text

```

### Update: Wed May 13 00:50:25 IDT 2026

```text

```

### Update: Wed May 13 00:51:25 IDT 2026

```text

```

### Update: Wed May 13 00:52:26 IDT 2026

```text

```

### Update: Wed May 13 00:53:26 IDT 2026

```text

```

### Update: Wed May 13 00:54:26 IDT 2026

```text

```

### Update: Wed May 13 00:55:26 IDT 2026

```text

```

### Update: Wed May 13 00:56:26 IDT 2026

```text

```

### Update: Wed May 13 00:57:26 IDT 2026

```text

```

### Update: Wed May 13 00:58:27 IDT 2026

```text

```

### Update: Wed May 13 00:59:27 IDT 2026

```text

```

### Update: Wed May 13 01:00:27 IDT 2026

```text

```

### Update: Wed May 13 01:01:27 IDT 2026

```text

```

### Update: Wed May 13 01:02:27 IDT 2026

```text

```

### Update: Wed May 13 01:03:28 IDT 2026

```text

```

### Update: Wed May 13 01:04:28 IDT 2026

```text

```

### Update: Wed May 13 01:05:28 IDT 2026

```text

```

### Update: Wed May 13 01:06:28 IDT 2026

```text

```

### Update: Wed May 13 01:07:28 IDT 2026

```text

```

### Update: Wed May 13 01:08:28 IDT 2026

```text

```

### Update: Wed May 13 01:09:29 IDT 2026

```text

```

### Update: Wed May 13 01:10:29 IDT 2026

```text

```

### Update: Wed May 13 01:11:29 IDT 2026

```text

```

### Update: Wed May 13 01:12:29 IDT 2026

```text

```

### Update: Wed May 13 01:13:29 IDT 2026

```text

```

### Update: Wed May 13 01:14:29 IDT 2026

```text

```

### Update: Wed May 13 01:15:30 IDT 2026

```text

```

### Update: Wed May 13 01:16:30 IDT 2026

```text

```

### Update: Wed May 13 01:17:30 IDT 2026

```text

```

### Update: Wed May 13 01:18:30 IDT 2026

```text

```

### Update: Wed May 13 01:19:30 IDT 2026

```text

```

### Update: Wed May 13 01:20:30 IDT 2026

```text

```

### Update: Wed May 13 01:21:31 IDT 2026

```text

```

### Update: Wed May 13 01:22:31 IDT 2026

```text

```

### Update: Wed May 13 01:23:31 IDT 2026

```text

```

### Update: Wed May 13 01:24:31 IDT 2026

```text

```

### Update: Wed May 13 01:25:31 IDT 2026

```text

```

### Update: Wed May 13 01:26:31 IDT 2026

```text

```

### Update: Wed May 13 01:27:32 IDT 2026

```text

```

### Update: Wed May 13 01:28:32 IDT 2026

```text

```

### Update: Wed May 13 01:29:32 IDT 2026

```text

```

### Update: Wed May 13 01:30:32 IDT 2026

```text

```

### Update: Wed May 13 01:31:32 IDT 2026

```text

```

### Update: Wed May 13 01:32:32 IDT 2026

```text

```

### Update: Wed May 13 01:33:33 IDT 2026

```text

```

### Update: Wed May 13 01:34:33 IDT 2026

```text

```

### Update: Wed May 13 01:35:33 IDT 2026

```text

```

### Update: Wed May 13 01:36:33 IDT 2026

```text

```

### Update: Wed May 13 01:37:33 IDT 2026

```text

```

### Update: Wed May 13 01:38:34 IDT 2026

```text

```

### Update: Wed May 13 01:39:34 IDT 2026

```text

```

### Update: Wed May 13 01:40:34 IDT 2026

```text

```

### Update: Wed May 13 01:41:34 IDT 2026

```text

```

### Update: Wed May 13 01:42:34 IDT 2026

```text

```

### Update: Wed May 13 01:43:34 IDT 2026

```text

```

### Update: Wed May 13 01:44:35 IDT 2026

```text

```

### Update: Wed May 13 01:45:35 IDT 2026

```text

```

### Update: Wed May 13 01:46:35 IDT 2026

```text

```

### Update: Wed May 13 01:47:35 IDT 2026

```text

```

### Update: Wed May 13 01:48:35 IDT 2026

```text

```

### Update: Wed May 13 01:49:35 IDT 2026

```text

```

### Update: Wed May 13 01:50:36 IDT 2026

```text

```

### Update: Wed May 13 01:51:36 IDT 2026

```text

```

### Update: Wed May 13 01:52:36 IDT 2026

```text

```

### Update: Wed May 13 01:53:36 IDT 2026

```text

```

### Update: Wed May 13 01:54:36 IDT 2026

```text

```

### Update: Wed May 13 01:55:36 IDT 2026

```text

```

### Update: Wed May 13 01:56:37 IDT 2026

```text

```

### Update: Wed May 13 01:57:37 IDT 2026

```text

```

### Update: Wed May 13 01:58:37 IDT 2026

```text

```

### Update: Wed May 13 01:59:37 IDT 2026

```text

```

### Update: Wed May 13 02:00:37 IDT 2026

```text

```

### Update: Wed May 13 02:01:38 IDT 2026

```text

```

### Update: Wed May 13 02:02:38 IDT 2026

```text

```

### Update: Wed May 13 02:03:38 IDT 2026

```text

```

### Update: Wed May 13 02:04:38 IDT 2026

```text

```

### Update: Wed May 13 02:05:38 IDT 2026

```text

```

### Update: Wed May 13 02:06:38 IDT 2026

```text

```

### Update: Wed May 13 02:07:39 IDT 2026

```text

```

### Update: Wed May 13 02:08:39 IDT 2026

```text

```

### Update: Wed May 13 02:09:39 IDT 2026

```text

```

### Update: Wed May 13 02:10:39 IDT 2026

```text

```

### Update: Wed May 13 02:11:39 IDT 2026

```text

```

### Update: Wed May 13 02:12:39 IDT 2026

```text

```

### Update: Wed May 13 02:13:40 IDT 2026

```text

```

### Update: Wed May 13 02:14:40 IDT 2026

```text

```

### Update: Wed May 13 02:15:40 IDT 2026

```text

```

### Update: Wed May 13 02:16:40 IDT 2026

```text

```

### Update: Wed May 13 02:17:40 IDT 2026

```text

```

### Update: Wed May 13 02:18:41 IDT 2026

```text

```

### Update: Wed May 13 02:19:41 IDT 2026

```text

```

### Update: Wed May 13 02:20:41 IDT 2026

```text

```

### Update: Wed May 13 02:21:41 IDT 2026

```text

```

### Update: Wed May 13 02:22:41 IDT 2026

```text

```

### Update: Wed May 13 02:23:41 IDT 2026

```text

```

### Update: Wed May 13 02:24:42 IDT 2026

```text

```

### Update: Wed May 13 02:25:42 IDT 2026

```text

```

### Update: Wed May 13 02:26:42 IDT 2026

```text

```

### Update: Wed May 13 02:27:42 IDT 2026

```text

```

### Update: Wed May 13 02:28:42 IDT 2026

```text

```

### Update: Wed May 13 02:29:42 IDT 2026

```text

```

### Update: Wed May 13 02:30:43 IDT 2026

```text

```

### Update: Wed May 13 02:31:43 IDT 2026

```text

```

### Update: Wed May 13 02:32:43 IDT 2026

```text

```

### Update: Wed May 13 02:33:43 IDT 2026

```text

```

### Update: Wed May 13 02:34:43 IDT 2026

```text

```

### Update: Wed May 13 02:35:43 IDT 2026

```text

```

### Update: Wed May 13 02:36:44 IDT 2026

```text

```

### Update: Wed May 13 02:37:44 IDT 2026

```text

```

### Update: Wed May 13 02:38:44 IDT 2026

```text

```

### Update: Wed May 13 02:39:44 IDT 2026

```text

```

### Update: Wed May 13 02:40:44 IDT 2026

```text

```

### Update: Wed May 13 02:41:45 IDT 2026

```text

```

### Update: Wed May 13 02:42:45 IDT 2026

```text

```

### Update: Wed May 13 02:43:45 IDT 2026

```text

```

### Update: Wed May 13 02:44:45 IDT 2026

```text

```

### Update: Wed May 13 02:45:45 IDT 2026

```text

```

### Update: Wed May 13 02:46:45 IDT 2026

```text

```

### Update: Wed May 13 02:47:46 IDT 2026

```text

```

### Update: Wed May 13 02:48:46 IDT 2026

```text

```

### Update: Wed May 13 02:49:46 IDT 2026

```text

```

### Update: Wed May 13 02:50:46 IDT 2026

```text

```

### Update: Wed May 13 02:51:46 IDT 2026

```text

```

### Update: Wed May 13 02:52:46 IDT 2026

```text

```

### Update: Wed May 13 02:53:47 IDT 2026

```text

```

### Update: Wed May 13 02:54:47 IDT 2026

```text

```

### Update: Wed May 13 02:55:47 IDT 2026

```text

```

### Update: Wed May 13 02:56:47 IDT 2026

```text

```

### Update: Wed May 13 02:57:47 IDT 2026

```text

```

### Update: Wed May 13 02:58:48 IDT 2026

```text

```

### Update: Wed May 13 02:59:48 IDT 2026

```text

```

### Update: Wed May 13 03:00:48 IDT 2026

```text

```

### Update: Wed May 13 03:01:48 IDT 2026

```text

```

### Update: Wed May 13 03:02:48 IDT 2026

```text

```

### Update: Wed May 13 03:03:48 IDT 2026

```text

```

### Update: Wed May 13 03:04:49 IDT 2026

```text

```

### Update: Wed May 13 03:05:49 IDT 2026

```text

```

### Update: Wed May 13 03:06:49 IDT 2026

```text

```

### Update: Wed May 13 03:07:49 IDT 2026

```text

```

### Update: Wed May 13 03:08:49 IDT 2026

```text

```

### Update: Wed May 13 03:09:49 IDT 2026

```text

```

### Update: Wed May 13 03:10:50 IDT 2026

```text

```

### Update: Wed May 13 03:11:50 IDT 2026

```text

```

### Update: Wed May 13 03:12:50 IDT 2026

```text

```

### Update: Wed May 13 03:13:50 IDT 2026

```text

```

### Update: Wed May 13 03:14:50 IDT 2026

```text

```

### Update: Wed May 13 03:15:51 IDT 2026

```text

```

### Update: Wed May 13 03:16:51 IDT 2026

```text

```

### Update: Wed May 13 03:17:51 IDT 2026

```text

```

### Update: Wed May 13 03:18:51 IDT 2026

```text

```

### Update: Wed May 13 03:19:51 IDT 2026

```text

```

### Update: Wed May 13 03:20:51 IDT 2026

```text

```

### Update: Wed May 13 03:21:52 IDT 2026

```text

```

### Update: Wed May 13 03:22:52 IDT 2026

```text

```

### Update: Wed May 13 03:23:52 IDT 2026

```text

```

### Update: Wed May 13 03:24:52 IDT 2026

```text

```

### Update: Wed May 13 03:25:52 IDT 2026

```text

```

### Update: Wed May 13 03:26:53 IDT 2026

```text

```

### Update: Wed May 13 03:27:53 IDT 2026

```text

```

### Update: Wed May 13 03:28:53 IDT 2026

```text

```

### Update: Wed May 13 03:29:53 IDT 2026

```text

```

### Update: Wed May 13 03:30:53 IDT 2026

```text

```

### Update: Wed May 13 03:31:53 IDT 2026

```text

```

### Update: Wed May 13 03:32:54 IDT 2026

```text

```

### Update: Wed May 13 03:33:54 IDT 2026

```text

```

### Update: Wed May 13 03:34:54 IDT 2026

```text

```

### Update: Wed May 13 03:35:54 IDT 2026

```text

```

### Update: Wed May 13 03:36:54 IDT 2026

```text

```

### Update: Wed May 13 03:37:54 IDT 2026

```text

```

### Update: Wed May 13 03:38:55 IDT 2026

```text

```

### Update: Wed May 13 03:39:55 IDT 2026

```text

```

### Update: Wed May 13 03:40:55 IDT 2026

```text

```

### Update: Wed May 13 03:41:55 IDT 2026

```text

```

### Update: Wed May 13 03:42:55 IDT 2026

```text

```

### Update: Wed May 13 03:43:56 IDT 2026

```text

```

### Update: Wed May 13 03:44:56 IDT 2026

```text

```

### Update: Wed May 13 03:45:56 IDT 2026

```text

```

### Update: Wed May 13 03:46:56 IDT 2026

```text

```

### Update: Wed May 13 03:47:56 IDT 2026

```text

```

### Update: Wed May 13 03:48:56 IDT 2026

```text

```

### Update: Wed May 13 03:49:57 IDT 2026

```text

```

### Update: Wed May 13 03:50:57 IDT 2026

```text

```

### Update: Wed May 13 03:51:57 IDT 2026

```text

```

### Update: Wed May 13 03:52:57 IDT 2026

```text

```

### Update: Wed May 13 03:53:57 IDT 2026

```text

```

### Update: Wed May 13 03:54:57 IDT 2026

```text

```

### Update: Wed May 13 03:55:58 IDT 2026

```text

```

### Update: Wed May 13 03:56:58 IDT 2026

```text

```

### Update: Wed May 13 03:57:58 IDT 2026

```text

```

### Update: Wed May 13 03:58:58 IDT 2026

```text

```

### Update: Wed May 13 03:59:58 IDT 2026

```text

```

### Update: Wed May 13 04:00:58 IDT 2026

```text

```

### Update: Wed May 13 04:01:59 IDT 2026

```text

```

### Update: Wed May 13 04:02:59 IDT 2026

```text

```

### Update: Wed May 13 04:03:59 IDT 2026

```text

```

### Update: Wed May 13 04:04:59 IDT 2026

```text

```

### Update: Wed May 13 04:05:59 IDT 2026

```text

```

### Update: Wed May 13 04:07:00 IDT 2026

```text

```

### Update: Wed May 13 04:08:00 IDT 2026

```text

```

### Update: Wed May 13 04:09:00 IDT 2026

```text

```

### Update: Wed May 13 04:10:00 IDT 2026

```text

```

### Update: Wed May 13 04:11:00 IDT 2026

```text

```

### Update: Wed May 13 04:12:01 IDT 2026

```text

```

### Update: Wed May 13 04:13:01 IDT 2026

```text

```

### Update: Wed May 13 04:14:01 IDT 2026

```text

```

### Update: Wed May 13 04:15:01 IDT 2026

```text

```

### Update: Wed May 13 04:16:01 IDT 2026

```text

```

### Update: Wed May 13 04:17:01 IDT 2026

```text

```

### Update: Wed May 13 04:18:02 IDT 2026

```text

```

### Update: Wed May 13 04:19:02 IDT 2026

```text

```

### Update: Wed May 13 04:20:02 IDT 2026

```text

```

### Update: Wed May 13 04:21:02 IDT 2026

```text

```

### Update: Wed May 13 04:22:02 IDT 2026

```text

```

### Update: Wed May 13 04:23:03 IDT 2026

```text

```

### Update: Wed May 13 04:24:03 IDT 2026

```text

```

### Update: Wed May 13 04:25:03 IDT 2026

```text

```

### Update: Wed May 13 04:26:03 IDT 2026

```text

```

### Update: Wed May 13 04:27:03 IDT 2026

```text

```

### Update: Wed May 13 04:28:04 IDT 2026

```text

```

### Update: Wed May 13 04:29:04 IDT 2026

```text

```

### Update: Wed May 13 04:30:04 IDT 2026

```text

```

### Update: Wed May 13 04:31:04 IDT 2026

```text

```

### Update: Wed May 13 04:32:04 IDT 2026

```text

```

### Update: Wed May 13 04:33:04 IDT 2026

```text

```

### Update: Wed May 13 04:34:05 IDT 2026

```text

```

### Update: Wed May 13 04:35:05 IDT 2026

```text

```

### Update: Wed May 13 04:36:05 IDT 2026

```text

```

### Update: Wed May 13 04:37:05 IDT 2026

```text

```

### Update: Wed May 13 04:38:05 IDT 2026

```text

```

### Update: Wed May 13 04:39:06 IDT 2026

```text

```

### Update: Wed May 13 04:40:06 IDT 2026

```text

```

### Update: Wed May 13 04:41:06 IDT 2026

```text

```

### Update: Wed May 13 04:42:06 IDT 2026

```text

```

### Update: Wed May 13 04:43:06 IDT 2026

```text

```

### Update: Wed May 13 04:44:07 IDT 2026

```text

```

### Update: Wed May 13 04:45:07 IDT 2026

```text

```

### Update: Wed May 13 04:46:07 IDT 2026

```text

```

### Update: Wed May 13 04:47:07 IDT 2026

```text

```

### Update: Wed May 13 04:48:07 IDT 2026

```text

```

### Update: Wed May 13 04:49:07 IDT 2026

```text

```

### Update: Wed May 13 04:50:08 IDT 2026

```text

```

### Update: Wed May 13 04:51:08 IDT 2026

```text

```

### Update: Wed May 13 04:52:08 IDT 2026

```text

```

### Update: Wed May 13 04:53:08 IDT 2026

```text

```

### Update: Wed May 13 04:54:08 IDT 2026

```text

```

### Update: Wed May 13 04:55:08 IDT 2026

```text

```

### Update: Wed May 13 04:56:09 IDT 2026

```text

```

### Update: Wed May 13 04:57:09 IDT 2026

```text

```

### Update: Wed May 13 04:58:09 IDT 2026

```text

```

### Update: Wed May 13 04:59:09 IDT 2026

```text

```

### Update: Wed May 13 05:00:09 IDT 2026

```text

```

### Update: Wed May 13 05:01:10 IDT 2026

```text

```

### Update: Wed May 13 05:02:10 IDT 2026

```text

```

### Update: Wed May 13 05:03:10 IDT 2026

```text

```

### Update: Wed May 13 05:04:10 IDT 2026

```text

```

### Update: Wed May 13 05:05:10 IDT 2026

```text

```

### Update: Wed May 13 05:06:10 IDT 2026

```text

```

### Update: Wed May 13 05:07:11 IDT 2026

```text

```

### Update: Wed May 13 05:08:11 IDT 2026

```text

```

### Update: Wed May 13 05:09:11 IDT 2026

```text

```

### Update: Wed May 13 05:10:11 IDT 2026

```text

```

### Update: Wed May 13 05:11:11 IDT 2026

```text

```

### Update: Wed May 13 05:12:12 IDT 2026

```text

```

### Update: Wed May 13 05:13:12 IDT 2026

```text

```

### Update: Wed May 13 05:14:12 IDT 2026

```text

```

### Update: Wed May 13 05:15:12 IDT 2026

```text

```

### Update: Wed May 13 05:16:12 IDT 2026

```text

```

### Update: Wed May 13 05:17:12 IDT 2026

```text

```

### Update: Wed May 13 05:18:13 IDT 2026

```text

```

### Update: Wed May 13 05:19:13 IDT 2026

```text

```

### Update: Wed May 13 05:20:13 IDT 2026

```text

```

### Update: Wed May 13 05:21:13 IDT 2026

```text

```

### Update: Wed May 13 05:22:13 IDT 2026

```text

```

### Update: Wed May 13 05:23:14 IDT 2026

```text

```

### Update: Wed May 13 05:24:14 IDT 2026

```text

```

### Update: Wed May 13 05:25:14 IDT 2026

```text

```

### Update: Wed May 13 05:26:14 IDT 2026

```text

```

### Update: Wed May 13 05:27:14 IDT 2026

```text

```

### Update: Wed May 13 05:28:14 IDT 2026

```text

```

### Update: Wed May 13 05:29:15 IDT 2026

```text

```

### Update: Wed May 13 05:30:15 IDT 2026

```text

```

### Update: Wed May 13 05:31:15 IDT 2026

```text

```

### Update: Wed May 13 05:32:15 IDT 2026

```text

```

### Update: Wed May 13 05:33:15 IDT 2026

```text

```

### Update: Wed May 13 05:34:15 IDT 2026

```text

```

### Update: Wed May 13 05:35:16 IDT 2026

```text

```

### Update: Wed May 13 05:36:16 IDT 2026

```text

```

### Update: Wed May 13 05:37:16 IDT 2026

```text

```

### Update: Wed May 13 05:38:16 IDT 2026

```text

```

### Update: Wed May 13 05:39:16 IDT 2026

```text

```

### Update: Wed May 13 05:40:17 IDT 2026

```text

```

### Update: Wed May 13 05:41:17 IDT 2026

```text

```

### Update: Wed May 13 05:42:17 IDT 2026

```text

```

### Update: Wed May 13 05:43:17 IDT 2026

```text

```

### Update: Wed May 13 05:44:17 IDT 2026

```text

```

### Update: Wed May 13 05:45:18 IDT 2026

```text

```

### Update: Wed May 13 05:46:18 IDT 2026

```text

```

### Update: Wed May 13 05:47:18 IDT 2026

```text

```

### Update: Wed May 13 05:48:18 IDT 2026

```text

```

### Update: Wed May 13 05:49:18 IDT 2026

```text

```

### Update: Wed May 13 05:50:18 IDT 2026

```text

```

### Update: Wed May 13 05:51:19 IDT 2026

```text

```

### Update: Wed May 13 05:52:19 IDT 2026

```text

```

### Update: Wed May 13 05:53:19 IDT 2026

```text

```

### Update: Wed May 13 05:54:19 IDT 2026

```text

```

### Update: Wed May 13 05:55:19 IDT 2026

```text

```

### Update: Wed May 13 05:56:19 IDT 2026

```text

```

### Update: Wed May 13 05:57:20 IDT 2026

```text

```

### Update: Wed May 13 05:58:20 IDT 2026

```text

```

### Update: Wed May 13 05:59:20 IDT 2026

```text

```

### Update: Wed May 13 06:00:20 IDT 2026

```text

```

### Update: Wed May 13 06:01:20 IDT 2026

```text

```

### Update: Wed May 13 06:02:21 IDT 2026

```text

```

### Update: Wed May 13 06:03:21 IDT 2026

```text

```

### Update: Wed May 13 06:04:21 IDT 2026

```text

```

### Update: Wed May 13 06:05:21 IDT 2026

```text

```

### Update: Wed May 13 06:06:21 IDT 2026

```text

```

### Update: Wed May 13 06:07:21 IDT 2026

```text

```

### Update: Wed May 13 06:08:22 IDT 2026

```text

```

### Update: Wed May 13 06:09:22 IDT 2026

```text

```

### Update: Wed May 13 06:10:22 IDT 2026

```text

```

### Update: Wed May 13 06:11:22 IDT 2026

```text

```

### Update: Wed May 13 06:12:22 IDT 2026

```text

```

### Update: Wed May 13 06:13:23 IDT 2026

```text

```

### Update: Wed May 13 06:14:23 IDT 2026

```text

```

### Update: Wed May 13 06:15:23 IDT 2026

```text

```

### Update: Wed May 13 06:16:23 IDT 2026

```text

```

### Update: Wed May 13 06:17:23 IDT 2026

```text

```

### Update: Wed May 13 06:18:23 IDT 2026

```text

```

### Update: Wed May 13 06:19:24 IDT 2026

```text

```

### Update: Wed May 13 06:20:24 IDT 2026

```text

```

### Update: Wed May 13 06:21:24 IDT 2026

```text

```

### Update: Wed May 13 06:22:24 IDT 2026

```text

```

### Update: Wed May 13 06:23:24 IDT 2026

```text

```

### Update: Wed May 13 06:24:25 IDT 2026

```text

```

### Update: Wed May 13 06:25:25 IDT 2026

```text

```

### Update: Wed May 13 06:26:25 IDT 2026

```text

```

### Update: Wed May 13 06:27:25 IDT 2026

```text

```

### Update: Wed May 13 06:28:25 IDT 2026

```text

```

### Update: Wed May 13 06:29:25 IDT 2026

```text

```

### Update: Wed May 13 06:30:26 IDT 2026

```text

```

### Update: Wed May 13 06:31:26 IDT 2026

```text

```

### Update: Wed May 13 06:32:26 IDT 2026

```text

```

### Update: Wed May 13 06:33:26 IDT 2026

```text

```

### Update: Wed May 13 06:34:26 IDT 2026

```text

```

### Update: Wed May 13 06:35:26 IDT 2026

```text

```

### Update: Wed May 13 06:36:27 IDT 2026

```text

```

### Update: Wed May 13 06:37:27 IDT 2026

```text

```

### Update: Wed May 13 06:38:27 IDT 2026

```text

```

### Update: Wed May 13 06:39:27 IDT 2026

```text

```

### Update: Wed May 13 06:40:27 IDT 2026

```text

```

### Update: Wed May 13 06:41:27 IDT 2026

```text

```

### Update: Wed May 13 06:42:28 IDT 2026

```text

```

### Update: Wed May 13 06:43:28 IDT 2026

```text

```

### Update: Wed May 13 06:44:28 IDT 2026

```text

```

### Update: Wed May 13 06:45:28 IDT 2026

```text

```

### Update: Wed May 13 06:46:28 IDT 2026

```text

```

### Update: Wed May 13 06:47:29 IDT 2026

```text

```

### Update: Wed May 13 06:48:29 IDT 2026

```text

```

### Update: Wed May 13 06:49:29 IDT 2026

```text

```

### Update: Wed May 13 06:50:29 IDT 2026

```text

```

### Update: Wed May 13 06:51:29 IDT 2026

```text

```

### Update: Wed May 13 06:52:29 IDT 2026

```text

```

### Update: Wed May 13 06:53:30 IDT 2026

```text

```

### Update: Wed May 13 06:54:30 IDT 2026

```text

```

### Update: Wed May 13 06:55:30 IDT 2026

```text

```

### Update: Wed May 13 06:56:30 IDT 2026

```text

```

### Update: Wed May 13 06:57:30 IDT 2026

```text

```

### Update: Wed May 13 06:58:31 IDT 2026

```text

```

### Update: Wed May 13 06:59:31 IDT 2026

```text

```

### Update: Wed May 13 07:00:31 IDT 2026

```text

```

### Update: Wed May 13 07:01:31 IDT 2026

```text

```

### Update: Wed May 13 07:02:31 IDT 2026

```text

```

### Update: Wed May 13 07:03:31 IDT 2026

```text

```

### Update: Wed May 13 07:04:32 IDT 2026

```text

```

### Update: Wed May 13 07:05:32 IDT 2026

```text

```

### Update: Wed May 13 07:06:32 IDT 2026

```text

```

### Update: Wed May 13 07:07:32 IDT 2026

```text

```

### Update: Wed May 13 07:08:32 IDT 2026

```text

```

### Update: Wed May 13 07:09:33 IDT 2026

```text

```

### Update: Wed May 13 07:10:33 IDT 2026

```text

```

### Update: Wed May 13 07:11:33 IDT 2026

```text

```

### Update: Wed May 13 07:12:33 IDT 2026

```text

```

### Update: Wed May 13 07:13:33 IDT 2026

```text

```

### Update: Wed May 13 07:14:33 IDT 2026

```text

```

### Update: Wed May 13 07:15:34 IDT 2026

```text

```

### Update: Wed May 13 07:16:34 IDT 2026

```text

```

### Update: Wed May 13 07:17:34 IDT 2026

```text

```

### Update: Wed May 13 07:18:34 IDT 2026

```text

```

### Update: Wed May 13 07:19:34 IDT 2026

```text

```

### Update: Wed May 13 07:20:35 IDT 2026

```text

```

### Update: Wed May 13 07:21:35 IDT 2026

```text

```

### Update: Wed May 13 07:22:35 IDT 2026

```text

```

### Update: Wed May 13 07:23:35 IDT 2026

```text

```

### Update: Wed May 13 07:24:35 IDT 2026

```text

```

### Update: Wed May 13 07:25:35 IDT 2026

```text

```

### Update: Wed May 13 07:26:36 IDT 2026

```text

```

### Update: Wed May 13 07:27:36 IDT 2026

```text

```

### Update: Wed May 13 07:28:36 IDT 2026

```text

```

### Update: Wed May 13 07:29:36 IDT 2026

```text

```

### Update: Wed May 13 07:30:36 IDT 2026

```text

```

### Update: Wed May 13 07:31:37 IDT 2026

```text

```

### Update: Wed May 13 07:32:37 IDT 2026

```text

```

### Update: Wed May 13 07:33:37 IDT 2026

```text

```

### Update: Wed May 13 07:34:37 IDT 2026

```text

```

### Update: Wed May 13 07:35:37 IDT 2026

```text

```

### Update: Wed May 13 07:36:37 IDT 2026

```text

```

### Update: Wed May 13 07:37:38 IDT 2026

```text

```

### Update: Wed May 13 07:38:38 IDT 2026

```text

```

### Update: Wed May 13 07:39:38 IDT 2026

```text

```

### Update: Wed May 13 07:40:38 IDT 2026

```text

```

### Update: Wed May 13 07:41:38 IDT 2026

```text

```

### Update: Wed May 13 07:42:39 IDT 2026

```text

```

### Update: Wed May 13 07:43:39 IDT 2026

```text

```

### Update: Wed May 13 07:44:39 IDT 2026

```text

```

### Update: Wed May 13 07:45:39 IDT 2026

```text

```

### Update: Wed May 13 07:46:39 IDT 2026

```text

```

### Update: Wed May 13 07:47:39 IDT 2026

```text

```

### Update: Wed May 13 07:48:40 IDT 2026

```text

```

### Update: Wed May 13 07:49:40 IDT 2026

```text

```

### Update: Wed May 13 07:50:40 IDT 2026

```text

```

### Update: Wed May 13 07:51:40 IDT 2026

```text

```

### Update: Wed May 13 07:52:40 IDT 2026

```text

```

### Update: Wed May 13 07:53:40 IDT 2026

```text

```

### Update: Wed May 13 07:54:41 IDT 2026

```text

```

### Update: Wed May 13 07:55:41 IDT 2026

```text

```

### Update: Wed May 13 07:56:41 IDT 2026

```text

```

### Update: Wed May 13 07:57:41 IDT 2026

```text

```

### Update: Wed May 13 07:58:41 IDT 2026

```text

```

### Update: Wed May 13 07:59:42 IDT 2026

```text

```

### Update: Wed May 13 08:00:42 IDT 2026

```text

```

### Update: Wed May 13 08:01:42 IDT 2026

```text

```

### Update: Wed May 13 08:02:42 IDT 2026

```text

```

### Update: Wed May 13 08:03:42 IDT 2026

```text

```

### Update: Wed May 13 08:04:42 IDT 2026

```text

```

### Update: Wed May 13 08:05:43 IDT 2026

```text

```

### Update: Wed May 13 08:06:43 IDT 2026

```text

```

### Update: Wed May 13 08:07:43 IDT 2026

```text

```

### Update: Wed May 13 08:08:43 IDT 2026

```text

```

### Update: Wed May 13 08:09:43 IDT 2026

```text

```

### Update: Wed May 13 08:10:43 IDT 2026

```text

```

### Update: Wed May 13 08:11:44 IDT 2026

```text

```

### Update: Wed May 13 08:12:44 IDT 2026

```text

```

### Update: Wed May 13 08:13:44 IDT 2026

```text

```

### Update: Wed May 13 08:14:44 IDT 2026

```text

```

### Update: Wed May 13 08:15:44 IDT 2026

```text

```

### Update: Wed May 13 08:16:45 IDT 2026

```text

```

### Update: Wed May 13 08:17:45 IDT 2026

```text

```

### Update: Wed May 13 08:18:45 IDT 2026

```text

```

### Update: Wed May 13 08:19:45 IDT 2026

```text

```

### Update: Wed May 13 08:20:45 IDT 2026

```text

```

### Update: Wed May 13 08:21:45 IDT 2026

```text

```

### Update: Wed May 13 08:22:46 IDT 2026

```text

```

### Update: Wed May 13 08:23:46 IDT 2026

```text

```

### Update: Wed May 13 08:24:46 IDT 2026

```text

```

### Update: Wed May 13 08:25:46 IDT 2026

```text

```

### Update: Wed May 13 08:26:46 IDT 2026

```text

```

### Update: Wed May 13 08:27:47 IDT 2026

```text

```

### Update: Wed May 13 08:28:47 IDT 2026

```text

```

### Update: Wed May 13 08:29:47 IDT 2026

```text

```

### Update: Wed May 13 08:30:47 IDT 2026

```text

```

### Update: Wed May 13 08:31:47 IDT 2026

```text

```

### Update: Wed May 13 08:32:47 IDT 2026

```text

```

### Update: Wed May 13 08:33:48 IDT 2026

```text

```

### Update: Wed May 13 08:34:48 IDT 2026

```text

```

### Update: Wed May 13 08:35:48 IDT 2026

```text

```

### Update: Wed May 13 08:36:48 IDT 2026

```text

```

### Update: Wed May 13 08:37:48 IDT 2026

```text

```

### Update: Wed May 13 08:38:48 IDT 2026

```text

```

### Update: Wed May 13 08:39:49 IDT 2026

```text

```

### Update: Wed May 13 08:40:49 IDT 2026

```text

```

### Update: Wed May 13 08:41:49 IDT 2026

```text

```

### Update: Wed May 13 08:42:49 IDT 2026

```text

```

### Update: Wed May 13 08:43:49 IDT 2026

```text

```

### Update: Wed May 13 08:44:50 IDT 2026

```text

```

### Update: Wed May 13 08:45:50 IDT 2026

```text

```

### Update: Wed May 13 08:46:50 IDT 2026

```text

```

### Update: Wed May 13 08:47:50 IDT 2026

```text

```

### Update: Wed May 13 08:48:50 IDT 2026

```text

```

### Update: Wed May 13 08:49:50 IDT 2026

```text

```

### Update: Wed May 13 08:50:51 IDT 2026

```text

```

### Update: Wed May 13 08:51:51 IDT 2026

```text

```

### Update: Wed May 13 08:52:51 IDT 2026

```text

```

### Update: Wed May 13 08:53:51 IDT 2026

```text

```

### Update: Wed May 13 08:54:51 IDT 2026

```text

```

### Update: Wed May 13 08:55:52 IDT 2026

```text

```

### Update: Wed May 13 08:56:52 IDT 2026

```text

```

### Update: Wed May 13 08:57:52 IDT 2026

```text

```

### Update: Wed May 13 08:58:52 IDT 2026

```text

```

### Update: Wed May 13 08:59:52 IDT 2026

```text

```

### Update: Wed May 13 09:00:52 IDT 2026

```text

```

### Update: Wed May 13 09:01:53 IDT 2026

```text

```

### Update: Wed May 13 09:02:53 IDT 2026

```text
market-maker-1  | 06:02:12.028 [execution-gate] INFO: '[ExecutionGate] Evaluating 1 recommendations for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:02:12.036 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652132028_14 (pending_close) for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:02:13.172 [lifecycle] INFO: '[Execution Monitor] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f state updated to REBALANCING'
market-maker-1  | 06:02:13.175 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'close' on position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f"
market-maker-1  | 06:02:13.175 [solana-executor] INFO: '[SolanaExecutor] Creating CLOSE transaction for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:02:13.738 [solana-executor] INFO: '[SolanaExecutor] Found position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f on-chain in bin range [-5895, -5891]. Building removal transactions...'
market-maker-1  | 06:02:13.738 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building RemoveLiquidity Txs for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f (Bins: -5895 to -5891)'
market-maker-1  | 06:02:14.134 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building ClosePosition Tx for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f in pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6'
market-maker-1  | 06:02:15.201 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/15 for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f (Action: close). Elapsed: 0ms.'
market-maker-1  | 06:02:17.687 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/15 for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f (Action: close). Elapsed: 2486ms.'
market-maker-1  | 06:02:19.924 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #3/15 for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f (Action: close). Elapsed: 4723ms.'
market-maker-1  | 06:02:22.160 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #4/15 for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f (Action: close). Elapsed: 6959ms.'
market-maker-1  | 06:02:24.453 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #5/15 for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f (Action: close). Elapsed: 9252ms.'
market-maker-1  | 06:02:26.773 [lifecycle] ERROR: '[Execution Monitor] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f state updated to FAILED and archived due to close failure.'
```

### Update: Wed May 13 09:03:53 IDT 2026

```text
market-maker-1  | 06:03:01.442 [lifecycle] INFO: '[Discovery] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f is not on-chain but has an active rebalance task. Retaining orchestrator and setting state to REBALANCING.'
market-maker-1  | 06:03:01.442 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:03:01.442 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:03:01.461 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652132028_14 (pending_close) for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:03:02.537 [lifecycle] INFO: '[Execution Monitor] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f state updated to REBALANCING'
market-maker-1  | 06:03:02.539 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'close' on position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f"
market-maker-1  | 06:03:02.539 [solana-executor] INFO: '[SolanaExecutor] Creating CLOSE transaction for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:03:03.147 [solana-executor] ERROR: '[SolanaExecutor] Execution sequence failed: Cannot close position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f: not found on-chain for wallet HU5Hqv8VnSQV4EC4yPw2riS2KjDTwFYTsbUyD3XTYUQh'
market-maker-1  | 06:03:03.147 [lifecycle] WARN: '[Execution Monitor] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f was not found on-chain (already closed). Proceeding with rebalance flow.'
market-maker-1  | 06:03:05.570 [lifecycle] INFO: '[Tick Loop] Evaluating position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f on chain [solana]'
market-maker-1  | 06:03:05.570 [lifecycle] INFO: '[Tick Loop] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Lineage updated: Added 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh

### Update: Wed May 13 09:04:53 IDT 2026

```text
market-maker-1  | 06:03:05.570 [lifecycle] INFO: '[Tick Loop] Evaluating position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f on chain [solana]'
market-maker-1  | 06:03:05.570 [lifecycle] INFO: '[Tick Loop] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:04:01.453 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652132028_14 (awaiting_settlement) for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:04:02.602 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:04:02.602 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:04:02.603 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:04:02.603 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f]'
market-maker-1  | 06:04:02.603 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:04:02.604 [initialization-check-step] INFO: '[InitializationCheckStep] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f is initialized and active.'
market-maker-1  | 06:04:02.604 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f]'
market-maker-1  | 06:04:02.604 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f lowerBound=-5884 upperBound=-5880 midPrice=95.1473 geometricAverage=95.1473 effectiveBreakEven=95.1473'
market-maker-1  | 06:04:02.604 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f │\n│ Range Bounds:     Bin -5884  to Bin -5880            │\n│ Lower Price:      95.0712    USDC/SOL                 │\n│ Upper Price:      95.2234    USDC/SOL                 │\n│ Mid Price:        95.1473    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.1473    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.1473    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.1473    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:04:02.604 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f]'
market-maker-1  | 06:04:02.604 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f. Active bound: -5881'
market-maker-1  | 06:04:02.605 [lifecycle] INFO: "[Execution Monitor] Strategy re-evaluation recommended 'skip', indicating target range is valid for position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f. Proceeding with open leg."
market-maker-1  | 06:04:03.346 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f"
market-maker-1  | 06:04:03.348 [solana-executor] INFO: '[SolanaExecutor] Generated new position keypair: 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:04:03.569 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building AddLiquidity Tx: Pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6, Bins [-5884, -5880], PositionPubKey: 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:04:04.296 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/5 for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh (Action: open). Elapsed: 0ms.'
market-maker-1  | 06:04:06.525 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/5 for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh (Action: open). Elapsed: 2229ms.'
market-maker-1  | 06:04:06.695 [lifecycle] INFO: '[Execution Monitor] Updating assignment asg_exp_test position ID from 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f to 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:04:06.697 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:04:06.697 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:04:06.697 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:04:07.751 [lifecycle] WARN: '[Execution Monitor] Position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh not yet indexed by API. Deferring cache update to discovery.'
market-maker-1  | 06:04:09.377 [lifecycle] INFO: '[Tick Loop] Evaluating position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f on chain [solana]'
market-maker-1  | 06:04:09.377 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f'
market-maker-1  | 06:04:09.395 [lifecycle] WARN: '[Tick Loop] Position 3Yx4K4VQ6h8TUovfJJW2PfazDjb9kKF48DJ9VYFWRh8f was not found on-chain. Marking as CLOSED and archiving.'
```

### Lineage updated: Added 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1

### Update: Wed May 13 09:05:53 IDT 2026

```text
market-maker-1  | 06:05:43.107 [lifecycle] INFO: '[Discovery] Position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh is not on-chain but has an active rebalance task. Retaining orchestrator and setting state to REBALANCING.'
market-maker-1  | 06:05:43.108 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:43.108 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:43.135 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652327260_907 (awaiting_settlement) for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:44.327 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:44.328 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:05:44.328 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:44.328 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh]'
market-maker-1  | 06:05:44.329 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:44.329 [initialization-check-step] INFO: '[InitializationCheckStep] Position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh is initialized and active.'
market-maker-1  | 06:05:44.329 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh]'
market-maker-1  | 06:05:44.330 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh lowerBound=-5882 upperBound=-5878 midPrice=95.2234 geometricAverage=95.2234 effectiveBreakEven=95.2234'
market-maker-1  | 06:05:44.330 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh │\n│ Range Bounds:     Bin -5882  to Bin -5878            │\n│ Lower Price:      95.1473    USDC/SOL                 │\n│ Upper Price:      95.2996    USDC/SOL                 │\n│ Mid Price:        95.2234    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2234    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2234    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2234    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:05:44.330 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh]'
market-maker-1  | 06:05:44.330 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh. Active bound: -5878'
market-maker-1  | 06:05:44.331 [lifecycle] INFO: "[Execution Monitor] Strategy re-evaluation recommended 'skip', indicating target range is valid for position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh. Proceeding with open leg."
market-maker-1  | 06:05:45.104 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh"
market-maker-1  | 06:05:45.106 [solana-executor] INFO: '[SolanaExecutor] Generated new position keypair: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:45.390 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building AddLiquidity Tx: Pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6, Bins [-5882, -5878], PositionPubKey: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:46.233 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/5 for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 (Action: open). Elapsed: 0ms.'
market-maker-1  | 06:05:48.557 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/5 for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 (Action: open). Elapsed: 2324ms.'
market-maker-1  | 06:05:48.723 [lifecycle] INFO: '[Execution Monitor] Updating assignment asg_exp_test position ID from 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh to 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:48.725 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:48.725 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:48.725 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:49.504 [lifecycle] WARN: '[Execution Monitor] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 not yet indexed by API. Synthesizing temporary position to prevent blind rebalances.'
market-maker-1  | 06:05:49.508 [lifecycle] INFO: '[Execution Monitor] Rebalanced old position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh archived as CLOSED.'
market-maker-1  | 06:05:49.509 [lifecycle] INFO: '[Execution Monitor] Successfully cached new position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 and pruned old position 2zTVqwnrJTALMtVvLt6u3ErFHzSXSAafZK2q2YSNuVMh'
market-maker-1  | 06:05:51.108 [lifecycle] INFO: '[Tick Loop] Evaluating position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 on chain [solana]'
market-maker-1  | 06:05:51.108 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:51.129 [lifecycle] WARN: '[Tick Loop] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 was not found on-chain. Marking as CLOSED and archiving.'
market-maker-1  | 06:05:51.132 [orchestrator-registry] INFO: '[OrchestratorRegistry] Deregistering orchestrator orch_asg_exp_test from position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
```

### Update: Wed May 13 09:06:54 IDT 2026

```text
market-maker-1  | 06:05:51.108 [lifecycle] INFO: '[Tick Loop] Evaluating position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 on chain [solana]'
market-maker-1  | 06:05:51.108 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:05:51.129 [lifecycle] WARN: '[Tick Loop] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 was not found on-chain. Marking as CLOSED and archiving.'
market-maker-1  | 06:05:51.132 [orchestrator-registry] INFO: '[OrchestratorRegistry] Deregistering orchestrator orch_asg_exp_test from position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:32.524 [lifecycle] INFO: '[Discovery] Discovered new live position: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:32.525 [lifecycle] INFO: '[Discovery] Registering orchestrator on startup for assignment asg_exp_test (strategy: experimental-restake) targeting position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:32.525 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:32.525 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:32.563 [lifecycle] INFO: '[Tick Loop] Evaluating position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 on chain [solana]'
market-maker-1  | 06:06:32.563 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:33.109 [lifecycle] INFO: '[Tick Loop] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 details: Pool Price: 95.29957905728314 | Bounds: [-5882, -5878] | In-Range: true'
market-maker-1  | 06:06:33.109 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:06:33.109 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:33.109 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1]'
market-maker-1  | 06:06:33.109 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:06:33.109 [initialization-check-step] INFO: '[InitializationCheckStep] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 is initialized and active.'
market-maker-1  | 06:06:33.109 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1]'
market-maker-1  | 06:06:33.110 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 lowerBound=-5882 upperBound=-5878 midPrice=95.2234 geometricAverage=95.2234 effectiveBreakEven=N/A'
market-maker-1  | 06:06:33.110 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 │\n│ Range Bounds:     Bin -5882  to Bin -5878            │\n│ Lower Price:      95.1473    USDC/SOL                 │\n│ Upper Price:      95.2996    USDC/SOL                 │\n│ Mid Price:        95.2234    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2234    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2234    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: N/A        USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:06:33.110 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1]'
market-maker-1  | 06:06:33.110 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1. Active bound: -5878'
market-maker-1  | 06:06:33.111 [lifecycle] INFO: '[Tick Loop] No execution required for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
```

### Update: Wed May 13 09:07:54 IDT 2026

```text
market-maker-1  | 06:07:50.549 [lifecycle] INFO: '[Discovery] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 is not on-chain but has an active rebalance task. Retaining orchestrator and setting state to REBALANCING.'
market-maker-1  | 06:07:50.549 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:07:50.549 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_exp_test for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:07:50.568 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652454214_359 (awaiting_settlement) for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:07:51.665 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:07:51.666 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:07:51.666 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:07:51.666 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1]'
market-maker-1  | 06:07:51.667 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1'
market-maker-1  | 06:07:51.667 [initialization-check-step] INFO: '[InitializationCheckStep] Position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 is initialized and active.'
market-maker-1  | 06:07:51.667 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1]'
market-maker-1  | 06:07:51.667 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 lowerBound=-5881 upperBound=-5877 midPrice=95.2615 geometricAverage=95.2615 effectiveBreakEven=95.2615'
market-maker-1  | 06:07:51.667 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1 │\n│ Range Bounds:     Bin -5881  to Bin -5877            │\n│ Lower Price:      95.1853    USDC/SOL                 │\n│ Upper Price:      95.3377    USDC/SOL                 │\n│ Mid Price:        95.2615    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2615    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2615    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2615    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:07:51.667 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1]'
market-maker-1  | 06:07:51.667 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1. Active bound: -5877'
market-maker-1  | 06:07:51.668 [lifecycle] INFO: "[Execution Monitor] Strategy re-evaluation recommended 'skip', indicating target range is valid for position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1. Proceeding with open leg."
market-maker-1  | 06:07:52.369 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position 62vV3DqPMiydsnAbHUxadmibQExgGTGGEwSH2j2wVhV1"
```

### Lineage updated: Added FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh

### Update: Wed May 13 09:08:54 IDT 2026

```text
market-maker-1  | 06:08:20.759 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:08:20.759 [meteora-api-provider] INFO: '[MeteoraApiProvider] Fetching position details for FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:08:21.222 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh details: Pool Price: 95.37583396846156 | Bounds: [-5881, -5877] | In-Range: false'
market-maker-1  | 06:08:21.222 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:08:21.222 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:08:21.223 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:08:21.223 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:08:21.223 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:08:21.224 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:08:21.224 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5881 upperBound=-5877 midPrice=95.2615 geometricAverage=95.2615 effectiveBreakEven=N/A'
market-maker-1  | 06:08:21.224 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5881  to Bin -5877            │\n│ Lower Price:      95.1853    USDC/SOL                 │\n│ Upper Price:      95.3377    USDC/SOL                 │\n│ Mid Price:        95.2615    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2615    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2615    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: N/A        USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:08:21.224 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:08:21.225 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5876'
market-maker-1  | 06:08:21.229 [execution-gate] INFO: '[ExecutionGate] Evaluating 1 recommendations for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:08:21.235 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (pending_close) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:08:22.376 [lifecycle] INFO: '[Execution Monitor] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh state updated to REBALANCING'
market-maker-1  | 06:08:22.378 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'close' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 06:08:22.378 [solana-executor] INFO: '[SolanaExecutor] Creating CLOSE transaction for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:08:22.915 [solana-executor] INFO: '[SolanaExecutor] Found position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on-chain in bin range [-5881, -5877]. Building removal transactions...'
market-maker-1  | 06:08:22.915 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building RemoveLiquidity Txs for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Bins: -5881 to -5877)'
market-maker-1  | 06:08:23.437 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 0ms.'
market-maker-1  | 06:08:25.813 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 2376ms.'
market-maker-1  | 06:08:25.978 [solana-executor] INFO: '[SolanaExecutor] Building reclaim/close transaction for empty position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh...'
market-maker-1  | 06:08:25.979 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building ClosePosition Tx for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh in pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6'
market-maker-1  | 06:08:26.585 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 0ms.'
market-maker-1  | 06:08:28.822 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 2236ms.'
```

### Update: Wed May 13 09:12:35 IDT 2026

```text
market-maker-1  | 06:08:22.915 [solana-executor] INFO: '[SolanaExecutor] Found position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on-chain in bin range [-5881, -5877]. Building removal transactions...'
market-maker-1  | 06:08:22.915 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building RemoveLiquidity Txs for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Bins: -5881 to -5877)'
market-maker-1  | 06:08:23.437 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 0ms.'
market-maker-1  | 06:08:25.813 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 2376ms.'
market-maker-1  | 06:08:25.978 [solana-executor] INFO: '[SolanaExecutor] Building reclaim/close transaction for empty position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh...'
market-maker-1  | 06:08:25.979 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building ClosePosition Tx for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh in pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6'
market-maker-1  | 06:08:26.585 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #1/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 0ms.'
market-maker-1  | 06:08:28.822 [solana-executor] INFO: '[SolanaExecutor] executeTx attempt #2/15 for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh (Action: close). Elapsed: 2236ms.'
market-maker-1  | 06:09:22.873 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:09:31.190 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:11:16.796 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:12:27.000 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:12:35.783 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:12:35.790 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Wed May 13 09:46:27 IDT 2026

```text
market-maker-1  | 06:09:22.873 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:09:31.190 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:11:16.796 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:12:27.000 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:12:35.783 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:12:35.790 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:13:24.218 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:14:11.075 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5880 upperBound=-5876 midPrice=95.2996 geometricAverage=95.2996 effectiveBreakEven=95.2996'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5880  to Bin -5876            │\n│ Lower Price:      95.2234    USDC/SOL                 │\n│ Upper Price:      95.3758    USDC/SOL                 │\n│ Mid Price:        95.2996    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2996    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2996    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2996    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5872'
market-maker-1  | 06:14:11.077 [lifecycle] INFO: '[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh.'
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
```

### Update: Wed May 13 10:28:25 IDT 2026

```text
market-maker-1  | 06:09:22.873 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:09:31.190 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:11:16.796 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:12:27.000 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:12:35.783 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:12:35.790 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:13:24.218 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:14:11.075 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5880 upperBound=-5876 midPrice=95.2996 geometricAverage=95.2996 effectiveBreakEven=95.2996'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5880  to Bin -5876            │\n│ Lower Price:      95.2234    USDC/SOL                 │\n│ Upper Price:      95.3758    USDC/SOL                 │\n│ Mid Price:        95.2996    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2996    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2996    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2996    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5872'
market-maker-1  | 06:14:11.077 [lifecycle] INFO: '[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh.'
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 07:12:01.140 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
```

### Update: Wed May 13 11:10:38 IDT 2026

```text
market-maker-1  | 06:09:22.873 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:09:31.190 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:11:16.796 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:12:27.000 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:12:35.783 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:12:35.790 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:13:24.218 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:14:11.075 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5880 upperBound=-5876 midPrice=95.2996 geometricAverage=95.2996 effectiveBreakEven=95.2996'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5880  to Bin -5876            │\n│ Lower Price:      95.2234    USDC/SOL                 │\n│ Upper Price:      95.3758    USDC/SOL                 │\n│ Mid Price:        95.2996    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2996    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2996    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2996    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5872'
market-maker-1  | 06:14:11.077 [lifecycle] INFO: '[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh.'
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 07:12:01.140 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 08:10:20.074 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
```

### Update: Wed May 13 12:11:40 IDT 2026

```text
market-maker-1  | 06:09:22.873 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:09:31.190 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:11:16.796 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:12:27.000 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:12:35.783 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:12:35.790 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:13:24.218 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:14:11.075 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5880 upperBound=-5876 midPrice=95.2996 geometricAverage=95.2996 effectiveBreakEven=95.2996'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5880  to Bin -5876            │\n│ Lower Price:      95.2234    USDC/SOL                 │\n│ Upper Price:      95.3758    USDC/SOL                 │\n│ Mid Price:        95.2996    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2996    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2996    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2996    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5872'
market-maker-1  | 06:14:11.077 [lifecycle] INFO: '[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh.'
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 07:12:01.140 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 08:10:20.074 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.475 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
```

### Update: Wed May 13 13:11:55 IDT 2026

```text
market-maker-1  | 06:12:35.783 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 06:12:35.790 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 06:13:24.218 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (awaiting_settlement) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_exp_test targeting position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.075 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_exp_test for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh [strategyId=experimental-restake]. Mode: active'
market-maker-1  | 06:14:11.075 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5880 upperBound=-5876 midPrice=95.2996 geometricAverage=95.2996 effectiveBreakEven=95.2996'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5880  to Bin -5876            │\n│ Lower Price:      95.2234    USDC/SOL                 │\n│ Upper Price:      95.3758    USDC/SOL                 │\n│ Mid Price:        95.2996    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2996    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2996    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2996    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5872'
market-maker-1  | 06:14:11.077 [lifecycle] INFO: '[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh.'
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 07:12:01.140 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 08:10:20.074 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.475 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.941 [lifecycle] ERROR: '[Execution Monitor] Rebalance failed during open leg. Cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh state updated to FAILED and archived.'
market-maker-1  | 09:11:38.944 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 09:11:38.944 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 09:38:52.932 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (pending_open) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 09:38:52.939 [lifecycle] WARN: '[Execution Monitor] Auto-Heal: Archived cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh as FAILED due to task timeout.'
```

### Update: Wed May 13 13:30:46 IDT 2026

```text
market-maker-1  | 06:14:11.076 [initialization-check-step] INFO: '[InitializationCheckStep] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is initialized and active.'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh lowerBound=-5880 upperBound=-5876 midPrice=95.2996 geometricAverage=95.2996 effectiveBreakEven=95.2996'
market-maker-1  | 06:14:11.076 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh │\n│ Range Bounds:     Bin -5880  to Bin -5876            │\n│ Lower Price:      95.2234    USDC/SOL                 │\n│ Upper Price:      95.3758    USDC/SOL                 │\n│ Mid Price:        95.2996    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 95.2996    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   95.2996    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 95.2996    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 06:14:11.076 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh]'
market-maker-1  | 06:14:11.076 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh. Active bound: -5872'
market-maker-1  | 06:14:11.077 [lifecycle] INFO: '[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh.'
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 07:12:01.140 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 08:10:20.074 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.475 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.941 [lifecycle] ERROR: '[Execution Monitor] Rebalance failed during open leg. Cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh state updated to FAILED and archived.'
market-maker-1  | 09:11:38.944 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 09:11:38.944 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 09:38:52.932 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (pending_open) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 09:38:52.939 [lifecycle] WARN: '[Execution Monitor] Auto-Heal: Archived cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh as FAILED due to task timeout.'
```

### Update: Wed May 13 14:12:56 IDT 2026

```text
market-maker-1  | 06:14:12.194 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh"
market-maker-1  | 07:12:01.140 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 08:10:20.074 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.475 [lifecycle] INFO: '[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop. (Active tasks in flight: task_1778652501230_601 [pending_open] for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh)'
market-maker-1  | 09:11:38.941 [lifecycle] ERROR: '[Execution Monitor] Rebalance failed during open leg. Cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh state updated to FAILED and archived.'
market-maker-1  | 09:11:38.944 [lifecycle] INFO: '[Tick Loop] Evaluating position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh on chain [solana]'
market-maker-1  | 09:11:38.944 [lifecycle] INFO: '[Tick Loop] Position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 09:38:52.932 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (pending_open) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 09:38:52.939 [lifecycle] WARN: '[Execution Monitor] Auto-Heal: Archived cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh as FAILED due to task timeout.'
```

### Update: Wed May 13 15:02:44 IDT 2026

```text
market-maker-1  | 09:38:52.932 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (pending_open) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 09:38:52.939 [lifecycle] WARN: '[Execution Monitor] Auto-Heal: Archived cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh as FAILED due to task timeout.'
```

### Update: Wed May 13 15:47:32 IDT 2026

```text
market-maker-1  | 09:38:52.932 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778652501230_601 (pending_open) for position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh'
market-maker-1  | 09:38:52.939 [lifecycle] WARN: '[Execution Monitor] Auto-Heal: Archived cached position FenYpwghFHta7Cc3bqtHq1RSWCgiaX7zUjgvDZqxu5yh as FAILED due to task timeout.'
```

### Update: Wed May 13 17:04:55 IDT 2026

```text

```

### Update: Wed May 13 17:48:38 IDT 2026

```text

```

### Update: Wed May 13 18:52:32 IDT 2026

```text

```

### Update: Wed May 13 19:33:03 IDT 2026

```text

```

### Update: Wed May 13 19:48:02 IDT 2026

```text

```

### Update: Wed May 13 19:49:02 IDT 2026

```text

```

### Update: Wed May 13 19:50:02 IDT 2026

```text

```

### Update: Wed May 13 19:51:02 IDT 2026

```text

```

### Update: Wed May 13 19:52:02 IDT 2026

```text

```

### Update: Wed May 13 19:53:03 IDT 2026

```text

```

### Update: Wed May 13 19:54:03 IDT 2026

```text

```

### Update: Wed May 13 19:55:03 IDT 2026

```text

```

### Update: Wed May 13 19:56:03 IDT 2026

```text

```

### Update: Wed May 13 19:57:03 IDT 2026

```text

```

### Update: Wed May 13 19:58:04 IDT 2026

```text

```

### Update: Wed May 13 19:59:04 IDT 2026

```text

```

### Update: Wed May 13 20:00:04 IDT 2026

```text

```

### Update: Wed May 13 20:01:04 IDT 2026

```text

```

### Update: Wed May 13 20:02:04 IDT 2026

```text

```

### Update: Wed May 13 20:03:04 IDT 2026

```text

```

### Update: Wed May 13 20:04:05 IDT 2026

```text

```

### Update: Wed May 13 20:05:05 IDT 2026

```text

```

### Update: Wed May 13 20:06:05 IDT 2026

```text

```

### Update: Wed May 13 20:07:05 IDT 2026

```text

```

### Update: Wed May 13 20:08:05 IDT 2026

```text

```

### Update: Wed May 13 20:09:05 IDT 2026

```text

```

### Update: Wed May 13 20:10:06 IDT 2026

```text

```

### Update: Wed May 13 20:11:06 IDT 2026

```text

```

### Update: Wed May 13 20:12:06 IDT 2026

```text

```

### Update: Wed May 13 20:13:06 IDT 2026

```text

```

### Update: Wed May 13 20:14:06 IDT 2026

```text

```

### Update: Wed May 13 20:15:07 IDT 2026

```text

```

### Update: Wed May 13 20:16:07 IDT 2026

```text

```

### Update: Wed May 13 20:17:07 IDT 2026

```text

```

### Update: Wed May 13 20:18:07 IDT 2026

```text

```

### Update: Wed May 13 20:19:07 IDT 2026

```text

```

### Update: Wed May 13 20:20:07 IDT 2026

```text

```

### Update: Wed May 13 20:21:08 IDT 2026

```text

```

### Update: Wed May 13 20:22:08 IDT 2026

```text

```

### Update: Wed May 13 20:23:08 IDT 2026

```text

```

### Update: Wed May 13 20:24:08 IDT 2026

```text

```

### Update: Wed May 13 20:25:08 IDT 2026

```text

```

### Update: Wed May 13 20:26:09 IDT 2026

```text

```

### Update: Wed May 13 20:27:09 IDT 2026

```text

```

### Update: Wed May 13 20:28:09 IDT 2026

```text

```

### Update: Wed May 13 20:29:09 IDT 2026

```text

```

### Update: Wed May 13 20:30:09 IDT 2026

```text

```

### Update: Wed May 13 20:31:09 IDT 2026

```text

```

### Update: Wed May 13 20:32:10 IDT 2026

```text

```

### Update: Wed May 13 20:33:10 IDT 2026

```text

```

### Update: Wed May 13 20:34:10 IDT 2026

```text

```

### Update: Wed May 13 20:35:10 IDT 2026

```text

```

### Update: Wed May 13 20:36:10 IDT 2026

```text

```

### Update: Wed May 13 20:37:10 IDT 2026

```text

```
