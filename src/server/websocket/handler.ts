import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { verifyToken } from '../middleware/auth';
import { MarketDataService } from '../services/MarketDataService';

interface WebSocketClient {
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

export class WebSocketHandler {
  private clients: Map<WebSocket, WebSocketClient> = new Map();
  private marketDataService: MarketDataService;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.marketDataService = new MarketDataService();
  }

  async initialize(): Promise<void> {
    // Initialize market data service
    await this.marketDataService.initialize();

    // Set up event listeners for market data updates
    this.marketDataService.on('ticker', (data) => {
      this.broadcastMarketData('ticker', data);
    });

    this.marketDataService.on('orderbook', (data) => {
      this.broadcastMarketData('orderbook', data);
    });

    this.marketDataService.on('trade', (data) => {
      this.broadcastMarketData('trade', data);
    });

    // Start ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000);

    logger.info('WebSocket handler initialized');
  }

  async shutdown(): Promise<void> {
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all client connections
    for (const [ws] of this.clients) {
      ws.close(1001, 'Server shutting down');
    }
    this.clients.clear();

    // Shutdown market data service
    await this.marketDataService.shutdown();

    logger.info('WebSocket handler shutdown complete');
  }

  handleConnection(ws: WebSocket, _request: any): void {
    const client: WebSocketClient = {
      ws,
      subscriptions: new Set(),
      isAlive: true,
    };

    this.clients.set(ws, client);
    logger.info('New WebSocket connection established');

    // Send welcome message
    this.sendMessage(ws, {
      type: 'welcome',
      payload: {
        message: 'Connected to AgentVault WebSocket',
        timestamp: new Date().toISOString(),
      },
    });

    // Set up event handlers
    ws.on('message', async (message: Buffer) => {
      await this.handleMessage(ws, message);
    });

    ws.on('pong', () => {
      const client = this.clients.get(ws);
      if (client) {
        client.isAlive = true;
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: Buffer): Promise<void> {
    try {
      const data = JSON.parse(message.toString());
      const client = this.clients.get(ws);

      if (!client) {
        return;
      }

      switch (data.type) {
        case 'auth':
          await this.handleAuth(ws, data.payload);
          break;

        case 'subscribe':
          this.handleSubscribe(ws, data.payload);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, data.payload);
          break;

        case 'ping':
          this.sendMessage(ws, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      logger.error('Failed to handle WebSocket message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  private async handleAuth(ws: WebSocket, payload: any): Promise<void> {
    try {
      const { token } = payload;
      const decoded = await verifyToken(token);
      
      const client = this.clients.get(ws);
      if (client && decoded) {
        client.userId = decoded.userId;
        
        this.sendMessage(ws, {
          type: 'auth_success',
          payload: {
            userId: decoded.userId,
            message: 'Authentication successful',
          },
        });

        // Subscribe to user-specific events
        client.subscriptions.add(`user:${decoded.userId}`);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  private handleSubscribe(ws: WebSocket, payload: any): void {
    const client = this.clients.get(ws);
    if (!client) return;

    const { channels } = payload;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.add(channel);
        logger.info(`Client subscribed to channel: ${channel}`);
      });

      this.sendMessage(ws, {
        type: 'subscribed',
        payload: { channels },
      });
    }
  }

  private handleUnsubscribe(ws: WebSocket, payload: any): void {
    const client = this.clients.get(ws);
    if (!client) return;

    const { channels } = payload;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.delete(channel);
        logger.info(`Client unsubscribed from channel: ${channel}`);
      });

      this.sendMessage(ws, {
        type: 'unsubscribed',
        payload: { channels },
      });
    }
  }

  private handleDisconnection(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      logger.info('WebSocket connection closed', { userId: client.userId });
      this.clients.delete(ws);
    }
  }

  private pingClients(): void {
    for (const [ws, client] of this.clients) {
      if (!client.isAlive) {
        ws.terminate();
        this.clients.delete(ws);
        continue;
      }

      client.isAlive = false;
      ws.ping();
    }
  }

  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      payload: { error },
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast methods for different event types
  broadcastAgentUpdate(agentId: string, update: any): void {
    const message = {
      type: 'agent_update',
      payload: { agentId, ...update },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`agent:${agentId}`, message);
  }

  broadcastTradeExecution(userId: string, trade: any): void {
    const message = {
      type: 'trade_executed',
      payload: trade,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`user:${userId}`, message);
  }

  broadcastMarketData(type: string, data: any): void {
    const message = {
      type: `market_${type}`,
      payload: data,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all clients subscribed to market data
    this.broadcastToChannel('market:all', message);
    
    // Also broadcast to symbol-specific channels
    if (data.symbol) {
      this.broadcastToChannel(`market:${data.symbol}`, message);
    }
  }

  broadcastBalanceUpdate(userId: string, balance: any): void {
    const message = {
      type: 'balance_update',
      payload: balance,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`user:${userId}`, message);
  }

  private broadcastToChannel(channel: string, message: any): void {
    let count = 0;
    
    for (const [ws, client] of this.clients) {
      if (client.subscriptions.has(channel) || client.subscriptions.has('*')) {
        this.sendMessage(ws, message);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(`Broadcast to ${count} clients on channel: ${channel}`);
    }
  }

  // Public method to get connection statistics
  getStats(): any {
    const stats = {
      totalConnections: this.clients.size,
      authenticatedConnections: 0,
      channelSubscriptions: new Map<string, number>(),
    };

    for (const client of this.clients.values()) {
      if (client.userId) {
        stats.authenticatedConnections++;
      }

      for (const channel of client.subscriptions) {
        const count = stats.channelSubscriptions.get(channel) || 0;
        stats.channelSubscriptions.set(channel, count + 1);
      }
    }

    return {
      ...stats,
      channelSubscriptions: Object.fromEntries(stats.channelSubscriptions),
    };
  }
}

// Create singleton instance
const wsHandlerInstance = new WebSocketHandler();

// Export the connection handler function
export function wsHandler(ws: WebSocket, request: any): void {
  wsHandlerInstance.handleConnection(ws, request);
}

// Export the handler instance for use in other parts of the application
export { wsHandlerInstance as websocketHandler }; 