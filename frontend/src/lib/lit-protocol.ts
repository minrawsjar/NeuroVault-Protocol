import { LitNodeClient } from "@lit-protocol/lit-node-client";

export interface LitEncryptedPayload {
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: unknown[];
  litNetwork: string;
}

let litClient: LitNodeClient | null = null;

async function getLitClient() {
  if (!litClient) {
    litClient = new LitNodeClient({
      litNetwork: "naga" as never,
      debug: false,
    });
    await litClient.connect();
  }
  return litClient;
}

function normalizeAddresses(addresses: string[]) {
  return [...new Set(addresses.map((a) => a.trim().toLowerCase()).filter(Boolean))];
}

function buildAccessControlConditions(addresses: string[], chain: string) {
  const conditions = addresses.map((addr) => ({
    contractAddress: "",
    standardContractType: "",
    chain,
    method: "",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: addr,
    },
  }));

  if (conditions.length <= 1) {
    return conditions;
  }

  return conditions.reduce<unknown[]>((acc, item, idx) => {
    if (idx > 0) acc.push({ operator: "or" });
    acc.push(item);
    return acc;
  }, []);
}

export async function encryptWithLit(params: {
  plaintext: string;
  authorizedAddresses: string[];
  chain?: string;
}): Promise<LitEncryptedPayload | null> {
  const chain = params.chain ?? "ethereum";
  const addresses = normalizeAddresses(params.authorizedAddresses);

  if (!params.plaintext || addresses.length === 0) {
    return null;
  }

  const client = await getLitClient();
  const accessControlConditions = buildAccessControlConditions(addresses, chain);

  const { ciphertext, dataToEncryptHash } = await client.encrypt({
    accessControlConditions,
    dataToEncrypt: new TextEncoder().encode(params.plaintext),
  });

  return {
    ciphertext,
    dataToEncryptHash,
    accessControlConditions,
    litNetwork: "naga",
  };
}
