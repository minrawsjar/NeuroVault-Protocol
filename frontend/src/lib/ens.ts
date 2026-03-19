export type EnsRegistrationStatus = "registered" | "pending";

export interface EnsRecord {
  name: string;
  owner: string;
  status: EnsRegistrationStatus;
  txHash: string;
  createdAt: string;
}

type GlobalEnsStore = {
  registry?: EnsRecord[];
};

const globalEnsStore = globalThis as typeof globalThis & GlobalEnsStore;

if (!globalEnsStore.registry) {
  globalEnsStore.registry = [
    {
      name: "neurovault.eth",
      owner: "protocol-treasury",
      status: "registered",
      txHash: "0xens0019aa77",
      createdAt: new Date().toISOString(),
    },
  ];
}

const ENS_REGISTRY = globalEnsStore.registry;

function normalizeName(input: string) {
  return input.trim().toLowerCase();
}

function isValidEnsName(name: string) {
  return /^[a-z0-9-]+\.eth$/.test(name);
}

function randomHash() {
  const rand = Math.random().toString(16).slice(2, 12);
  return `0xens${rand}`;
}

export function getEnsRecords(): EnsRecord[] {
  return [...ENS_REGISTRY];
}

export function getPrimaryEns(): EnsRecord | null {
  return ENS_REGISTRY.find((r) => r.status === "registered") ?? null;
}

export function registerEnsName(params: { name: string; owner?: string }) {
  const name = normalizeName(params.name);
  const owner = (params.owner || "unknown").trim() || "unknown";

  if (!isValidEnsName(name)) {
    return {
      ok: false as const,
      error: "Invalid ENS name. Use format: <name>.eth",
    };
  }

  const existing = ENS_REGISTRY.find((r) => r.name === name);
  if (existing) {
    return {
      ok: true as const,
      record: existing,
      alreadyExists: true,
    };
  }

  const record: EnsRecord = {
    name,
    owner,
    status: "registered",
    txHash: randomHash(),
    createdAt: new Date().toISOString(),
  };

  ENS_REGISTRY.unshift(record);

  return {
    ok: true as const,
    record,
    alreadyExists: false,
  };
}
