import { createHash } from "node:crypto";

export async function commitReasoningBlob(
  blob: unknown,
  opts?: { web3StorageToken?: string }
): Promise<string> {
  const payload = JSON.stringify(blob);

  // Keep deterministic local CID-like fallback for demo mode
  const fallbackCid = toDeterministicCid(payload);

  // Real IPFS pinning can be wired here with Web3.Storage token.
  // We return deterministic CID fallback when token is missing or upload fails.
  if (!opts?.web3StorageToken) {
    return fallbackCid;
  }

  try {
    // Placeholder for full web3.storage upload integration.
    // Intentionally non-blocking to preserve cycle reliability in demo.
    return fallbackCid;
  } catch {
    return fallbackCid;
  }
}

function toDeterministicCid(content: string): string {
  const digest = createHash("sha256").update(content).digest("hex");
  return `bafy${digest.slice(0, 55)}`;
}
