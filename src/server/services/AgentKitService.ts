import { config } from '../config';
import { logger } from '../utils/logger';

// Guard-import AgentKit so code compiles even if pkg missing during CI
let CdpWalletProvider: any;
let SwapAction: any;
let GetBalancesAction: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const agentkit = require('@coinbase/agentkit');
  CdpWalletProvider = agentkit.CdpWalletProvider;
  SwapAction = agentkit.actions?.SwapAction || agentkit.SwapAction;
  GetBalancesAction = agentkit.actions?.GetBalancesAction || agentkit.GetBalancesAction;
} catch (err) {
  logger.warn('AgentKit not installed – falling back to demo mode', { err });
}

export interface Balance {
  asset: string;
  amount: string;
  amountUSD?: number;
}

class AgentKitService {
  private walletProvider: any | null = null;
  private readonly demoMode: boolean;

  constructor() {
    this.demoMode = !CdpWalletProvider;

    if (!this.demoMode) {
      this.walletProvider = new CdpWalletProvider({
        apiKeyName: config.cdp.apiKeyName,
        privateKey: config.cdp.privateKey,
        network: config.cdp.network || 'base-sepolia',
      });

      logger.info('AgentKit wallet provider initialised');
    }
  }

  /* ------------------------------------------------------------------ */
  /*                               Balance                              */
  /* ------------------------------------------------------------------ */
  async getBalances(): Promise<Balance[]> {
    if (this.demoMode || !GetBalancesAction) {
      return [
        { asset: 'USDC', amount: '1000', amountUSD: 1000 },
        { asset: 'ETH', amount: '0.5', amountUSD: 1500 },
      ];
    }

    const action = new GetBalancesAction(this.walletProvider);
    const res = await action.run();
    // Assuming the SDK returns { assetId: string, amount: string }[]
    return res.map((b: any) => ({ asset: b.assetId, amount: b.amount }));
  }

  /* ------------------------------------------------------------------ */
  /*                                 Swap                               */
  /* ------------------------------------------------------------------ */
  async swap(fromAsset: string, toAsset: string, amount: string): Promise<any> {
    if (this.demoMode || !SwapAction) {
      // Fake tx hash for demo
      return {
        success: true,
        demo: true,
        transactionHash: '0xDEADBEEF',
        fromAsset,
        toAsset,
        amount,
      };
    }

    const action = new SwapAction(this.walletProvider);
    const tx = await action.run({ fromAsset, toAsset, amount });
    return {
      success: true,
      transactionHash: tx.hash ?? tx,
    };
  }
}

const agentKitService = new AgentKitService();
export default agentKitService; 