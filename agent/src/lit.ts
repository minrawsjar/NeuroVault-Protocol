import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { ethers } from "ethers";

export interface EncryptedSecret {
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: any[];
}

export class LitEncryption {
  private litNode: LitNodeClient;
  private signer: ethers.Signer;
  private chain: string;

  constructor(signer: ethers.Signer, chain = "ethereum") {
    this.signer = signer;
    this.chain = chain;
    this.litNode = new LitNodeClient({
      litNetwork: "naga" as any,
      debug: false,
    });
  }

  async connect(): Promise<void> {
    await this.litNode.connect();
  }

  disconnect(): void {
    this.litNode.disconnect();
  }

  async encryptSecret(
    secret: string,
    authorizedAddresses: string[]
  ): Promise<EncryptedSecret> {
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

    const { ciphertext, dataToEncryptHash } = await this.litNode.encrypt({
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
    const sessionSigs = await this.getSessionSigs();

    const decrypted = await this.litNode.decrypt({
      accessControlConditions: encrypted.accessControlConditions,
      ciphertext: encrypted.ciphertext,
      dataToEncryptHash: encrypted.dataToEncryptHash,
      sessionSigs,
      chain: this.chain,
    });

    return new TextDecoder().decode((decrypted as unknown) as Uint8Array);
  }

  private async getSessionSigs(): Promise<any> {
    const address = await this.signer.getAddress();

    const { LitActionResource } = await import("@lit-protocol/auth-helpers");
    const resource = new LitActionResource("*");

    const sessionSigs = await this.litNode.getSessionSigs({
      chain: this.chain,
      resourceAbilityRequests: [
        {
          resource,
          ability: LIT_ABILITY.LitActionExecution as any,
        },
      ],
      authNeededCallback: async (params: any) => {
        const toSign = await this.createSiweMessage(params);
        const signature = await this.signer.signMessage(toSign);

        return {
          sig: signature,
          derivedVia: "web3.eth.personal.sign",
          signedMessage: toSign,
          address: address.toLowerCase(),
        };
      },
    });

    return sessionSigs;
  }

  private async createSiweMessage(params: any): Promise<string> {
    const address = await this.signer.getAddress();
    const nonce = await this.litNode.getLatestBlockhash();

    return [
      `NeuroVault Agent Authentication`,
      ``,
      `URI: ${params.uri || "https://neurovault.eth"}`,
      `Version: 1`,
      `Chain ID: 1`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
      `Resources:`,
      `- litAction://*`,
    ].join("\n");
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
