import { IEmailProvider } from './email.provider.interface';
import { MailcowProvider } from './mailcow.provider';
import { SmtpComProvider } from './smtpcom.provider';
import { ElasticEmailProvider } from './elasticemail.provider';
import { config } from '../config';

class ProviderManager {
  private providers: Map<string, IEmailProvider> = new Map();
  private defaultProvider: string = 'smtpcom'; // Default provider

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    try {
      if (config.mailcow.apiKey && config.mailcow.apiUrl) {
        this.registerProvider('mailcow', new MailcowProvider());
      }
    } catch (error) {
      console.error('Failed to initialize Mailcow provider:', error);
    }

    try {
      if (config.smtpcom.apiKey && config.smtpcom.sender) {
        this.registerProvider('smtpcom', new SmtpComProvider());
      }
    } catch (error) {
      console.error('Failed to initialize SMTP.com provider:', error);
    }

    try {
      if (config.elasticEmail.apiKey && config.elasticEmail.from) {
        this.registerProvider('elasticemail', new ElasticEmailProvider());
      }
    } catch (error) {
      console.error('Failed to initialize ElasticEmail provider:', error);
    }
  }

  registerProvider(name: string, provider: IEmailProvider) {
    this.providers.set(name, provider);
    console.log(`Registered email provider: ${name}`);
  }

  getProvider(name: string): IEmailProvider | undefined {
    return this.providers.get(name);
  }

  getDefaultProvider(): IEmailProvider | undefined {
    // Try to get the default provider, fallback to any available provider
    return (
      this.getProvider(this.defaultProvider) ||
      Array.from(this.providers.values())[0]
    );
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  setDefaultProvider(providerName: string): boolean {
    if (this.providers.has(providerName)) {
      this.defaultProvider = providerName;
      return true;
    }
    return false;
  }
}

export const providerManager = new ProviderManager();

export function initProviders() {
  // Just creating the providerManager instance initializes all providers
  const manager = providerManager;
  const availableProviders = manager.listProviders();
  
  if (availableProviders.length === 0) {
    console.warn('No email providers were initialized. Please check your configuration.');
  } else {
    console.log(`Initialized email providers: ${availableProviders.join(', ')}`);
    console.log(`Default email provider: ${manager.getDefaultProvider()?.getProviderName() || 'None'}`);
  }
}

export { IEmailProvider } from './email.provider.interface';
