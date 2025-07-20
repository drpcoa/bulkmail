import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { EmailEventType } from '../models/EmailEvent';

export class AnalyticsController {
  async handleWebhook(req: Request, res: Response) {
    const { type, messageId, details } = req.body;

    if (!type || !messageId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await analyticsService.trackEvent({
      type: type as EmailEventType,
      messageId,
      details,
    });

    res.status(200).send();
  }
}

export const analyticsController = new AnalyticsController();