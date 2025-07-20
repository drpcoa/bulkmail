import axios from 'axios';
import { config } from '../config';
import { IEmailProvider, EmailOptions, EmailResponse } from './email.provider.interface';

export class MailcowProvider implements IEmailProvider {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    if (!config.mailcow.apiKey || !config.mailcow.apiUrl) {
      throw new Error('Mailcow configuration is missing');
    }
    this.apiKey = config.mailcow.apiKey;
    this.apiUrl = config.mailcow.apiUrl;
  }

  getProviderName(): string {
    return 'mailcow';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      
      const response = await axios.post(
        `${this.apiUrl}/api/v1/send/mail`,
        {
          mailcow_recipients: to,
          mailcow_subject: options.subject,
          mailcow_body: options.html || options.text,
          mailcow_mail_from: options.from || config.mailcow.sender,
          mailcow_reply_to: options.replyTo || options.from || config.mailcow.sender,
          mailcow_headers: {},
          mailcow_attachments: options.attachments?.map(attachment => ({
            filename: attachment.filename,
            content: attachment.content.toString('base64'),
            content_type: attachment.contentType || 'application/octet-stream'
          }))
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.some((item: any) => item.type === 'success')) {
        return {
          success: true,
          messageId: response.data[0].id,
          provider: this.getProviderName(),
        };
      }

      throw new Error('Failed to send email via Mailcow');
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send email via Mailcow',
        provider: this.getProviderName(),
      };
    }
  }
}
