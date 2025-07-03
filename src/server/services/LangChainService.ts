import { config } from '../config';
import { logger } from '../utils/logger';
import { BedrockService } from './BedrockService';

// Import LangChain components
import { ChatBedrock } from '@langchain/community/chat_models/bedrock';
// import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Import AgentKit LangChain integration
// import { getLangChainTools } from '@coinbase/agentkit-langchain';

export interface MarketAnalysisResult {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  recommendedAction: 'buy' | 'sell' | 'hold';
  riskLevel: 'low' | 'medium' | 'high';
  priceTarget?: number;
  stopLoss?: number;
}

export interface TradingDecision {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  confidence: number;
  reasoning: string;
  riskAssessment: string;
  timestamp: Date;
}

export class LangChainService {
  private model: any; // ChatBedrock instance
  private bedrockService: BedrockService;
  private tools: DynamicStructuredTool[];

  constructor() {
    // Initialize Bedrock model through LangChain
    this.model = new ChatBedrock({
      model: config.aws.bedrockModelId,
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
      maxTokens: 2000,
      temperature: 0.1, // Low temperature for consistent financial analysis
    });

    this.bedrockService = new BedrockService();
    this.tools = []; // Initialize empty, will be populated async
    
    // Initialize tools asynchronously
    this.initializeTools().then(() => {
      logger.info('LangChain service initialized with Bedrock integration');
    }).catch((error) => {
      logger.error('Failed to initialize LangChain service:', error);
    });
  }

  private async initializeTools(): Promise<void> {
    try {
      // Get AgentKit LangChain tools - requires agentkit instance
      // For now, we'll use custom tools only since we don't have agentkit instance here
      const agentKitTools: any[] = [];
      
      // Create custom tools for market analysis
      const customTools = [
        new DynamicStructuredTool({
          name: 'analyze_market_data',
          description: 'Analyze market data for a specific cryptocurrency',
          schema: z.object({
            symbol: z.string().describe('The cryptocurrency symbol to analyze'),
            timeframe: z.string().describe('The timeframe for analysis (1h, 4h, 1d, 1w)'),
          }) as any,
          func: async (input) => {
            const { symbol, timeframe: _timeframe } = input as any;
            try {
              const analysis = await this.bedrockService.analyzeMarketSentiment(symbol);
              return JSON.stringify(analysis);
            } catch (error) {
              return `Error analyzing market data: ${error}`;
            }
          },
        }),
        
        new DynamicStructuredTool({
          name: 'calculate_position_size',
          description: 'Calculate optimal position size based on risk parameters',
          schema: z.object({
            availableBalance: z.number().describe('Available balance in USDC'),
            riskPercentage: z.number().describe('Risk percentage (1-100)'),
            currentPrice: z.number().describe('Current asset price'),
          }) as any,
          func: async (input) => {
            const { availableBalance, riskPercentage, currentPrice } = input as any;
            const riskAmount = (availableBalance * riskPercentage) / 100;
            const positionSize = riskAmount / currentPrice;
            return JSON.stringify({
              positionSize,
              riskAmount,
              leverage: 1,
            });
          },
        }),
      ];

      // Combine AgentKit tools with custom tools
      this.tools = [...agentKitTools, ...customTools];
      
      logger.info('LangChain tools initialized', { 
        agentKitTools: agentKitTools.length,
        customTools: customTools.length,
        totalTools: this.tools.length
      });
    } catch (error) {
      logger.error('Failed to initialize LangChain tools:', error);
      // Fallback to basic tools
      this.tools = [];
    }
  }

  async createTradingAgent(): Promise<AgentExecutor> {
    const systemPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert cryptocurrency trading AI agent. Your role is to:
      1. Analyze market conditions and sentiment
      2. Make informed trading decisions based on technical and fundamental analysis
      3. Manage risk through proper position sizing
      4. Provide clear reasoning for all decisions
      Always consider:
      - Market volatility and current conditions
      - Risk management principles
      - Portfolio diversification
      - Stop-loss and take-profit levels
      Current market context: {context}`]
    ]);

    const prompt = await createOpenAIToolsAgent({
      llm: this.model,
      tools: this.tools,
      prompt: systemPrompt,
    });

    return new AgentExecutor({
      agent: prompt,
      tools: this.tools,
      verbose: true,
      maxIterations: 5,
    });
  }

  async analyzeMarketWithLangChain(symbol: string, marketData: any): Promise<MarketAnalysisResult> {
    const agent = await this.createTradingAgent();
    
    const result = await agent.invoke({
      input: `Analyze the market for ${symbol} and provide a comprehensive trading recommendation. 
      Market data: ${JSON.stringify(marketData)}`,
      context: `Analyzing ${symbol} market conditions`,
    });

    // Parse the result into structured format
    return this.parseAnalysisResult(result.output);
  }

  async makeTradingDecision(
    agentId: string, 
    symbol: string, 
    marketData: any, 
    portfolioBalance: number
  ): Promise<TradingDecision> {
    const agent = await this.createTradingAgent();
    
    const result = await agent.invoke({
      input: `Make a trading decision for ${symbol}. 
      Available balance: ${portfolioBalance} USDC
      Market data: ${JSON.stringify(marketData)}
      
      Provide a structured decision with:
      - Action (buy/sell/hold)
      - Amount to trade
      - Confidence level
      - Reasoning
      - Risk assessment`,
    });

    return this.parseTradingDecision(result.output, symbol);
  }

  private parseAnalysisResult(output: string): MarketAnalysisResult {
    try {
      // Try to parse JSON if the output is structured
      const parsed = JSON.parse(output);
      return {
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 50,
        reasoning: parsed.reasoning || output,
        recommendedAction: parsed.recommendedAction || 'hold',
        riskLevel: parsed.riskLevel || 'medium',
        priceTarget: parsed.priceTarget,
        stopLoss: parsed.stopLoss,
      };
    } catch {
      // Fallback parsing for natural language output
      const sentiment = output.toLowerCase().includes('bullish') ? 'bullish' :
                       output.toLowerCase().includes('bearish') ? 'bearish' : 'neutral';
      
      return {
        sentiment,
        confidence: 50,
        reasoning: output,
        recommendedAction: 'hold',
        riskLevel: 'medium',
      };
    }
  }

  private parseTradingDecision(output: string, symbol: string): TradingDecision {
    try {
      const parsed = JSON.parse(output);
      return {
        symbol,
        action: parsed.action || 'hold',
        amount: parsed.amount || 0,
        confidence: parsed.confidence || 50,
        reasoning: parsed.reasoning || output,
        riskAssessment: parsed.riskAssessment || 'Standard risk',
        timestamp: new Date(),
      };
    } catch {
      // Fallback parsing
      const action = output.toLowerCase().includes('buy') ? 'buy' :
                    output.toLowerCase().includes('sell') ? 'sell' : 'hold';
      
      return {
        symbol,
        action,
        amount: 0,
        confidence: 50,
        reasoning: output,
        riskAssessment: 'Standard risk',
        timestamp: new Date(),
      };
    }
  }

  async createChainForStrategy(_strategy: string): Promise<RunnableSequence> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a {strategy} trading specialist. Analyze the market and provide recommendations.
      
      Market Data: {marketData}
      Portfolio: {portfolio}
      
      Provide your analysis and recommendations.
    `);

    return RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);
  }
}

export default LangChainService; 