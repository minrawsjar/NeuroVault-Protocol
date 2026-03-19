import { nagaDev } from "@lit-protocol/networks";
import { createLitClient } from "@lit-protocol/lit-client";
import { ethers } from "ethers";

export interface EncryptedSecret {
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: any[];
}

export class LitEncryption {
  private litClient: any;
  private signer: ethers.Signer;
  private chain: string;
  private connected = false;

  constructor(signer: ethers.Signer, chain = "ethereum") {
    this.signer = signer;
    this.chain = chain;
  }

  async connect(): Promise<void> {
    this.litClient = await createLitClient({
      network: nagaDev,
    });
    this.connected = true;
  }

  disconnect(): void {
    if (this.litClient?.disconnect) {
      this.litClient.disconnect();
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async encryptSecret(
    secret: string,
    authorizedAddresses: string[]
  ): Promise<EncryptedSecret> {
    if (!this.litClient) throw new Error("Lit client not connected");

    const accessControlConditions = authorizedAddresses.map((addr) => ({
      contractAddress: "",
      standardContractType: "",
      chain: this.chain,
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: addr.toLowerCase(),
      },
    }));

    const conditions: any[] =
      accessControlConditions.length > 1
        ? accessControlConditions.reduce((acc: any[], c, i) => {
            if (i > 0) acc.push({ operator: "or" });
            acc.push(c);
            return acc;
          }, [])
        : accessControlConditions;

    const { ciphertext, dataToEncryptHash } = await this.litClient.encrypt({
      accessControlConditions: conditions,
      dataToEncrypt: new TextEncoder().encode(secret),
    });

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions: conditions,
    };
  }

  async decryptSecret(encrypted: EncryptedSecret): Promise<string> {
    if (!this.litClient) throw new Error("Lit client not connected");

    const decrypted = await this.litClient.decrypt({
      accessControlConditions: encrypted.accessControlConditions,
      ciphertext: encrypted.ciphertext,
      dataToEncryptHash: encrypted.dataToEncryptHash,
      chain: this.chain,
    });

    return new TextDecoder().decode((decrypted as unknown) as Uint8Array);
  }
}

// Utility for storing encrypted secrets to IPFS or local storage
export class SecretVault {
  private lit: LitEncryption;
  private storage: Map<string, EncryptedSecret> = new Map();

  constructor(lit: LitEncryption) {
    this.lit = lit;
  }

  async storeSecret(
    key: string,
    secret: string,
    authorizedAddresses: string[]
  ): Promise<void> {
    const encrypted = await this.lit.encryptSecret(secret, authorizedAddresses);
    this.storage.set(key, encrypted);
  }

  async retrieveSecret(key: string): Promise<string | null> {
    const encrypted = this.storage.get(key);
    if (!encrypted) return null;
    return this.lit.decryptSecret(encrypted);
  }

  getEncryptedData(key: string): EncryptedSecret | undefined {
    return this.storage.get(key);
  }

  hasSecret(key: string): boolean {
    return this.storage.has(key);
  }
}
