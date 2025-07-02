import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import { logger } from '../utils/logger';
import { db } from '../database';

export class PinataService {
  private jwt: string;
  private gateway: string;

  constructor() {
    this.jwt = config.pinata.jwt || '';
    this.gateway = config.pinata.gateway || 'https://gateway.pinata.cloud';
  }

  async uploadJSON(data: Record<string, any>, fileName = 'data.json', agentId = 'default'): Promise<{ ipfsHash: string; url: string }> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataMetadata: { name: fileName },
          pinataContent: data,
        },
        {
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { IpfsHash } = response.data;
      const url = `${this.gateway}/ipfs/${IpfsHash}`;

      logger.info('Pinned JSON to IPFS', { IpfsHash });

      await db.iPFSData.create({
        data: {
          hash: IpfsHash,
          type: 'json',
          fileName,
          size: JSON.stringify(data).length,
          agentId,
        },
      });

      return { ipfsHash: IpfsHash, url };
    } catch (error) {
      logger.error('Failed to upload JSON to Pinata', error);
      throw new Error('Pinata upload failed');
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, agentId = 'default'): Promise<{ ipfsHash: string; url: string }> {
    try {
      const data = new FormData();
      data.append('file', buffer, { filename: fileName });

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          ...data.getHeaders(),
        },
      });

      const { IpfsHash } = response.data;
      const url = `${this.gateway}/ipfs/${IpfsHash}`;
      logger.info('Pinned file to IPFS', { IpfsHash });

      await db.iPFSData.create({
        data: {
          hash: IpfsHash,
          type: 'file',
          fileName,
          size: buffer.length,
          agentId,
        },
      });

      return { ipfsHash: IpfsHash, url };
    } catch (error) {
      logger.error('Failed to upload file to Pinata', error);
      throw new Error('Pinata upload failed');
    }
  }

  /**
   * Store agent state for persistence and auditability
   */
  async storeAgentState(agentId: string, state: any): Promise<{ ipfsHash: string; url: string }> {
    const agentStateData = {
      agentId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      state: {
        ...state,
        lastUpdated: new Date().toISOString(),
      },
      metadata: {
        type: 'agent_state',
        platform: 'AgentVault',
      },
    };

    return this.uploadJSON(agentStateData, `agent_state_${agentId}_${Date.now()}.json`, agentId);
  }

  /**
   * Store trading history for agent performance tracking
   */
  async storeTradingHistory(agentId: string, trades: any[]): Promise<{ ipfsHash: string; url: string }> {
    const tradingHistoryData = {
      agentId,
      timestamp: new Date().toISOString(),
      totalTrades: trades.length,
      trades: trades.map(trade => ({
        ...trade,
        storedAt: new Date().toISOString(),
      })),
      metadata: {
        type: 'trading_history',
        platform: 'AgentVault',
      },
    };

    const result = await this.uploadJSON(tradingHistoryData, `trading_history_${agentId}_${Date.now()}.json`, agentId);
    await db.iPFSData.update({ where: { hash: result.ipfsHash }, data: { agentId, type: 'TRADING_HISTORY' }});
    return result;
  }

  /**
   * Store AI analysis results for transparency and auditability
   */
  async storeAIAnalysis(agentId: string, analysis: any): Promise<{ ipfsHash: string; url: string }> {
    const analysisData = {
      agentId,
      timestamp: new Date().toISOString(),
      analysis: {
        ...analysis,
        storedAt: new Date().toISOString(),
      },
      metadata: {
        type: 'ai_analysis',
        platform: 'AgentVault',
        model: config.aws.bedrockModelId,
      },
    };

    return this.uploadJSON(analysisData, `ai_analysis_${agentId}_${Date.now()}.json`, agentId);
  }

  /**
   * Store agent performance metrics
   */
  async storePerformanceMetrics(agentId: string, metrics: any): Promise<{ ipfsHash: string; url: string }> {
    const metricsData = {
      agentId,
      timestamp: new Date().toISOString(),
      metrics: {
        ...metrics,
        calculatedAt: new Date().toISOString(),
      },
      metadata: {
        type: 'performance_metrics',
        platform: 'AgentVault',
      },
    };

    const result = await this.uploadJSON(metricsData, `performance_metrics_${agentId}_${Date.now()}.json`, agentId);
    await db.iPFSData.update({ where: { hash: result.ipfsHash }, data: { agentId, type: 'PERFORMANCE_METRICS' }});
    return result;
  }

  /**
   * Store agent configuration for version control
   */
  async storeAgentConfig(agentId: string, config: any): Promise<{ ipfsHash: string; url: string }> {
    const configData = {
      agentId,
      timestamp: new Date().toISOString(),
      version: config.version || '1.0',
      configuration: {
        ...config,
        storedAt: new Date().toISOString(),
      },
      metadata: {
        type: 'agent_configuration',
        platform: 'AgentVault',
      },
    };

    return this.uploadJSON(configData, `agent_config_${agentId}_v${config.version || '1.0'}.json`, agentId);
  }

  /**
   * Store monetization records for revenue tracking
   */
  async storeMonetizationRecord(agentId: string, record: any): Promise<{ ipfsHash: string; url: string }> {
    const monetizationData = {
      agentId,
      timestamp: new Date().toISOString(),
      record: {
        ...record,
        storedAt: new Date().toISOString(),
      },
      metadata: {
        type: 'monetization_record',
        platform: 'AgentVault',
        paymentProtocol: 'x402pay',
      },
    };
    
    const result = await this.uploadJSON(monetizationData, `monetization_${agentId}_${Date.now()}.json`, agentId);
    await db.iPFSData.update({ where: { hash: result.ipfsHash }, data: { agentId, type: 'MONETIZATION_RECORD' }});
    return result;
  }

  /**
   * Retrieve data from IPFS using hash
   */
  async retrieveFromIPFS(ipfsHash: string): Promise<any> {
    try {
      const response = await axios.get(`${this.gateway}/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve from IPFS', { ipfsHash, error });
      throw new Error('IPFS retrieval failed');
    }
  }

  /**
   * Create a comprehensive agent audit trail
   */
  async createAuditTrail(agentId: string, events: any[]): Promise<{ ipfsHash: string; url: string }> {
    const auditData = {
      agentId,
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      events: events.map((event, index) => ({
        index,
        ...event,
        recordedAt: new Date().toISOString(),
      })),
      metadata: {
        type: 'audit_trail',
        platform: 'AgentVault',
        immutable: true,
      },
    };

    const result = await this.uploadJSON(auditData, `audit_trail_${agentId}_${Date.now()}.json`, agentId);
    await db.iPFSData.update({ where: { hash: result.ipfsHash }, data: { agentId, type: 'AUDIT_TRAIL' }});
    return result;
  }

  /**
   * Store agent strategy backtesting results
   */
  async storeBacktestResults(agentId: string, results: any): Promise<{ ipfsHash: string; url: string }> {
    const backtestData = {
      agentId,
      timestamp: new Date().toISOString(),
      results: {
        ...results,
        completedAt: new Date().toISOString(),
      },
      metadata: {
        type: 'backtest_results',
        platform: 'AgentVault',
      },
    };

    const result = await this.uploadJSON(backtestData, `backtest_${agentId}_${Date.now()}.json`, agentId);
    await db.iPFSData.update({ where: { hash: result.ipfsHash }, data: { agentId, type: 'BACKTEST_RESULTS' }});
    return result;
  }
} 