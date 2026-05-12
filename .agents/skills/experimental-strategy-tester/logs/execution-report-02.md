Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR
Initial 0.4 USDC

Use strategy packages/strategy/src/experimental-restake-strategy.ts

## Monitoring Started at Tue May 12 19:45:25 IDT 2026

### Update: Tue May 12 19:45:25 IDT 2026

```text
market-maker-1  | 16:45:06.399 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5917  to Bin -5916            │\n│ Lower Price:      93.8247    USDC/SOL                 │\n│ Upper Price:      93.8623    USDC/SOL                 │\n│ Mid Price:        93.8435    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.8435    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.8435    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: N/A        USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:45:06.399 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5911'
market-maker-1  | 16:45:06.399 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: close+open, Reason: Active bound -5911 shifted out of range [-5917, -5916]'
market-maker-1  | 16:45:06.399 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: close+open with params'
market-maker-1  | 16:45:06.400 [execution-gate] INFO: '[ExecutionGate] Evaluating 1 recommendations for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:45:06.403 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (pending_close) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:45:07.526 [lifecycle] INFO: '[Execution Monitor] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR state updated to REBALANCING'
market-maker-1  | 16:45:07.536 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'close' on position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR"
market-maker-1  | 16:45:07.537 [solana-executor] INFO: '[SolanaExecutor] Creating CLOSE transaction for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:45:08.124 [solana-executor] INFO: '[SolanaExecutor] Found position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on-chain in bin range [-5917, -5916]. Building removal transactions...'
market-maker-1  | 16:45:08.124 [meteora-onchain-provider] INFO: '[MeteoraOnChain] Building RemoveLiquidity Txs for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR (Bins: -5917 to -5916)'
```

### Update: Tue May 12 19:46:25 IDT 2026

```text
market-maker-1  | 16:46:05.811 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (awaiting_settlement) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:46:07.042 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Mode: active'
market-maker-1  | 16:46:07.042 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:46:07.042 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5911, position range: [-5915, -5911]'
market-maker-1  | 16:46:07.043 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:46:07.043 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5915  to Bin -5911            │\n│ Lower Price:      93.8998    USDC/SOL                 │\n│ Upper Price:      94.0501    USDC/SOL                 │\n│ Mid Price:        93.9750    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.9749    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.9749    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 93.9749    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:46:07.043 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5911'
market-maker-1  | 16:46:07.044 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: skip, Reason: Price is within position bounds'
market-maker-1  | 16:46:07.044 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: skip'
market-maker-1  | 16:46:07.048 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:46:07.048 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Tue May 12 19:47:25 IDT 2026

```text
market-maker-1  | 16:46:05.811 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (awaiting_settlement) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:46:07.042 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Mode: active'
market-maker-1  | 16:46:07.042 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:46:07.042 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5911, position range: [-5915, -5911]'
market-maker-1  | 16:46:07.043 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:46:07.043 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5915  to Bin -5911            │\n│ Lower Price:      93.8998    USDC/SOL                 │\n│ Upper Price:      94.0501    USDC/SOL                 │\n│ Mid Price:        93.9750    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.9749    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.9749    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 93.9749    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:46:07.043 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5911'
market-maker-1  | 16:46:07.044 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: skip, Reason: Price is within position bounds'
market-maker-1  | 16:46:07.044 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: skip'
market-maker-1  | 16:46:07.048 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:46:07.048 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 16:47:05.820 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (pending_open) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:47:06.596 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:47:06.596 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Tue May 12 19:48:25 IDT 2026

```text
market-maker-1  | 16:47:06.596 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:47:06.596 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 16:48:05.822 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (awaiting_settlement) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:48:06.933 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Mode: active'
market-maker-1  | 16:48:06.933 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:48:06.934 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5918, position range: [-5915, -5911]'
market-maker-1  | 16:48:06.934 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:48:06.934 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5915  to Bin -5911            │\n│ Lower Price:      93.8998    USDC/SOL                 │\n│ Upper Price:      94.0501    USDC/SOL                 │\n│ Mid Price:        93.9750    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.9749    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.9749    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 93.9749    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:48:06.934 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5918'
market-maker-1  | 16:48:06.934 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: close+open, Reason: Active bound -5918 shifted below range [-5915, -5911]. Rolling SOL single-sided to average buy price.'
market-maker-1  | 16:48:06.934 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: close+open with params'
market-maker-1  | 16:48:06.938 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:48:06.938 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Tue May 12 19:49:25 IDT 2026

```text
market-maker-1  | 16:48:06.933 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Mode: active'
market-maker-1  | 16:48:06.933 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:48:06.934 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5918, position range: [-5915, -5911]'
market-maker-1  | 16:48:06.934 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:48:06.934 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5915  to Bin -5911            │\n│ Lower Price:      93.8998    USDC/SOL                 │\n│ Upper Price:      94.0501    USDC/SOL                 │\n│ Mid Price:        93.9750    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.9749    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.9749    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0000     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 93.9749    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:48:06.934 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5918'
market-maker-1  | 16:48:06.934 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: close+open, Reason: Active bound -5918 shifted below range [-5915, -5911]. Rolling SOL single-sided to average buy price.'
market-maker-1  | 16:48:06.934 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: close+open with params'
market-maker-1  | 16:48:06.938 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:48:06.938 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 16:49:05.826 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (pending_open) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:49:06.589 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:49:06.590 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Tue May 12 19:50:26 IDT 2026

```text
market-maker-1  | 16:50:05.225 [lifecycle] INFO: '[Discovery] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is not on-chain but has an active rebalance task. Retaining orchestrator and setting state to REBALANCING.'
market-maker-1  | 16:50:05.226 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_experimental_001 targeting position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:50:05.226 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:50:05.251 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (awaiting_settlement) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:50:06.346 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Mode: active'
market-maker-1  | 16:50:06.346 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:50:06.346 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5919, position range: [-5918, -5908]'
market-maker-1  | 16:50:06.346 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR]'
market-maker-1  | 16:50:06.346 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:50:06.347 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR]'
market-maker-1  | 16:50:06.347 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5918  to Bin -5908            │\n│ Lower Price:      93.7872    USDC/SOL                 │\n│ Upper Price:      94.1630    USDC/SOL                 │\n│ Mid Price:        93.9751    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.9749    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.9749    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0002     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 93.9749    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:50:06.347 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR]'
market-maker-1  | 16:50:06.347 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5919'
market-maker-1  | 16:50:06.348 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: close+open, Reason: Active bound -5919 shifted below range [-5918, -5908]. Rolling SOL single-sided to average buy price.'
market-maker-1  | 16:50:06.348 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: close+open with params'
market-maker-1  | 16:50:06.787 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:50:06.787 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Tue May 12 19:51:26 IDT 2026

```text
market-maker-1  | 16:51:22.813 [lifecycle] INFO: '[Discovery] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is not on-chain but has an active rebalance task. Retaining orchestrator and setting state to REBALANCING.'
market-maker-1  | 16:51:22.814 [orchestrator-factory] INFO: '[OrchestratorFactory] Creating StrategyOrchestrator for assignment asg_experimental_001 targeting position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:51:22.814 [orchestrator-registry] INFO: '[OrchestratorRegistry] Registering orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:51:22.831 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (awaiting_settlement) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
```

### Update: Tue May 12 19:52:26 IDT 2026

```text
market-maker-1  | 16:51:55.906 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (awaiting_settlement) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:52:23.284 [strategy-orchestrator] INFO: '[StrategyOrchestrator] Ticking orchestrator orch_asg_experimental_001 for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Mode: active'
market-maker-1  | 16:52:23.284 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:52:23.284 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5922, position range: [-5919, -5907]'
market-maker-1  | 16:52:23.285 [workflow] INFO: '[Workflow] Running step: InitializationCheckStep [positionId=F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR]'
market-maker-1  | 16:52:23.285 [initialization-check-step] INFO: '[InitializationCheckStep] Checking initialization status for position: F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:52:23.285 [initialization-check-step] INFO: '[InitializationCheckStep] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is initialized and active.'
market-maker-1  | 16:52:23.285 [workflow] INFO: '[Workflow] Running step: ClmmPricingStep [positionId=F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR]'
market-maker-1  | 16:52:23.285 [clmm-pricing-step] INFO: '\n┌────────────────────────────────────────────────────────┐\n│ 🚀 CLMM POSITION PRICING METRICS                       │\n├────────────────────────────────────────────────────────┤\n│ Position ID:      F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR │\n│ Range Bounds:     Bin -5919  to Bin -5907            │\n│ Lower Price:      93.7497    USDC/SOL                 │\n│ Upper Price:      94.2007    USDC/SOL                 │\n│ Mid Price:        93.9752    USDC/SOL                 │\n├────────────────────────────────────────────────────────┤\n│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n├────────────────────────────────────────────────────────┤\n│ 1. Geometric Average: 93.9749    USDC/SOL        │\n│    (Mathematical space center for Uniswap v3/Meteora) │\n│ 2. Spot Accounting:   93.9749    USDC/SOL        │\n│    (Total cost basis divided by total base assets)    │\n│ 3. Bid-Ask perspective:                                │\n│    Convexity Benefit: 0.0003     USDC             │\n│    (Benefit of range vs single limit order at mid)     │\n│ 4. Effective Break-even:                               │\n│    With Accrued Fees: 93.9749    USDC/SOL        │\n└────────────────────────────────────────────────────────┘'
market-maker-1  | 16:52:23.285 [workflow] INFO: '[Workflow] Running step: ExperimentalRestakeStep [positionId=F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR]'
market-maker-1  | 16:52:23.286 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR. Active bound: -5922'
market-maker-1  | 16:52:23.286 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: close+open, Reason: Active bound -5922 shifted below range [-5919, -5907]. Rolling SOL single-sided to average buy price.'
market-maker-1  | 16:52:23.286 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: close+open with params'
market-maker-1  | 16:52:24.172 [solana-executor] INFO: "[SolanaExecutor] Applying decision 'open' on position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR"
```

### Update: Tue May 12 19:53:26 IDT 2026

```text
market-maker-1  | 16:52:30.418 [lifecycle] INFO: '[Execution Monitor] Updating assignment asg_experimental_001 position ID from F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR to HcdXwbzjSuquHjfyeeYP7dTA2RKHkTLz429YvLDScxnn'
market-maker-1  | 16:52:31.621 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:52:31.621 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
market-maker-1  | 16:52:55.891 [lifecycle] INFO: '[Execution Monitor] Processing task task_1778604306400_391 (pending_open) for position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR'
market-maker-1  | 16:52:57.787 [lifecycle] INFO: '[Tick Loop] Evaluating position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR on chain [solana]'
market-maker-1  | 16:52:57.787 [lifecycle] INFO: '[Tick Loop] Position F8mB87KudC5k6pf4m1U3Kd7L9QjA3Num3Zp7gBTsVvLR is currently locked (active rebalance task in-flight). Skipping evaluation.'
```

### Update: Tue May 12 19:54:26 IDT 2026

```text
market-maker-1  | 16:54:06.044 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: HcdXwbzjSuquHjfyeeYP7dTA2RKHkTLz429YvLDScxnn'
market-maker-1  | 16:54:06.044 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5922, position range: [-5922, -5904]'
market-maker-1  | 16:54:06.047 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: skip, Reason: Price is within position bounds'
market-maker-1  | 16:54:06.047 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: skip'
```

### Update: Tue May 12 19:55:27 IDT 2026

```text
market-maker-1  | 16:55:22.147 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: HcdXwbzjSuquHjfyeeYP7dTA2RKHkTLz429YvLDScxnn'
market-maker-1  | 16:55:22.147 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5919, position range: [-5922, -5904]'
market-maker-1  | 16:55:22.148 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: skip, Reason: Price is within position bounds'
market-maker-1  | 16:55:22.148 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: skip'
```

### Update: Tue May 12 19:56:27 IDT 2026

```text
market-maker-1  | 16:55:22.148 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: skip, Reason: Price is within position bounds'
market-maker-1  | 16:55:22.148 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: skip'
market-maker-1  | 16:56:23.518 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: HcdXwbzjSuquHjfyeeYP7dTA2RKHkTLz429YvLDScxnn'
market-maker-1  | 16:56:23.518 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Market snapshot - active bound: -5916, position range: [-5922, -5904]'
market-maker-1  | 16:56:23.520 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: skip, Reason: Price is within position bounds'
market-maker-1  | 16:56:23.520 [experimental-restake-strategy] INFO: '[ExperimentalRestakeStrategy] Decision: skip'
```
