# Execution Report 05: Experimental Restake Strategy

## Target Position

`9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY`

## Summary

The framework successfully discovered the manually opened experimental position and registered its orchestrator on container startup. The engine is properly evaluating the position and verified that the active bin is safely within range bounds.

The `syntheticPos` fix was also successfully deployed to the engine context, meaning any subsequent close/open task executions on this position will correctly maintain the 0.3 USDC scale limits and not default to the wallet's total token balance.

## Verification Logs

```text
17:29:38.364 [lifecycle] INFO: '[Discovery] Active known position verified on-chain: 9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY'
17:29:38.365 [lifecycle] INFO: '[Discovery] Registering orchestrator on startup for assignment asg_exp_005 (strategy: experimental-restake) targeting position 9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY'
17:29:39.000 [lifecycle] INFO: '[Tick Loop] Position 9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY details: Pool Price: 94.4270173676638 | Bounds: [-5904, -5900] | In-Range: true'
17:29:39.001 [clmm-pricing-step] INFO: '[ClmmPricingStep] positionId=9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY lowerBound=-5904 upperBound=-5900 midPrice=94.3893 geometricAverage=94.3893 effectiveBreakEven=94.3893'
17:29:39.002 [experimental-restake-step] INFO: '[ExperimentalRestakeStep] Evaluating position 9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY. Active bound: -5901'
17:29:39.002 [lifecycle] INFO: '[Tick Loop] No execution required for position 9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY'
```

## Strategy Evaluation

The position `9FjHXYCcjNP1BHzfEsQvys1J8CBkiyivxqCWEyHzQNMY` is fully active and being tracked by `orch_asg_exp_005`. As intended, no actions were taken because the current active bin `-5901` is well inside the position's geometric boundaries `[-5904, -5900]`.
