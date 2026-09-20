import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { TokenRegistryEntry } from "../../tokens/registry.js";
import type { MySqlDatabase } from "../mysql.js";

interface IdRow extends RowDataPacket {
  id: number;
}

export const saveTokenRegistryEntry = async (db: MySqlDatabase, entry: TokenRegistryEntry) => {
  await db.execute<ResultSetHeader>(
    "INSERT INTO binance_symbols (symbol, base_asset, quote_asset, status, spot_trading_allowed) VALUES (?, ?, 'USDT', 'TRADING', TRUE) ON DUPLICATE KEY UPDATE base_asset = VALUES(base_asset), status = VALUES(status), spot_trading_allowed = VALUES(spot_trading_allowed)",
    [entry.symbol, entry.baseAsset],
  );
  await db.execute<ResultSetHeader>(
    "INSERT INTO tokens (symbol, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
    [entry.baseAsset, entry.tokenName ?? null],
  );
  const [rows] = await db.execute<IdRow[]>("SELECT id FROM tokens WHERE symbol = ?", [entry.baseAsset]);
  const tokenId = rows[0]?.id;
  if (!tokenId || !entry.contractAddress || entry.decimals === undefined) return;
  await db.execute<ResultSetHeader>(
    "INSERT INTO token_chain_mappings (token_id, chain, contract_address, decimals, verification_status, verification_reason) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE decimals = VALUES(decimals), verification_status = VALUES(verification_status), verification_reason = VALUES(verification_reason)",
    [tokenId, entry.chain, entry.contractAddress, entry.decimals, entry.status, entry.reasons.join(",")],
  );
};
