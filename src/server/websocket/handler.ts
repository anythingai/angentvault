import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { WebSocketMessage, WebSocketEventType } from '../../types';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  agentIds?: string[];
  isAlive?: boolean;
}

// Store active connections
const connections = new Map<string, ExtendedWebSocket>();

export function wsHandler(ws: ExtendedWebSocket, req: any) {
  logger.info('New WebSocket connection established');
  
  // Set connection as alive
  ws.isAlive = true;
  
  // Handle heartbeat
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      await handleMessage(ws, message);
    } catch (error) {
      logger.error('WebSocket message parsing error:', error);
      sendError(ws, 'Invalid message format');
    }
  });

  // Handle connection close
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
    if (ws.userId) {
      connections.delete(ws.userId);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  // Send welcome message
  sendMessage(ws, {
    type: 'connection_established',
    payload: {
      message: 'Connected to AgentVault WebSocket',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  });
}

async function handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
  switch (message.type) {
    case 'authenticate':
      await handleAuthentication(ws, message.payload);
      break;
      
    case 'subscribe_agent':
      await handleAgentSubscription(ws, message.payload);
      break;
      
    case 'unsubscribe_agent':
      await handleAgentUnsubscription(ws, message.payload);
      break;
      
    case 'ping':
      sendMessage(ws, {
        type: 'pong',
        payload: { timestamp: new Date() },
        timestamp: new Date(),
      });
      break;
      
    default:
      logger.warn('Unknown WebSocket message type:', message.type);
      sendError(ws, `Unknown message type: ${message.type}`);
  }
}

async function handleAuthentication(ws: ExtendedWebSocket, payload: any) {
  try {
    // In a real implementation, you'd verify the JWT token
    const { token, userId } = payload;
    
    if (!token || !userId) {
      sendError(ws, 'Authentication failed: Missing token or userId');
      return;
    }

    // Store user connection
    ws.userId = userId;
    connections.set(userId, ws);

    sendMessage(ws, {
      type: 'authenticated',
      payload: {
        userId,
        message: 'Authentication successful',
      },
      timestamp: new Date(),
    });

    logger.info('WebSocket authenticated:', { userId });
  } catch (error) {
    logger.error('WebSocket authentication error:', error);
    sendError(ws, 'Authentication failed');
  }
}

async function handleAgentSubscription(ws: ExtendedWebSocket, payload: any) {
  try {
    const { agentId } = payload;
    
    if (!agentId) {
      sendError(ws, 'Agent ID required for subscription');
      return;
    }

    if (!ws.agentIds) {
      ws.agentIds = [];
    }

    if (!ws.agentIds.includes(agentId)) {
      ws.agentIds.push(agentId);
    }

    sendMessage(ws, {
      type: 'agent_subscribed',
      payload: {
        agentId,
        message: `Subscribed to agent ${agentId} updates`,
      },
      timestamp: new Date(),
    });

    logger.info('Agent subscription added:', { userId: ws.userId, agentId });
  } catch (error) {
    logger.error('Agent subscription error:', error);
    sendError(ws, 'Failed to subscribe to agent');
  }
}

async function handleAgentUnsubscription(ws: ExtendedWebSocket, payload: any) {
  try {
    const { agentId } = payload;
    
    if (!agentId || !ws.agentIds) {
      sendError(ws, 'Invalid unsubscription request');
      return;
    }

    ws.agentIds = ws.agentIds.filter(id => id !== agentId);

    sendMessage(ws, {
      type: 'agent_unsubscribed',
      payload: {
        agentId,
        message: `Unsubscribed from agent ${agentId} updates`,
      },
      timestamp: new Date(),
    });

    logger.info('Agent subscription removed:', { userId: ws.userId, agentId });
  } catch (error) {
    logger.error('Agent unsubscription error:', error);
    sendError(ws, 'Failed to unsubscribe from agent');
  }
}

function sendMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: ExtendedWebSocket, error: string) {
  sendMessage(ws, {
    type: 'error',
    payload: { error, timestamp: new Date() },
    timestamp: new Date(),
  });
}

// Broadcast functions for different event types
export function broadcastAgentUpdate(agentId: string, data: any) {
  const message: WebSocketMessage = {
    type: WebSocketEventType.AGENT_STATUS_UPDATE,
    payload: { agentId, ...data },
    timestamp: new Date(),
  };

  connections.forEach((ws, userId) => {
    if (ws.agentIds?.includes(agentId)) {
      sendMessage(ws, message);
    }
  });
}

export function broadcastTradeExecuted(tradeData: any) {
  const message: WebSocketMessage = {
    type: WebSocketEventType.TRADE_EXECUTED,
    payload: tradeData,
    timestamp: new Date(),
  };

  connections.forEach((ws, userId) => {
    if (ws.agentIds?.includes(tradeData.agentId)) {
      sendMessage(ws, message);
    }
  });
}

export function broadcastMarketDataUpdate(marketData: any) {
  const message: WebSocketMessage = {
    type: WebSocketEventType.MARKET_DATA_UPDATE,
    payload: marketData,
    timestamp: new Date(),
  };

  connections.forEach((ws) => {
    sendMessage(ws, message);
  });
}

// Heartbeat to keep connections alive
setInterval(() => {
  connections.forEach((ws, userId) => {
    if (!ws.isAlive) {
      logger.info('Terminating inactive WebSocket connection:', { userId });
      connections.delete(userId);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // 30 seconds 