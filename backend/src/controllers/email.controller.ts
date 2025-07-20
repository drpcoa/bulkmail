import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { emailService } from '../services/email.service';
import { EmailOptions } from '../providers/email.provider.interface';
import { logger } from '../utils/logger';

export class EmailController {
  /**
   * Send a single email
   */
  async sendEmail(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, subject, text, html, from, replyTo, attachments, provider } = req.body;
      
      const options: EmailOptions = {
        to,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        ...(from && { from }),
        ...(replyTo && { replyTo }),
        ...(attachments && { attachments }),
      };

      logger.info(`Sending email to ${to} via ${provider || 'default provider'}`);
      const result = await emailService.sendEmail(options, provider);
      
      if (result.success) {
        logger.info(`Email sent successfully with ID: ${result.messageId}`);
        return res.status(200).json({
          success: true,
          message: 'Email sent successfully',
          data: result,
        });
      } else {
        logger.error(`Failed to send email: ${result.error}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to send email',
          error: result.error,
          provider: result.provider,
        });
      }
    } catch (error: any) {
      logger.error(`Error in sendEmail: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { emails, concurrency = 5, provider } = req.body;
      
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Emails array is required and must not be empty',
        });
      }

      logger.info(`Sending batch of ${emails.length} emails`);
      const results = await emailService.sendBatch(emails, concurrency, provider);
      
      const successCount = results.filter(r => r?.success).length;
      const errorCount = results.length - successCount;
      
      logger.info(`Batch send completed: ${successCount} succeeded, ${errorCount} failed`);
      
      return res.status(200).json({
        success: true,
        message: `Batch send completed: ${successCount} succeeded, ${errorCount} failed`,
        data: {
          total: results.length,
          success: successCount,
          failed: errorCount,
          results,
        },
      });
    } catch (error: any) {
      logger.error(`Error in sendBatch: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get available email providers
   */
  async getProviders(_req: Request, res: Response) {
    try {
      const providers = emailService.listProviders();
      const defaultProvider = emailService.getDefaultProvider();
      
      return res.status(200).json({
        success: true,
        data: {
          providers,
          defaultProvider,
        },
      });
    } catch (error: any) {
      logger.error(`Error in getProviders: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to get email providers',
        error: error.message,
      });
    }
  }

  /**
   * Set the default email provider
   */
  async setDefaultProvider(req: Request, res: Response) {
    try {
      const { provider } = req.body;
      
      if (!provider) {
        return res.status(400).json({
          success: false,
          message: 'Provider name is required',
        });
      }

      const success = emailService.setDefaultProvider(provider);
      
      if (success) {
        logger.info(`Default email provider set to: ${provider}`);
        return res.status(200).json({
          success: true,
          message: `Default email provider set to: ${provider}`,
          defaultProvider: provider,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid provider: ${provider}`,
          availableProviders: emailService.listProviders(),
        });
      }
    } catch (error: any) {
      logger.error(`Error in setDefaultProvider: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        message: 'Failed to set default email provider',
        error: error.message,
      });
    }
  }
}

export const emailController = new EmailController();
