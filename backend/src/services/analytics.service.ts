import { AppDataSource } from '../config/database';
import { EmailEvent } from '../models/EmailEvent';

export class AnalyticsService {
  private eventRepository = AppDataSource.getRepository(EmailEvent);

  async trackEvent(event: Partial<EmailEvent>) {
    const newEvent = this.eventRepository.create(event);
    await this.eventRepository.save(newEvent);
  }
}

export const analyticsService = new AnalyticsService();