import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PinataUploadResponse } from '../../types';
import { db } from '../database';

export class PinataService {
  private client: AxiosInstance;
  private jwt: string;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'Authorization': `Bearer ${config.pinata.jwt}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.jwt = config.pinata.jwt;
  }

  async storeTradeHistory(userId: string, agentId: string, trades: any[]): Promise<PinataUploadResponse> {
    try {
      const tradeData = {
        userId,
        agentId,
        trades,
        timestamp: new Date().toISOString(),
        type: 'trade_history',
      };

      const response = await this.uploadJSON(tradeData, `trade_history_${agentId}_${Date.now()}`);
      
      // Store IPFS reference in database
      await db.ipfsData.create({
        data: {
          userId,
          hash: response.IpfsHash,
          fileName: `trade_history_${agentId}.json`,
          fileSize: JSON.stringify(tradeData).length,
          pinSize: response.PinSize,
          metadata: JSON.stringify({
            type: 'trade_history',
            agentId,
            tradesCount: trades.length,
          }),
        },
      });

      logger.info('Trade history stored on IPFS', {
        userId,
        agentId,
        ipfsHash: response.IpfsHash,
        tradesCount: trades.length,
      });

      return response;
    } catch (error) {
      logger.error('Failed to store trade history on IPFS:', error);
      throw new Error(`IPFS storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeAIAnalysis(userId: string, agentId: string, analysis: any): Promise<PinataUploadResponse> {
    try {
      const analysisData = {
        userId,
        agentId,
        analysis,
        timestamp: new Date().toISOString(),
        type: 'ai_analysis',
      };

      const response = await this.uploadJSON(analysisData, `ai_analysis_${agentId}_${Date.now()}`);

      await db.ipfsData.create({
        data: {
          userId,
          hash: response.IpfsHash,
          fileName: `ai_analysis_${agentId}.json`,
          fileSize: JSON.stringify(analysisData).length,
          pinSize: response.PinSize,
          metadata: JSON.stringify({
            type: 'ai_analysis',
            agentId,
            analysisType: analysis.type,
          }),
        },
      });

      logger.info('AI analysis stored on IPFS', {
        userId,
        agentId,
        ipfsHash: response.IpfsHash,
        analysisType: analysis.type,
      });

      return response;
    } catch (error) {
      logger.error('Failed to store AI analysis on IPFS:', error);
      throw new Error(`IPFS storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storePerformanceData(userId: string, agentId: string, performance: any): Promise<PinataUploadResponse> {
    try {
      const performanceData = {
        userId,
        agentId,
        performance,
        timestamp: new Date().toISOString(),
        type: 'performance_data',
      };

      const response = await this.uploadJSON(performanceData, `performance_${agentId}_${Date.now()}`);

      await db.ipfsData.create({
        data: {
          userId,
          hash: response.IpfsHash,
          fileName: `performance_${agentId}.json`,
          fileSize: JSON.stringify(performanceData).length,
          pinSize: response.PinSize,
          metadata: JSON.stringify({
            type: 'performance_data',
            agentId,
            totalReturn: performance.totalReturn,
          }),
        },
      });

      logger.info('Performance data stored on IPFS', {
        userId,
        agentId,
        ipfsHash: response.IpfsHash,
        totalReturn: performance.totalReturn,
      });

      return response;
    } catch (error) {
      logger.error('Failed to store performance data on IPFS:', error);
      throw new Error(`IPFS storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retrieveData(ipfsHash: string, userId?: string): Promise<any> {
    try {
      // Check if user has access to this data
      if (userId) {
        const ipfsRecord = await db.ipfsData.findFirst({
          where: {
            hash: ipfsHash,
            userId,
          },
        });

        if (!ipfsRecord) {
          throw new Error('Access denied or data not found');
        }
      }

      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      
      logger.info('Data retrieved from IPFS', {
        ipfsHash,
        userId,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve data from IPFS:', error);
      throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createMonetizedAccess(ipfsHash: string, price: number, description: string): Promise<any> {
    try {
      // Create monetized access record for pay-per-access data
      const accessData = {
        ipfsHash,
        price,
        description,
        accessCount: 0,
        createdAt: new Date().toISOString(),
      };

      const response = await this.uploadJSON(accessData, `monetized_access_${ipfsHash}`);

      logger.info('Monetized access created', {
        ipfsHash,
        price,
        accessHash: response.IpfsHash,
      });

      return response;
    } catch (error) {
      logger.error('Failed to create monetized access:', error);
      throw new Error(`Monetized access creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserIPFSData(userId: string, type?: string): Promise<any[]> {
    try {
      const whereClause: any = { userId };
      if (type) {
        whereClause.metadata = {
          contains: `"type":"${type}"`,
        };
      }

      const ipfsData = await db.ipfsData.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      logger.info('Retrieved user IPFS data', {
        userId,
        type,
        count: ipfsData.length,
      });

      return ipfsData;
    } catch (error) {
      logger.error('Failed to get user IPFS data:', error);
      throw new Error(`IPFS data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uploadJSON(data: any, name: string): Promise<PinataUploadResponse> {
    try {
      const response = await this.client.post('/pinning/pinJSONToIPFS', {
        pinataContent: data,
        pinataMetadata: {
          name,
          keyvalues: {
            timestamp: new Date().toISOString(),
            type: data.type || 'unknown',
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      });

      return {
        IpfsHash: response.data.IpfsHash,
        PinSize: response.data.PinSize,
        Timestamp: response.data.Timestamp,
      };
    } catch (error) {
      logger.error('Failed to upload JSON to IPFS:', error);
      throw new Error(`JSON upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadFile(file: Buffer, fileName: string): Promise<PinataUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('pinataMetadata', JSON.stringify({
        name: fileName,
        keyvalues: {
          timestamp: new Date().toISOString(),
        },
      }));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.jwt}`,
          },
          timeout: 60000, // 1 minute timeout for file uploads
        }
      );

      return {
        IpfsHash: response.data.IpfsHash,
        PinSize: response.data.PinSize,
        Timestamp: response.data.Timestamp,
      };
    } catch (error) {
      logger.error('Failed to upload file to IPFS:', error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePin(ipfsHash: string): Promise<boolean> {
    try {
      await this.client.delete(`/pinning/unpin/${ipfsHash}`);
      
      // Remove from database
      await db.ipfsData.deleteMany({
        where: { hash: ipfsHash },
      });

      logger.info('Pin deleted from IPFS', { ipfsHash });
      return true;
    } catch (error) {
      logger.error('Failed to delete pin from IPFS:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/data/testAuthentication');
      return response.status === 200;
    } catch (error) {
      logger.error('Pinata connection test failed:', error);
      return false;
    }
  }
} 