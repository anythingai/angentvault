import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../server/utils/logger';
import agentKitService from '../../../server/services/AgentKitService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, config, marketData } = req.body;

    logger.info('Processing AgentKit request', { action });

    let result: any = {};

    switch (action) {
      case 'create_agent': {
        if (!config) {
          return res.status(400).json({ error: 'Agent configuration required' });
        }
        
        const agent = await agentKitService.createAgent({
          name: config.name || 'Trading Agent',
          strategy: config.strategy || 'momentum',
          riskLevel: config.riskLevel || 'medium',
          maxTradeSize: config.maxTradeSize || 1000,
          tradingPairs: config.tradingPairs || ['BTC/USD'],
          enabled: true
        });
        
        result = { agent };
        break;
      }

      case 'execute_agent': {
        if (!config?.agentId || !marketData) {
          return res.status(400).json({ error: 'Agent ID and market data required' });
        }
        
        const executionResult = await agentKitService.executeAgent(config.agentId, marketData);
        result = { executionResult };
        break;
      }

      case 'get_balances': {
        const balances = await agentKitService.getBalances();
        result = { balances };
        break;
      }

      case 'swap': {
        if (!config?.fromAsset || !config?.toAsset || !config?.amount) {
          return res.status(400).json({ error: 'Swap parameters required' });
        }
        
        const swapResult = await agentKitService.swap(
          config.fromAsset,
          config.toAsset,
          config.amount
        );
        result = { swapResult };
        break;
      }

      case 'transfer': {
        if (!config?.toAddress || !config?.asset || !config?.amount) {
          return res.status(400).json({ error: 'Transfer parameters required' });
        }
        
        const transferResult = await agentKitService.transfer(
          config.toAddress,
          config.asset,
          config.amount
        );
        result = { transferResult };
        break;
      }

      case 'system_health': {
        const health = await agentKitService.getSystemHealth();
        result = { health };
        break;
      }

      case 'get_agents': {
        const agents = await agentKitService.getAllAgents();
        result = { agents };
        break;
      }

      case 'create_custom_action': {
        if (!config?.actionName || !config?.actionConfig) {
          return res.status(400).json({ error: 'Action name and configuration required' });
        }
        
        const customAction = await agentKitService.createCustomAction(
          config.actionName,
          config.actionConfig
        );
        result = { customAction };
        break;
      }

      case 'deploy_contract': {
        if (!config?.contractName) {
          return res.status(400).json({ error: 'Contract name required' });
        }
        
        const deployResult = await agentKitService.deploySmartContract(
          config.contractName,
          config.constructorArgs || []
        );
        result = { deployResult };
        break;
      }

      case 'get_agent_performance': {
        if (!config?.agentId) {
          return res.status(400).json({ error: 'Agent ID required' });
        }
        
        const performance = await agentKitService.getAgentPerformance(config.agentId);
        result = { performance };
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    logger.info('AgentKit operation completed successfully', { action });

    res.status(200).json({
      success: true,
      data: result,
      metadata: {
        framework: 'AgentKit',
        integration: 'LangChain + CDP Wallet',
        version: '0.8.2',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AgentKit operation failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'AgentKit operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 