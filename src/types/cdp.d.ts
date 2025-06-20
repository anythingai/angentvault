declare module '@coinbase/cdp-sdk' {
  export class Coinbase {
    constructor(config: {
      apiKeyName: string;
      privateKey: string;
    });
  }

  export class Wallet {
    static create(): Promise<Wallet>;
    static import(data: any): Promise<Wallet>;
    
    getId(): string;
    getDefaultAddress(): Address | null;
    export(): any;
    listBalances(): Map<string, number>;
    listAddresses(): Promise<Address[]>;
    createTrade(params: {
      amount: string;
      fromAssetId: string;
      toAssetId: string;
    }): Promise<Trade>;
    createTransfer(params: {
      amount: string;
      assetId: string;
      destination: string;
    }): Promise<Transfer>;
    deployContract(params: {
      contractCode: string;
      abi: any[];
    }): Promise<SmartContract>;
    listTransactions(): Promise<Transaction[]>;
  }

  export class Address {
    getId(): string;
    listTransactions(options?: { limit?: number }): Promise<Transaction[]>;
  }

  export class Trade {
    wait(): Promise<void>;
    getTransaction(): Transaction | null;
  }

  export class Transfer {
    wait(): Promise<void>;
    getTransaction(): Transaction | null;
  }

  export class SmartContract {
    wait(): Promise<void>;
    getContractAddress(): string;
    getTransaction(): Transaction | null;
  }

  export class Transaction {
    getTransactionHash(): string;
    getFromAddress(): string;
    getToAddress(): string;
    getValue(): number;
    getBlockTimestamp(): string;
    getStatus(): string;
  }
} 