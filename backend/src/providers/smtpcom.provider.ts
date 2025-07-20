import axios from 'axios';
import { config } from '../config';
import { IEmailProvider, EmailOptions, EmailResponse } from './email.provider.interface';

export class SmtpComProvider implements IEmailProvider {
  private readonly apiKey: string;
  private readonly defaultSender: string;

  constructor() {
    if (!config.smtpcom.apiKey || !config.smtpcom.sender) {
      throw new Error('SMTP.com configuration is missing');
    }
    this.apiKey = config.smtpcom.apiKey;
    this.defaultSender = config.smtpcom.sender;
  }

  getProviderName(): string {
    return 'smtpcom';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      
      const response = await axios.post(
        'https://api.smtp.com/v4/messages',
        {
          channel: 'smtpcom',
          subject: options.subject,
          html: options.html,
          text: options.text,
          from: {
            name: 'BulkMail System',
            address: options.from || this.defaultSender,
          },
          to: to.map(email => ({ email })),
          ...(options.replyTo && {
            reply_to: {
              address: options.replyTo,
            },
          }),
          ...(options.attachments && {
            attachments: options.attachments.map(attachment => ({
              filename: attachment.filename,
              content: Buffer.isBuffer(attachment.content)
                ? attachment.content.toString('base64')
                : attachment.content,
              type: attachment.contentType || 'application/octet-stream',
              disposition: 'attachment',
            })),
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.data && response.data.data.message_id) {
        return {
          success: true,
          messageId: response.data.data.message_id,
          provider: this.getProviderName(),
        };
      }

      throw new Error('Failed to send email via SMTP.com');
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send email via SMTP.com',
        provider: this.getProviderName(),
      };
    }
  }
}
