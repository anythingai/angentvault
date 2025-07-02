import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../../../server/config';
import { logger } from '../../../server/utils/logger';

const prisma = new PrismaClient();

interface AlertsResponse {
  success: boolean;
  alerts?: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    createdAt: string;
    isRead: boolean;
  }>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AlertsResponse>
) {
  try {
    // Extract and verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, config.security.jwtSecret) as any;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (req.method === 'GET') {
      // Fetch user's alerts
      const alerts = await prisma.alert.findMany({
        where: {
          userId: decoded.userId,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20, // Limit to 20 most recent alerts
      });

      const formattedAlerts = alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        severity: alert.severity as 'info' | 'warning' | 'error' | 'success',
        createdAt: alert.createdAt.toISOString(),
        isRead: alert.isRead,
      }));

      logger.info('Alerts fetched successfully', {
        userId: decoded.userId,
        alertCount: alerts.length
      });

      return res.status(200).json({
        success: true,
        alerts: formattedAlerts
      });

    } else if (req.method === 'POST') {
      // Create a new alert
      const { type, message, severity = 'info' } = req.body;

      if (!type || !message) {
        return res.status(400).json({
          success: false,
          error: 'Type and message are required'
        });
      }

      const alert = await prisma.alert.create({
        data: {
          userId: decoded.userId,
          type,
          message,
          severity,
          isRead: false,
        }
      });

      logger.info('Alert created successfully', {
        userId: decoded.userId,
        alertId: alert.id,
        type,
        severity
      });

      return res.status(201).json({
        success: true,
        alerts: [{
          id: alert.id,
          type: alert.type,
          message: alert.message,
          severity: alert.severity as 'info' | 'warning' | 'error' | 'success',
          createdAt: alert.createdAt.toISOString(),
          isRead: alert.isRead,
        }]
      });

    } else if (req.method === 'PUT') {
      // Mark alert(s) as read
      const { alertIds } = req.body;

      if (!alertIds || !Array.isArray(alertIds)) {
        return res.status(400).json({
          success: false,
          error: 'alertIds array is required'
        });
      }

      await prisma.alert.updateMany({
        where: {
          id: { in: alertIds },
          userId: decoded.userId,
        },
        data: {
          isRead: true,
        }
      });

      logger.info('Alerts marked as read', {
        userId: decoded.userId,
        alertIds
      });

      return res.status(200).json({
        success: true
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
    }

  } catch (error: unknown) {
    logger.error('Alerts API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 