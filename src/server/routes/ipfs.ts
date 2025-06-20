import { Router } from 'express';
import { PinataService } from '../services/PinataService';
import { logger } from '../utils/logger';
import { db } from '../database';

const router = Router();
const pinataService = new PinataService();

// Get user's IPFS data
router.get('/data', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { type } = req.query;
    const ipfsData = await pinataService.getUserIPFSData(userId, type as string);

    res.json({
      success: true,
      data: ipfsData,
    });
  } catch (error) {
    logger.error('Failed to get IPFS data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve IPFS data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Retrieve specific IPFS data by hash
router.get('/retrieve/:hash', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { hash } = req.params;

    const data = await pinataService.retrieveData(hash, userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Failed to retrieve IPFS data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Store performance data on IPFS
router.post('/store/performance', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { agentId, performance } = req.body;

    if (!agentId || !performance) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID and performance data are required',
      });
    }

    // Verify agent ownership
    const agent = await db.agent.findFirst({
      where: { id: agentId, ownerId: userId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found or access denied',
      });
    }

    const response = await pinataService.storePerformanceData(userId, agentId, performance);

    res.json({
      success: true,
      data: response,
      message: 'Performance data stored on IPFS successfully',
    });
  } catch (error) {
    logger.error('Failed to store performance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store performance data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create monetized access for IPFS data
router.post('/monetize', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { ipfsHash, price, description } = req.body;

    if (!ipfsHash || !price || !description) {
      return res.status(400).json({
        success: false,
        error: 'IPFS hash, price, and description are required',
      });
    }

    // Verify user owns this data
    const ipfsData = await db.ipfsData.findFirst({
      where: { hash: ipfsHash, userId },
    });

    if (!ipfsData) {
      return res.status(404).json({
        success: false,
        error: 'IPFS data not found or access denied',
      });
    }

    const response = await pinataService.createMonetizedAccess(ipfsHash, price, description);

    res.json({
      success: true,
      data: response,
      message: 'Monetized access created successfully',
    });
  } catch (error) {
    logger.error('Failed to create monetized access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create monetized access',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Upload file to IPFS
router.post('/upload', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // This would typically handle file uploads with multer
    // For demo purposes, we'll create a sample file
    const sampleData = {
      userId,
      timestamp: new Date().toISOString(),
      type: 'demo_upload',
      content: 'This is a demonstration of IPFS file upload capability',
    };

    const buffer = Buffer.from(JSON.stringify(sampleData, null, 2));
    const fileName = `demo_${userId}_${Date.now()}.json`;

    const response = await pinataService.uploadFile(buffer, fileName);

    // Store reference in database
    await db.ipfsData.create({
      data: {
        userId,
        hash: response.IpfsHash,
        fileName,
        fileSize: buffer.length,
        pinSize: response.PinSize,
        metadata: JSON.stringify({
          type: 'demo_upload',
          description: 'Demo file upload',
        }),
      },
    });

    res.json({
      success: true,
      data: response,
      message: 'File uploaded to IPFS successfully',
    });
  } catch (error) {
    logger.error('Failed to upload file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test Pinata connection
router.get('/test', async (req, res) => {
  try {
    const isConnected = await pinataService.testConnection();

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Pinata connection successful' : 'Pinata connection failed',
    });
  } catch (error) {
    logger.error('Pinata connection test failed:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 