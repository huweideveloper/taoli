import { createHmac } from "node:crypto";

export interface OkxCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  projectId?: string;
}

export interface OkxSigningInput {
  credentials: OkxCredentials;
  timestamp: string;
  method: string;
  requestPath: string;
  body?: string;
}

export const signOkxRequest = ({ credentials, timestamp, method, requestPath, body = "" }: OkxSigningInput) => createHmac(
  "sha256",
  credentials.secretKey,
).update(`${timestamp}${method.toUpperCase()}${requestPath}${body}`).digest("base64");

export const createOkxHeaders = (input: OkxSigningInput): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": input.credentials.apiKey,
    "OK-ACCESS-SIGN": signOkxRequest(input),
    "OK-ACCESS-TIMESTAMP": input.timestamp,
    "OK-ACCESS-PASSPHRASE": input.credentials.passphrase,
  };
  if (input.credentials.projectId) headers["OK-ACCESS-PROJECT"] = input.credentials.projectId;
  return headers;
};

export const okxCredentialsFromEnv = (env: NodeJS.ProcessEnv): OkxCredentials => {
  const apiKey = env.OKX_API_KEY;
  const secretKey = env.OKX_SECRET_KEY;
  const passphrase = env.OKX_PASSPHRASE ?? env.OKX_API_PASSPHRASE;
  if (!apiKey || !secretKey || !passphrase) throw new Error("Missing OKX_API_KEY, OKX_SECRET_KEY, or OKX_PASSPHRASE");
  return { apiKey, secretKey, passphrase, projectId: env.OKX_PROJECT_ID };
};
