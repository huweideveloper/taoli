import type { ResultSetHeader } from "mysql2/promise";
import type { ScannerCandidate } from "../../scanner/candidates.js";
import type { MySqlDatabase } from "../mysql.js";

export const saveScannerCandidate = async (db: MySqlDatabase, candidate: ScannerCandidate) => {
  await db.execute<ResultSetHeader>(
    "INSERT INTO scanner_candidates (token_id, binance_symbol, chain, contract_address, enabled, max_test_size, last_validation_at, reason) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?) ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), max_test_size = VALUES(max_test_size), last_validation_at = VALUES(last_validation_at), reason = VALUES(reason)",
    [candidate.tokenId, candidate.binanceSymbol, candidate.chain, candidate.contractAddress, candidate.enabled, candidate.maxTestSize, candidate.reason],
  );
};
