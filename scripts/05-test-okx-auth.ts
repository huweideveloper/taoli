import "dotenv/config";
import { okxCredentialsFromEnv } from "../src/okx/auth.js";
import { OkxClient } from "../src/okx/client.js";

okxCredentialsFromEnv(process.env);
const chains = await new OkxClient().get<Array<{ chainIndex: string; chainName: string }>>(
  "/api/v6/dex/market/supported/chain",
);
console.log("OKX authenticated");
console.log(`Supported chains: ${chains.length}`);
console.log(chains.find(({ chainIndex }) => chainIndex === "56") ?? "BSC not returned");
