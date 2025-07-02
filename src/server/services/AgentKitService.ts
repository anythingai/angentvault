import { config } from '../config';
import { logger } from '../utils/logger';

// AgentKit is mandatory in production. Fail fast if it can't be resolved so the
// container never boots half-configured.
let CdpWalletProvider: any;
let SwapAction: any;
let GetBalancesAction: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const agentkit = require('@coinbase/agentkit');
  CdpWalletProvider = agentkit.CdpWalletProvider;
  SwapAction = agentkit.actions?.SwapAction ?? agentkit.SwapAction;
  GetBalancesAction = agentkit.actions?.GetBalancesAction ?? agentkit.GetBalancesAction;
} catch (err) {
  logger.error('❌ @coinbase/agentkit is not installed or failed to load.', { err });
  throw new Error('AgentKit dependency missing. Install @coinbase/agentkit and its peer deps before starting the server.');
}

export interface Balance {
  asset: string;
  amount: string;
  amountUSD?: number;
}

class AgentKitService {
  private walletProvider: any;

  constructor() {
    // All required credentials are validated in ../config. If we reach this
    // point, they are present.
    this.walletProvider = new CdpWalletProvider({
      apiKeyName: config.cdp.apiKeyId,
      privateKey: config.cdp.apiKeySecret,
      network: config.cdp.network ?? 'base-sepolia',
    });

    logger.info('✅ AgentKit wallet provider initialised');
  }

  /* ------------------------------------------------------------------ */
  /*                               Balance                              */
  /* ------------------------------------------------------------------ */
  async getBalances(): Promise<Balance[]> {
    const action = new GetBalancesAction(this.walletProvider);
    const sdkBalances = await action.run();

    return sdkBalances.map((b: any) => ({
      asset: b.assetId ?? b.asset ?? 'UNKNOWN',
      amount: b.amount,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*                                 Swap                               */
  /* ------------------------------------------------------------------ */
  async swap(fromAsset: string, toAsset: string, amount: string): Promise<{ success: boolean; transactionHash: string }> {
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