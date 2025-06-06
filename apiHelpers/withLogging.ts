import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import logger from './logger.js'; // include .js for consistency with project

export const withLogging = (handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const requestId = randomUUID();
    const startTime = Date.now();
    const endpoint = req.url?.split('/')?.[1] || 'unknown';

    // Log request
    logger.info('Request received', {
      requestId,
      method: req.method,
      url: req.url,
      endpoint,
      userId: req.headers.authorization ? 'authenticated' : 'anonymous',
      body: req.body
    });

    // Create wrapped response to capture status code
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      logger.info('Request completed', {
        requestId,
        statusCode: res.statusCode,
        duration: Date.now() - startTime,
        endpoint
      });
      return originalJson(body);
    };

    try {
      await handler(req, res);
    } catch (error: any) {
      logger.error('Request failed', {
        requestId,
        error: error.message,
        stack: error.stack,
        statusCode: error.status || 500,
        duration: Date.now() - startTime,
        endpoint
      });

      res.status(error.status || 500).json({ error: error.message });
    }
  };
};
