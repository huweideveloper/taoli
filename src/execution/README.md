# Live Trading（V1 禁用）

V1 只做 Binance Spot + BSC + OKX DEX 的监控、记录、回测和 Paper Trading。

以下模块只允许在未来完成安全评审后新增：

- `binance-executor.ts`
- `okx-swap-builder.ts`
- `wallet.ts`
- `transaction-signer.ts`
- `execution-coordinator.ts`
- `kill-switch.ts`

当前代码不保存钱包私钥、不申请 Binance 交易权限、不执行 Swap，也不执行提款。
