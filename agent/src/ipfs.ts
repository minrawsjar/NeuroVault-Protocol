import { createHash } from "node:crypto";

const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function commitReasoningBlob(
  blob: unknown,
  opts?: { web3StorageToken?: string }
): Promise<string> {
  const payload = JSON.stringify(blob);
  const fallbackCid = toDeterministicCid(payload);

  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    console.warn("⚠️  PINATA_JWT not set — using deterministic fallback CID");
    return fallbackCid;
  }

  try {
    const res = await fetch(PINATA_PIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        pinataContent: {
          source: "NeuroVault Agent",
          content: blob,
        },
        pinataMetadata: {
          name: `neurovault-reasoning-${Date.now()}`,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`❌ Pinata upload failed (${res.status}): ${text}`);
      return fallbackCid;
    }

    const data = await res.json();
    const cid = data.IpfsHash;
    console.log(`📌 Pinned to IPFS via Pinata: ${cid}`);
    console.log(`🔗 https://gateway.pinata.cloud/ipfs/${cid}`);
    return cid;
  } catch (err) {
    console.error("❌ Pinata upload error:", err);
    return fallbackCid;
  }
}

function toDeterministicCid(content: string): string {
  const digest = createHash("sha256").update(content).digest("hex");
  return `bafy${digest.slice(0, 55)}`;
}
