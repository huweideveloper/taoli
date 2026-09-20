import "dotenv/config";
import { chains } from "../config/chains.js";
import { riskConfig } from "../config/risk.js";
import { scannerConfig } from "../config/scanner.js";
import { OkxClient } from "../src/okx/client.js";
import { quoteBothDirections } from "../src/okx/quote.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";
import { buildScannerCandidates, type CandidateInput } from "../src/scanner/candidates.js";
import { MySqlDatabase } from "../src/storage/mysql.js";
import { saveScannerCandidate } from "../src/storage/repositories/scanner-candidates.js";
import type { RowDataPacket } from "mysql2/promise";

interface RegistryRow extends RowDataPacket {
  tokenId: number;
  binanceSymbol: string;
  chain: string;
  contractAddress: string;
  identityStatus: "VERIFIED" | "REVIEW" | "CONFLICT" | "NOT_FOUND" | "REJECTED";
  baseAsset: string;
}

const db = new MySqlDatabase();
const okx = new OkxClient();
try {
  await db.healthCheck();
  const [rows] = await db.execute<RegistryRow[]>("SELECT t.id AS tokenId, s.symbol AS binanceSymbol, m.chain, m.contract_address AS contractAddress, m.verification_status AS identityStatus, t.symbol AS baseAsset FROM token_chain_mappings m JOIN tokens t ON t.id = m.token_id JOIN binance_symbols s ON s.base_asset = t.symbol WHERE m.chain = ?", ["BSC"]);
  const inputs: CandidateInput[] = [];
  for (const row of rows) {
    const token = (await searchTokenCandidates(okx, row.baseAsset)).find(({ tokenContractAddress }) => tokenContractAddress.toLowerCase() === row.contractAddress.toLowerCase());
    if (!token) {
      inputs.push({ tokenId: row.tokenId, binanceSymbol: row.binanceSymbol, chain: row.chain, contractAddress: row.contractAddress, identityStatus: row.identityStatus, checks: [] });
      continue;
    }
    const quotes = await quoteBothDirections(okx, {
      chainIndex: chains.bsc.chainIndex,
      tokenPriceUsd: token.price,
      fromTokenDecimals: chains.bsc.usdtDecimals,
      tokenDecimals: Number(token.decimal),
      usdtAddress: chains.bsc.usdtAddress,
      tokenAddress: token.tokenContractAddress,
      sizesUsd: riskConfig.requiredQuoteSizesUsd,
    });
    inputs.push({
      tokenId: row.tokenId,
      binanceSymbol: row.binanceSymbol,
      chain: row.chain,
      contractAddress: row.contractAddress,
      identityStatus: row.identityStatus,
      checks: quotes.map((quote) => ({ sizeUsd: quote.sizeUsd, direction: quote.direction, success: true, priceImpactPercent: quote.priceImpact ?? "0", tokenTaxRate: quote.tokenTax, isHoneypot: quote.isHoneypot })),
    });
  }
  const candidates = buildScannerCandidates(inputs);
  for (const candidate of candidates) await saveScannerCandidate(db, candidate);
  const enabled = candidates.filter(({ enabled }) => enabled).length;
  console.log(`Verified tokens: ${rows.filter(({ identityStatus }) => identityStatus === "VERIFIED").length}`);
  console.log(`Quote capable: ${inputs.filter(({ checks }) => checks.length > 0).length}`);
  console.log(`Final scanner candidates: ${enabled}`);
  console.log(`Candidate build completed for ${candidates.length} records.`);
} finally {
  await db.close();
}
