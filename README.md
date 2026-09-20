# CEX ↔ DEX Arbitrage Monitor

Binance Spot + BSC + OKX DEX 的监控、记录、回测和 Paper Trading V1。

V1 不保存钱包私钥、不接 Binance 交易权限、不执行真实 Swap。

## Quick start

```bash
npm install
cp .env.example .env
npm run env:check
npm test
```

## Runtime commands

```bash
npm run scanner                 # 长时间实时监控（需要 MySQL、Binance 网络和 OKX 凭据）
DURATION_HOURS=24 npm run collect # 采集 24 小时；72 小时改为 DURATION_HOURS=72
npm run report                  # 生成最近 72 小时研究报告
npm run paper                   # 评估 PAPER_TRADES_FILE 指定的 Paper trade JSON
```

真实凭据只放在本地 `.env`。V1 不执行真钱订单、不保存钱包私钥、不执行 OKX Swap。
