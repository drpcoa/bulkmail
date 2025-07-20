export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResponse>;
  getProviderName(): string;
}
