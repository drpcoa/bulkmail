import axios from 'axios';
import { config } from '../config';
import { IEmailProvider, EmailOptions, EmailResponse } from './email.provider.interface';

export class ElasticEmailProvider implements IEmailProvider {
  private readonly apiKey: string;
  private readonly defaultFrom: string;

  constructor() {
    if (!config.elasticEmail.apiKey || !config.elasticEmail.from) {
      throw new Error('ElasticEmail configuration is missing');
    }
    this.apiKey = config.elasticEmail.apiKey;
    this.defaultFrom = config.elasticEmail.from;
  }

  getProviderName(): string {
    return 'elasticemail';
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const to = Array.isArray(options.to) ? options.to : [options.to];
      
      const formData = new URLSearchParams();
      formData.append('apikey', this.apiKey);
      formData.append('from', options.from || this.defaultFrom);
      formData.append('to', to.join(';'));
      formData.append('subject', options.subject);
      
      if (options.html) {
        formData.append('bodyHtml', options.html);
      }
      if (options.text) {
        formData.append('bodyText', options.text);
      }
      if (options.replyTo) {
        formData.append('replyTo', options.replyTo);
      }

      // Note: For attachments, you would need to use FormData and handle multipart/form-data
      // This is a simplified version without attachment support
      
      const response = await axios.post(
        'https://api.elasticemail.com/v2/email/send',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          messageId: response.data.data?.transactionid || '',
          provider: this.getProviderName(),
        };
      }

      throw new Error(response.data?.error || 'Failed to send email via ElasticEmail');
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to send email via ElasticEmail',
        provider: this.getProviderName(),
      };
    }
  }
}
