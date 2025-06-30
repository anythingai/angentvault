import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import { logger } from '../utils/logger';
import { BedrockRequest } from '../../types';

/**
 * Bedrock Guardrails configuration for safe AI trading operations
 * This ensures the AI never makes harmful or inappropriate trading decisions
 */
const BEDROCK_GUARDRAILS = {
  guardrailIdentifier: 'trading-safety-guardrail',
  guardrailVersion: 'DRAFT',
  
  // Content filtering policies
  contentFilters: {
    illegalActivities: { threshold: 'HIGH' },
    harmfulContent: { threshold: 'MEDIUM' },
    inappropriateContent: { threshold: 'MEDIUM' },
  },
  
  // Denied topics for financial safety
  deniedTopics: [
    'pump and dump',
    'market manipulation',
    'insider trading',
    'ponzi scheme',
    'illegal activities',
    'money laundering',
  ],
};

/**
 * Rate limiting configuration for Bedrock API calls
 */
const RATE_LIMITS = {
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  maxConcurrentRequests: 10,
};

export class BedrockService {
  private client: BedrockRuntimeClient;
  private requestCount: Map<string, number> = new Map();
  private concurrentRequests: number = 0;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });

    // Initialize rate limiting cleanup
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000); // Clean up every minute

    logger.info('BedrockService initialized with guardrails and rate limiting');
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
    // Check rate limits before making the request
    await this.checkRateLimit('general');
    
    this.concurrentRequests++;
    
    try {
      // Apply content filtering for safety
      const safePrompt = this.applyContentFiltering(request.prompt);
      
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
              content: safePrompt,
            },
          ],
          tools: request.tools,
          // Include guardrails in the request
          guardrail_config: {
            guardrail_identifier: BEDROCK_GUARDRAILS.guardrailIdentifier,
            guardrail_version: BEDROCK_GUARDRAILS.guardrailVersion,
          },
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Post-process response for additional safety
      const safeResponse = this.postProcessResponse(responseBody);
      
      logger.info('Bedrock analysis completed with guardrails', {
        modelId: request.modelId,
        inputTokens: responseBody.usage?.input_tokens,
        outputTokens: responseBody.usage?.output_tokens,
        guardrailsApplied: true,
        contentFiltered: safePrompt !== request.prompt,
      });

      return safeResponse;
    } catch (error) {
      logger.error('Bedrock analysis failed:', error);
      
      // Return safe fallback response instead of throwing
      return this.getSafetyFallbackResponse();
    } finally {
      this.concurrentRequests--;
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

  /**
   * Check rate limits before making API calls
   */
  private async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);
    
    const minuteKey = `${operation}:${minute}`;
    const hourKey = `${operation}:${hour}`;
    
    const minuteCount = this.requestCount.get(minuteKey) || 0;
    const hourCount = this.requestCount.get(hourKey) || 0;
    
    if (minuteCount >= RATE_LIMITS.requestsPerMinute) {
      throw new Error(`Rate limit exceeded: ${RATE_LIMITS.requestsPerMinute} requests per minute`);
    }
    
    if (hourCount >= RATE_LIMITS.requestsPerHour) {
      throw new Error(`Rate limit exceeded: ${RATE_LIMITS.requestsPerHour} requests per hour`);
    }
    
    if (this.concurrentRequests >= RATE_LIMITS.maxConcurrentRequests) {
      throw new Error(`Concurrent request limit exceeded: ${RATE_LIMITS.maxConcurrentRequests}`);
    }
    
    // Increment counters
    this.requestCount.set(minuteKey, minuteCount + 1);
    this.requestCount.set(hourKey, hourCount + 1);
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimits(): void {
    const now = Date.now();
    const oldestMinute = Math.floor(now / 60000) - 5; // Keep last 5 minutes
    const oldestHour = Math.floor(now / 3600000) - 2; // Keep last 2 hours
    
    for (const [key] of this.requestCount) {
      const [, timestamp] = key.split(':');
      const time = parseInt(timestamp);
      
      if (time < oldestMinute || time < oldestHour) {
        this.requestCount.delete(key);
      }
    }
  }

  /**
   * Apply content filtering to remove unsafe content
   */
  private applyContentFiltering(prompt: string): string {
    let filtered = prompt;
    
    // Remove denied topics
    for (const topic of BEDROCK_GUARDRAILS.deniedTopics) {
      const regex = new RegExp(topic, 'gi');
      filtered = filtered.replace(regex, '[FILTERED]');
    }
    
    // Add safety disclaimers
    filtered += '\n\nIMPORTANT: Provide responsible financial advice with appropriate risk warnings and regulatory compliance.';
    
    return filtered;
  }

  /**
   * Post-process responses to ensure safety
   */
  private postProcessResponse(response: any): any {
    if (response.content && Array.isArray(response.content)) {
      response.content = response.content.map((item: any) => {
        if (item.type === 'tool_use' && item.input) {
          // Add safety warnings to tool responses
          if (!item.input.risk_warning && !item.input.safety_warnings) {
            item.input.safety_warnings = [
              'This is not financial advice. Consult a professional advisor.',
              'Past performance does not guarantee future results.',
              'Only invest what you can afford to lose.',
            ];
          }
        }
        return item;
      });
    }
    
    return response;
  }

  /**
   * Return safe fallback response in case of errors
   */
  private getSafetyFallbackResponse(): any {
    return {
      content: [
        {
          type: 'tool_use',
          name: 'safety_fallback',
          input: {
            symbol: 'UNKNOWN',
            side: 'HOLD',
            confidence: 0.0,
            reasoning: 'Unable to provide analysis due to safety constraints or system error.',
            risk_warning: 'Trading involves significant risk. Please consult a financial advisor.',
            safety_warnings: [
              'System temporarily unavailable',
              'No trading recommendations at this time',
              'Please verify all information independently',
            ],
          },
        },
      ],
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    };
  }
} 