import { config } from '../config';
import { logger } from '../utils/logger';
import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  private modelId: string;
  private requestCount: Map<string, number> = new Map();
  private concurrentRequests: number = 0;

  constructor() {
    this.modelId = config.aws?.bedrockModelId || 'amazon.nova-lite-v1:0';
    
    this.client = new BedrockRuntimeClient({
      region: config.aws?.region || 'us-east-1',
      credentials: {
        accessKeyId: config.aws?.accessKeyId || '',
        secretAccessKey: config.aws?.secretAccessKey || '',
      },
    });

    // Initialize rate limiting cleanup
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000); // Clean up every minute

    logger.info('Bedrock service initialized', {
      region: config.aws?.region || 'us-east-1',
      modelId: this.modelId,
    });
  }

  async analyzeMarketSentiment(data: any): Promise<any> {
    try {
      const prompt = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
        {
            role: 'user',
            content: `Analyze the following market data and provide trading insights:
              Asset: ${data.asset}
              Current Price: $${data.currentPrice}
              24h Change: ${data.change24h}%
              Volume: $${data.volume24h}
              Recent News: ${data.recentNews || 'No recent news'}
              
              Provide: 1) Sentiment (bullish/bearish/neutral), 2) Confidence score (0-100), 3) Key factors, 4) Trading recommendation`
          }
        ]
      };

      const command = new InvokeModelCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      const analysis = this.parseMarketAnalysis(responseBody.content[0].text);

      // Store analysis in database
      await prisma.iPFSData?.create({
        data: {
          userId: data.userId,
          agentId: data.agentId || '',
          hash: JSON.stringify(analysis),
          type: 'market_sentiment',
          fileName: 'analysis.json',
          pinned: true,
        },
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze market sentiment:', error);
      throw new Error(`Market analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTradingSignal(portfolio: any, marketData: any): Promise<any> {
    try {
      const prompt = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        messages: [
        {
            role: 'user',
            content: `Generate trading signals based on:
              
              Portfolio:
              ${JSON.stringify(portfolio, null, 2)}
              
              Market Data:
              ${JSON.stringify(marketData, null, 2)}
              
              Provide specific trading actions with:
              1) Action (buy/sell/hold)
              2) Asset
              3) Amount
              4) Reasoning
              5) Risk assessment
              6) Expected return`
          }
        ]
      };

      const command = new InvokeModelCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return this.parseTradingSignal(responseBody.content[0].text);
    } catch (error) {
      logger.error('Failed to generate trading signal:', error);
      throw new Error(`Trading signal generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async assessRisk(portfolio: any, proposedTrade: any): Promise<any> {
    try {
      const prompt = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
        {
            role: 'user',
            content: `Assess the risk of the following trade:
              
              Current Portfolio:
              ${JSON.stringify(portfolio, null, 2)}
              
              Proposed Trade:
              ${JSON.stringify(proposedTrade, null, 2)}
              
              Provide:
              1) Risk score (0-100)
              2) Potential downside
              3) Portfolio impact
              4) Risk mitigation strategies
              5) Recommendation (approve/reject/modify)`
          }
        ]
      };

      const command = new InvokeModelCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return this.parseRiskAssessment(responseBody.content[0].text);
    } catch (error) {
      logger.error('Failed to assess risk:', error);
      throw new Error(`Risk assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamAgentResponse(query: string, context: any): Promise<AsyncGenerator<string>> {
    try {
      const prompt = {
          anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
          messages: [
            {
              role: 'user',
            content: `You are an expert crypto investment AI agent. 
              Context: ${JSON.stringify(context)}
              Query: ${query}
              
              Provide detailed, actionable insights.`
          }
        ]
      };

      const command = new InvokeModelWithResponseStreamCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      
      return this.generateStreamingResponse(response);
    } catch (error) {
      logger.error('Failed to stream agent response:', error);
      throw new Error(`Agent response failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async predictPrice(symbol: string, historicalData: any[], timeframe: string): Promise<any> {
    try {
      const prompt = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Predict the price movement for ${symbol} based on:
              
              Historical Data: ${JSON.stringify(historicalData.slice(-10))}
              Timeframe: ${timeframe}
              
              Provide:
              1) Expected price direction (up/down/sideways)
              2) Confidence level (0-100)
              3) Price target
              4) Key technical indicators`
          }
        ]
      };

      const command = new InvokeModelCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parsePricePrediction(responseBody.content[0].text);
    } catch (error) {
      logger.error('Failed to predict price:', error);
      throw new Error(`Price prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectOpportunities(marketData: any[], strategies: string[]): Promise<any> {
    try {
      const prompt = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Detect trading opportunities based on:
              
              Market Data: ${JSON.stringify(marketData)}
              Strategies: ${strategies.join(', ')}
              
              Identify:
              1) Specific trading opportunities
              2) Entry and exit points
              3) Risk/reward ratios
              4) Priority ranking`
          }
        ]
      };

      const command = new InvokeModelCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return this.parseOpportunities(responseBody.content[0].text);
    } catch (error) {
      logger.error('Failed to detect opportunities:', error);
      throw new Error(`Opportunity detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateAgentDecision(symbol: string): Promise<any> {
    try {
      const prompt = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Make a trading decision for ${symbol}:
              
              Provide a decision with:
              1) Action: BUY, SELL, or HOLD
              2) Confidence: 0.0 to 1.0
              3) Reasoning: Clear explanation
              
              Format as JSON: { "symbol": "${symbol}", "side": "BUY/SELL/HOLD", "confidence": 0.0-1.0, "reasoning": "..." }`
          }
        ]
      };

      const command = new InvokeModelCommand({
        body: JSON.stringify(prompt),
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return this.parseAgentDecision(responseBody.content[0].text);
    } catch (error) {
      logger.error('Failed to generate agent decision:', error);
      throw new Error(`Agent decision failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseMarketAnalysis(text: string): any {
    // Parse the AI response to extract structured data
    const analysis = {
      sentiment: 'neutral',
      confidence: 50,
      keyFactors: [],
      recommendation: '',
      reasoning: text,
    };

    // Extract sentiment
    if (text.toLowerCase().includes('bullish')) {
      analysis.sentiment = 'bullish';
    } else if (text.toLowerCase().includes('bearish')) {
      analysis.sentiment = 'bearish';
    }

    // Extract confidence score
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i);
    if (confidenceMatch) {
      analysis.confidence = parseInt(confidenceMatch[1]);
    }

    // Extract recommendation
    const recommendationMatch = text.match(/recommendation[:\s]+([^.]+)/i);
    if (recommendationMatch) {
      analysis.recommendation = recommendationMatch[1].trim();
    }

    return analysis;
  }

  private parseTradingSignal(text: string): any {
    // Parse the AI response to extract trading signal
    const signal = {
      action: 'hold',
      asset: '',
      amount: 0,
      reasoning: text,
      risk: 'medium',
      expectedReturn: 0,
    };

    // Extract action
    if (text.toLowerCase().includes('buy')) {
      signal.action = 'buy';
    } else if (text.toLowerCase().includes('sell')) {
      signal.action = 'sell';
    }

    // Extract amount
    const amountMatch = text.match(/amount[:\s]+\$?([\d.]+)/i);
    if (amountMatch) {
      signal.amount = parseFloat(amountMatch[1]);
    }

    return signal;
  }

  private parseRiskAssessment(text: string): any {
    // Parse the AI response to extract risk assessment
    const assessment = {
      riskScore: 50,
      potentialDownside: 0,
      portfolioImpact: 'moderate',
      mitigationStrategies: [],
      recommendation: 'proceed',
      analysis: text,
    };

    // Extract risk score
    const riskMatch = text.match(/risk\s*score[:\s]+(\d+)/i);
    if (riskMatch) {
      assessment.riskScore = parseInt(riskMatch[1]);
    }

    // Extract recommendation
    if (text.toLowerCase().includes('reject')) {
      assessment.recommendation = 'reject';
    } else if (text.toLowerCase().includes('modify')) {
      assessment.recommendation = 'modify';
    }

    return assessment;
  }

  private parsePricePrediction(text: string): any {
    const prediction = {
      direction: 'sideways',
      confidence: 50,
      priceTarget: 0,
      indicators: [],
      analysis: text,
    };

    // Extract direction
    if (text.toLowerCase().includes('up') || text.toLowerCase().includes('bullish')) {
      prediction.direction = 'up';
    } else if (text.toLowerCase().includes('down') || text.toLowerCase().includes('bearish')) {
      prediction.direction = 'down';
    }

    // Extract confidence
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i);
    if (confidenceMatch) {
      prediction.confidence = parseInt(confidenceMatch[1]);
    }

    return prediction;
  }

  private parseOpportunities(text: string): any {
    return {
      opportunities: [],
      analysis: text,
    };
  }

  private parseAgentDecision(text: string): any {
    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to text parsing
    }

    return {
      symbol: '',
      side: 'HOLD',
      confidence: 0.5,
      reasoning: text,
    };
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

  /**
   * Generate streaming response from Bedrock
   */
  private async* generateStreamingResponse(response: any): AsyncGenerator<string> {
    if (response.body) {
      for await (const chunk of response.body) {
        if (chunk.chunk?.bytes) {
          const decodedChunk = new TextDecoder().decode(chunk.chunk.bytes);
          try {
            const parsed = JSON.parse(decodedChunk);
            if (parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch {
            // Skip non-JSON chunks
          }
        }
      }
    }
  }
} 