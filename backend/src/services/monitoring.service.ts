import { DataSource, Repository } from 'typeorm';
import { EventEmitter } from 'events';
import { EmailEvent } from '../entities/EmailEvent';
import { logger } from '../utils/logger';

type EmailEventType = 'deferred' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed' | 'unsubscribed' | 'blocked';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface MetricOptions {
  interval?: number; // in milliseconds
  retention?: number; // in days
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: boolean;
  redis: boolean;
  emailProviders: Array<{
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastEvent?: Date;
    successRate: number;
  }>;
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    loadAvg: number[];
  };
}

type ProviderStats = Record<string, {
  total: number;
  success: number;
  lastEvent?: Date;
  successRate: number;
}>;

export class MonitoringService {
  private static instance: MonitoringService;
  private dataSource!: DataSource;
  private emailEventRepository!: Repository<EmailEvent>;
  private metrics: Map<string, Metric[]> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private options: Required<MetricOptions> = {
    interval: 60000, // 1 minute
    retention: 7, // 7 days
  };
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {}

  public static getInstance(dataSource?: DataSource): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
      if (dataSource) {
        MonitoringService.instance.initialize(dataSource);
      }
    }
    return MonitoringService.instance;
  }

  public initialize(dataSource: DataSource, options: Partial<MetricOptions> = {}): void {
    this.dataSource = dataSource;
    this.emailEventRepository = dataSource.getRepository(EmailEvent);
    this.options = { ...this.options, ...options };
    this.setupCleanupJob();
  }

  private setupCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.options.retention);
        
        await this.emailEventRepository
          .createQueryBuilder('event')
          .where('event.createdAt < :cutoffDate', { cutoffDate })
          .delete()
          .execute();
          
        logger.info(`Cleaned up events older than ${cutoffDate.toISOString()}`);
      } catch (error) {
        logger.error('Error cleaning up old events:', error);
      }
    }, this.options.interval);
  }

  public async logEmailEvent(
    eventType: EmailEventType,
    email: string,
    provider: string,
    metadata: Record<string, unknown> = {}
  ): Promise<EmailEvent> {
    const event = this.emailEventRepository.create({
      eventType,
      recipientEmail: email,
      providerId: provider,
      metadata: metadata as Record<string, any>,
      createdAt: new Date()
    });
    
    try {
      const savedEvent = await this.emailEventRepository.save(event);
      this.eventEmitter.emit('emailEvent', savedEvent);
      return savedEvent;
    } catch (error) {
      logger.error('Error logging email event:', error);
      throw error;
    }
  }

  public async getEmailStats(
    startDate: Date = new Date(0),
    endDate: Date = new Date(),
    filters: Record<string, unknown> = {}
  ) {
    try {
      const query = this.emailEventRepository
        .createQueryBuilder('event')
        .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query.andWhere(`event.${key} = :${key}`, { [key]: value });
        }
      });

      const events = await query.getMany();
      const successEvents = events.filter(e => ['sent', 'delivered', 'opened', 'clicked'].includes(e.eventType));
      const failedEvents = events.filter(e => ['bounced', 'failed', 'blocked'].includes(e.eventType));

      const byStatus: Record<string, number> = {};
      const byProvider: Record<string, number> = {};
      const byHour: Record<string, number> = {};

      events.forEach(event => {
        // Count by status
        byStatus[event.eventType] = (byStatus[event.eventType] || 0) + 1;
        
        // Count by provider
        if (event.providerId) {
          byProvider[event.providerId] = (byProvider[event.providerId] || 0) + 1;
        }
        
        // Count by hour
        const hour = new Date(event.createdAt).toISOString().slice(0, 13) + ':00:00.000Z';
        byHour[hour] = (byHour[hour] || 0) + 1;
      });

      return {
        total: events.length,
        success: successEvents.length,
        failed: failedEvents.length,
        byStatus,
        byProvider,
        byHour,
      };
    } catch (error) {
      logger.error('Error getting email stats:', error);
      throw error;
    }
  }

  public async getSystemHealth(): Promise<SystemHealth> {
    // Check database connection
    let database = false;
    try {
      await this.dataSource.query('SELECT 1');
      database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    // Check Redis connection (placeholder - implement based on your Redis client)
    const redis = false;

    // Get email providers status
    const providerStats = await this.getProviderStats();
    const emailProviders = Object.entries(providerStats).map(([id, stats]) => ({
      id,
      name: id,
      status: stats.successRate > 0.9 ? 'healthy' : stats.successRate > 0.7 ? 'degraded' : 'unhealthy',
      lastEvent: stats.lastEvent,
      successRate: stats.successRate,
    }));

    // System metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();

    // Determine overall status
    const allComponentsHealthy = database && redis && 
      emailProviders.every(p => p.status === 'healthy');
    
    const anyComponentUnhealthy = !database || !redis || 
      emailProviders.some(p => p.status === 'unhealthy');
    
    const status = allComponentsHealthy 
      ? 'healthy' 
      : anyComponentUnhealthy 
        ? 'unhealthy' 
        : 'degraded';

    return {
      status,
      database,
      redis,
      emailProviders,
      metrics: {
        memoryUsage,
        uptime,
        loadAvg: [cpuUsage.user, cpuUsage.system, 0],
      },
    };
  }

  private async getProviderStats(): Promise<ProviderStats> {
    const stats = await this.emailEventRepository
      .createQueryBuilder('event')
      .select(['event.providerId as provider', 'event.eventType as eventType', 'COUNT(*) as count'])
      .groupBy('event.providerId, event.eventType')
      .getRawMany();

    const result: ProviderStats = {};

    stats.forEach(stat => {
      const provider = stat.provider;
      if (!result[provider]) {
        result[provider] = { total: 0, success: 0, successRate: 0 };
      }
      
      const count = parseInt(stat.count, 10);
      result[provider].total += count;
      
      if (['sent', 'delivered', 'opened', 'clicked'].includes(stat.eventType)) {
        result[provider].success += count;
      }
      
      // Update success rate
      if (result[provider].total > 0) {
        result[provider].successRate = result[provider].success / result[provider].total;
      }
    });

    // Get last event time for each provider
    const lastEvents = await this.emailEventRepository
      .createQueryBuilder('event')
      .select(['event.providerId as provider', 'MAX(event.createdAt) as lastEvent'])
      .groupBy('event.providerId')
      .getRawMany();

    lastEvents.forEach(event => {
      if (event.provider && result[event.provider]) {
        result[event.provider].lastEvent = new Date(event.lastEvent);
      }
    });

    return result;
  }

  public onEmailEvent(callback: (event: EmailEvent) => void): () => void {
    this.eventEmitter.on('emailEvent', callback);
    return () => this.eventEmitter.off('emailEvent', callback);
  }

  public on(event: 'metric' | 'emailEvent', listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  public off(event: 'metric' | 'emailEvent', listener: (data: any) => void): void {
    this.eventEmitter.off(event, listener);
  }

  public recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)?.push(metric);
    this.eventEmitter.emit('metric', metric);
  }

  public async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.eventEmitter.removeAllListeners();
  }
}
