import { EmailOptions } from '../providers/email.provider.interface';
import { providerManager } from '../providers';

export class EmailService {
  /**
   * Send an email using the specified provider or the default one
   * @param options Email options
   * @param providerName Optional provider name (e.g., 'mailcow', 'smtpcom', 'elasticemail')
   * @returns Promise with the send result
   */
  async sendEmail(
    options: EmailOptions,
    providerName?: string
  ) {
    let provider = providerName 
      ? providerManager.getProvider(providerName)
      : providerManager.getDefaultProvider();

    if (!provider) {
      throw new Error('No email provider available');
    }

    try {
      const result = await provider.sendEmail(options);
      
      // If the send fails, try with another provider if available
      if (!result.success && !providerName) {
        const availableProviders = providerManager
          .listProviders()
          .filter(p => p !== provider?.getProviderName());
        
        for (const altProviderName of availableProviders) {
          const altProvider = providerManager.getProvider(altProviderName);
          if (altProvider) {
            console.log(`Retrying with provider: ${altProviderName}`);
            const retryResult = await altProvider.sendEmail(options);
            if (retryResult.success) {
              return retryResult;
            }
          }
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send a batch of emails
   * @param emails Array of email options
   * @param concurrency Number of concurrent sends (default: 5)
   * @param providerName Optional provider name
   * @returns Array of results
   */
  async sendBatch(
    emails: EmailOptions[],
    concurrency: number = 5,
    providerName?: string
  ) {
    const results = [];
    
    // Process emails in batches to avoid overwhelming the providers
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);
      const batchPromises = batch.map(email => 
        this.sendEmail(email, providerName)
          .catch(error => ({
            success: false,
            error: error.message,
            to: email.to,
            subject: email.subject,
          }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get list of available email providers
   * @returns Array of provider names
   */
  listProviders(): string[] {
    return providerManager.listProviders();
  }

  /**
   * Get the default provider name
   * @returns Provider name or undefined if none available
   */
  getDefaultProvider(): string | undefined {
    return providerManager.getDefaultProvider()?.getProviderName();
  }

  /**
   * Set the default email provider
   * @param providerName Name of the provider to set as default
   * @returns boolean indicating success
   */
  setDefaultProvider(providerName: string): boolean {
    return providerManager.setDefaultProvider(providerName);
  }
}

export const emailService = new EmailService();
