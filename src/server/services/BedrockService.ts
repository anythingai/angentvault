import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import { logger } from '../utils/logger';
import { BedrockRequest } from '../../types';

export class BedrockService {
  private client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  async analyzeMarketSentiment(marketData: any): Promise<any> {
    const prompt = this.buildMarketSentimentPrompt(marketData);
    
    const request: BedrockRequest = {
      modelId: config.aws.bedrockModelId,
      prompt,
      maxTokens: 1000,
      temperature: 0.1,
      tools: [
        {
          name: 'market_analysis',
          description: 'Analyze market sentiment and provide trading recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              sentiment: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              recommendation: { type: 'string', enum: ['buy', 'sell', 'hold'] },
              reasoning: { type: 'string' },
              risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
            required: ['sentiment', 'confidence', 'recommendation', 'reasoning', 'risk_level'],
          },
        },
      ],
    };

    return this.invokeModel(request);
  }

  async predictPrice(symbol: string, historicalData: any[], timeframe: string): Promise<any> {
    const prompt = this.buildPricePredictionPrompt(symbol, historicalData, timeframe);
    
    const request: BedrockRequest = {
      modelId: config.aws.bedrockModelId,
      prompt,
      maxTokens: 800,
      temperature: 0.2,
      tools: [
        {
          name: 'price_prediction',
          description: 'Predict future price movements based on historical data',
          inputSchema: {
            type: 'object',
            properties: {
              predicted_price: { type: 'number' },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              direction: { type: 'string', enum: ['up', 'down', 'sideways'] },
              support_level: { type: 'number' },
              resistance_level: { type: 'number' },
              reasoning: { type: 'string' },
            },
            required: ['predicted_price', 'confidence', 'direction', 'reasoning'],
          },
        },
      ],
    };

    return this.invokeModel(request);
  }

  async assessRisk(portfolioData: any, marketConditions: any): Promise<any> {
    const prompt = this.buildRiskAssessmentPrompt(portfolioData, marketConditions);
    
    const request: BedrockRequest = {
      modelId: config.aws.bedrockModelId,
      prompt,
      maxTokens: 600,
      temperature: 0.1,
      tools: [
        {
          name: 'risk_assessment',
          description: 'Assess portfolio risk and provide recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              risk_score: { type: 'number', minimum: 0, maximum: 10 },
              risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
              diversification_score: { type: 'number', minimum: 0, maximum: 10 },
              recommendations: { type: 'array', items: { type: 'string' } },
              max_position_size: { type: 'number', minimum: 0, maximum: 1 },
              reasoning: { type: 'string' },
            },
            required: ['risk_score', 'risk_level', 'diversification_score', 'recommendations', 'reasoning'],
          },
        },
      ],
    };

    return this.invokeModel(request);
  }

  async detectOpportunities(marketData: any[], strategies: string[]): Promise<any> {
    const prompt = this.buildOpportunityDetectionPrompt(marketData, strategies);
    
    const request: BedrockRequest = {
      modelId: config.aws.bedrockModelId,
      prompt,
      maxTokens: 1200,
      temperature: 0.3,
      tools: [
        {
          name: 'opportunity_detection',
          description: 'Detect trading opportunities based on market analysis',
          inputSchema: {
            type: 'object',
            properties: {
              opportunities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    symbol: { type: 'string' },
                    strategy: { type: 'string' },
                    action: { type: 'string', enum: ['buy', 'sell'] },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    entry_price: { type: 'number' },
                    target_price: { type: 'number' },
                    stop_loss: { type: 'number' },
                    reasoning: { type: 'string' },
                  },
                  required: ['symbol', 'strategy', 'action', 'confidence', 'reasoning'],
                },
              },
              market_outlook: { type: 'string' },
              overall_confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['opportunities', 'market_outlook', 'overall_confidence'],
          },
        },
      ],
    };

    return this.invokeModel(request);
  }

  /**
   * Lightweight helper used in the MVP to fulfil the hackathon "AWS Bedrock" prize track.
   * It asks the model for a single compact trading decision and expects the tool to
   * return a JSON payload shaped as:
   *   {
   *     "symbol": "BTC",
   *     "side": "BUY",   // or SELL
   *     "confidence": 0.76
   *   }
   * No additional fields should be present so that the client can parse it directly.
   */
  async generateAgentDecision(symbol: string): Promise<any> {
    const prompt = `You are an expert crypto trader.  Given the symbol ${symbol}, output a JSON object with exactly three keys: symbol, side (BUY or SELL), and confidence (0-1).  Only output JSON, nothing else.`;

    const request: BedrockRequest = {
      modelId: config.aws.bedrockModelId,
      prompt,
      maxTokens: 100,
      temperature: 0.1,
      tools: [
        {
          name: 'simple_decision',
          description: 'Return a minimalist trading decision',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              side: { type: 'string', enum: ['BUY', 'SELL'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['symbol', 'side', 'confidence'],
          },
        },
      ],
    };

    return this.invokeModel(request);
  }

  private async invokeModel(request: BedrockRequest): Promise<any> {
    try {
      const input = {
        modelId: request.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          tools: request.tools,
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      logger.info('Bedrock analysis completed', {
        modelId: request.modelId,
        inputTokens: responseBody.usage?.input_tokens,
        outputTokens: responseBody.usage?.output_tokens,
      });

      return responseBody;
    } catch (error) {
      logger.error('Bedrock analysis failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildMarketSentimentPrompt(marketData: any): string {
    return `
As an expert crypto market analyst, analyze the following market data and provide a comprehensive sentiment analysis:

Market Data:
${JSON.stringify(marketData, null, 2)}

Please provide:
1. Overall market sentiment (bullish, bearish, or neutral)
2. Confidence level in your analysis (0-1)
3. Trading recommendation (buy, sell, hold)
4. Detailed reasoning for your assessment
5. Risk level associated with current market conditions

Consider factors such as:
- Price movements and trends
- Trading volume patterns
- Market volatility
- Support and resistance levels
- Overall crypto market sentiment
- External market factors

Use the market_analysis tool to structure your response.
    `.trim();
  }

  private buildPricePredictionPrompt(symbol: string, historicalData: any[], timeframe: string): string {
    return `
As an expert quantitative analyst, predict the future price movement for ${symbol} over the ${timeframe} timeframe.

Historical Data:
${JSON.stringify(historicalData.slice(-20), null, 2)}

Please provide:
1. Predicted price target
2. Confidence level in your prediction (0-1)
3. Expected direction (up, down, sideways)
4. Key support and resistance levels
5. Detailed reasoning based on technical and fundamental analysis

Consider:
- Technical indicators and patterns
- Historical price movements
- Market trends and cycles
- Volume analysis
- Market structure

Use the price_prediction tool to structure your response.
    `.trim();
  }

  private buildRiskAssessmentPrompt(portfolioData: any, marketConditions: any): string {
    return `
As a professional risk manager, assess the risk profile of the following portfolio:

Portfolio Data:
${JSON.stringify(portfolioData, null, 2)}

Market Conditions:
${JSON.stringify(marketConditions, null, 2)}

Please provide:
1. Overall risk score (0-10, where 10 is highest risk)
2. Risk level classification (low, medium, high)
3. Portfolio diversification score (0-10)
4. Specific risk management recommendations
5. Maximum recommended position size per trade
6. Detailed reasoning for your assessment

Consider:
- Portfolio concentration and diversification
- Correlation between assets
- Market volatility
- Liquidity risks
- Historical drawdowns
- Current market conditions

Use the risk_assessment tool to structure your response.
    `.trim();
  }

  private buildOpportunityDetectionPrompt(marketData: any[], strategies: string[]): string {
    return `
As an expert trading strategist, analyze the current market data to identify trading opportunities using the specified strategies.

Market Data:
${JSON.stringify(marketData, null, 2)}

Available Strategies: ${strategies.join(', ')}

Please identify and analyze:
1. Specific trading opportunities for each relevant symbol
2. Recommended strategy for each opportunity
3. Entry, target, and stop-loss levels
4. Confidence level for each opportunity
5. Overall market outlook
6. Reasoning for each recommendation

Consider:
- Technical analysis patterns
- Market momentum
- Volume analysis
- Risk-reward ratios
- Market correlation
- Strategy-specific indicators

Use the opportunity_detection tool to structure your response.
    `.trim();
  }
} 