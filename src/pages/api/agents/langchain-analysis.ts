import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../server/utils/logger';
import LangChainService from '../../../server/services/LangChainService';

const langChainService = new LangChainService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, marketData, portfolioBalance, agentId } = req.body;

    if (!symbol || !marketData) {
      return res.status(400).json({ 
        error: 'Missing required parameters: symbol and marketData' 
      });
    }

    logger.info('Processing LangChain analysis request', { symbol, agentId });

    // Perform LangChain-based market analysis
    const analysis = await langChainService.analyzeMarketWithLangChain(symbol, marketData);

    // Make trading decision using LangChain
    const decision = await langChainService.makeTradingDecision(
      agentId || 'analysis-agent',
      symbol,
      marketData,
      portfolioBalance || 1000
    );

    // Create a LangChain agent for advanced analysis
    const _agent = await langChainService.createTradingAgent();

    const result = {
      analysis,
      decision,
      agentInfo: {
        id: agentId || 'analysis-agent',
        type: 'LangChain Agent',
        model: 'Amazon Bedrock Nova',
        tools: ['market_analysis', 'portfolio_balance', 'position_sizing', 'risk_assessment'],
        timestamp: new Date().toISOString()
      },
      metadata: {
        framework: 'LangChain',
        integration: 'AgentKit + Bedrock',
        version: '0.3.0',
        analysisType: 'real-time'
      }
    };

    logger.info('LangChain analysis completed successfully', { symbol, agentId });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('LangChain analysis failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'LangChain analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 