import { Web3Storage } from "web3.storage";

export interface ProposalBlob {
  proposalId: number;
  timestamp: string;
  model: string;
  confidence: number;
  reasoning: string;
  context: {
    treasuryState: {
      totalValue: string;
      dotBalance: string;
      usdcBalance: string;
      apy: string;
    };
    goals: Array<{ id: number; text: string }>;
  };
  proposedAction: {
    type: string;
    description: string;
    amount: string;
    token: string;
    targetToken?: string;
  };
}

export class IPFSStorage {
  private client: Web3Storage;

  constructor(token?: string) {
    const apiToken = token || process.env.WEB3_STORAGE_TOKEN;
    if (!apiToken) {
      throw new Error("WEB3_STORAGE_TOKEN not set");
    }
    this.client = new Web3Storage({ token: apiToken });
  }

  async pinProposal(blob: ProposalBlob): Promise<string> {
    const jsonString = JSON.stringify(blob, null, 2);
    const blobData = new Blob([jsonString], { type: "application/json" });

    const file = new File([blobData], `proposal-${blob.proposalId}.json`, {
      type: "application/json",
    });

    const cid = await this.client.put([file], {
      name: `neurovault-proposal-${blob.proposalId}`,
      maxRetries: 3,
    });

    return cid;
  }

  async getProposal(cid: string): Promise<ProposalBlob | null> {
    try {
      const res = await this.client.get(cid);
      if (!res || !res.ok) return null;

      const files = await res.files();
      if (files.length === 0) return null;

      const content = await files[0].text();
      return JSON.parse(content) as ProposalBlob;
    } catch (error) {
      console.error("Failed to fetch from IPFS:", error);
      return null;
    }
  }

  getIPFSUrl(cid: string): string {
    return `https://${cid}.ipfs.w3s.link`;
  }
}
