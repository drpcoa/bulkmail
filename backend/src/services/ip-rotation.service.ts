import { Service } from 'typedi';
import { EntityManager, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { EmailProvider } from '../entities/EmailProvider';
import { EmailProviderIP } from '../entities/EmailProviderIP';
import { logger } from '../utils/logger';

interface IPRotationConfig {
  maxEmailsPerIP: number;
  cooldownPeriod: number; // in minutes
  healthCheckInterval: number; // in minutes
}

@Service()
export class IPRotationService {
  private static instance: IPRotationService;
  private config: IPRotationConfig;
  private dataSource: DataSource;
  private emailProviderRepository: Repository<EmailProvider>;
  private emailProviderIPRepository: Repository<EmailProviderIP>;

  private constructor() {
    this.config = {
      maxEmailsPerIP: parseInt(process.env.IP_ROTATION_MAX_EMAILS || '1000', 10),
      cooldownPeriod: parseInt(process.env.IP_ROTATION_COOLDOWN || '60', 10),
      healthCheckInterval: parseInt(process.env.IP_ROTATION_HEALTH_CHECK_INTERVAL || '5', 10)
    };
  }

  public static getInstance(dataSource?: DataSource): IPRotationService {
    if (!IPRotationService.instance) {
      IPRotationService.instance = new IPRotationService();
      if (dataSource) {
        IPRotationService.instance.initialize(dataSource);
      }
    }
    return IPRotationService.instance;
  }

  public initialize(dataSource: DataSource): void {
    this.dataSource = dataSource;
    this.emailProviderRepository = dataSource.getRepository(EmailProvider);
    this.emailProviderIPRepository = dataSource.getRepository(EmailProviderIP);
    this.setupHealthChecks();
  }

  private setupHealthChecks(): void {
    // Periodically check IP health
    setInterval(async () => {
      try {
        await this.checkIPHealth();
      } catch (error) {
        logger.error('Error in IP health check:', error);
      }
    }, this.config.healthCheckInterval * 60 * 1000);
  }

  public async getNextAvailableIP(providerId: string): Promise<EmailProviderIP | null> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Find an available IP that's not in cooldown and has the lowest email count
      const ip = await transactionalEntityManager
        .createQueryBuilder(EmailProviderIP, 'ip')
        .where('ip.providerId = :providerId', { providerId })
        .andWhere('ip.isActive = :isActive', { isActive: true })
        .andWhere('(ip.lastUsedAt IS NULL OR ip.lastUsedAt < :cooldownThreshold)', {
          cooldownThreshold: new Date(Date.now() - this.config.cooldownPeriod * 60 * 1000)
        })
        .orderBy('ip.emailCount', 'ASC')
        .addOrderBy('ip.lastUsedAt', 'ASC', 'NULLS FIRST')
        .setLock({ mode: 'pessimistic_write' })
        .getOne();

      if (!ip) {
        return null;
      }

      // Update the IP's usage count and last used timestamp
      ip.emailCount += 1;
      ip.lastUsedAt = new Date();
      
      await transactionalEntityManager.save(ip);
      
      return ip;
    });
  }

  public async markIPAsUsed(ipId: string, success: boolean): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const ip = await transactionalEntityManager.findOne(EmailProviderIP, {
        where: { id: ipId }
      });

      if (!ip) return;

      if (success) {
        ip.emailCount += 1;
        ip.lastUsedAt = new Date();
      } else {
        // If sending failed, mark for cooldown
        ip.lastUsedAt = new Date();
        ip.failureCount = (ip.failureCount || 0) + 1;
        
        // If too many failures, disable the IP temporarily
        if (ip.failureCount >= 3) {
          ip.isActive = false;
          ip.deactivatedAt = new Date();
          logger.warn(`IP ${ip.address} deactivated due to multiple failures`);
        }
      }

      await transactionalEntityManager.save(ip);
    });
  }

  public async addIPToProvider(
    providerId: string,
    ipAddress: string,
    isActive: boolean = true
  ): Promise<EmailProviderIP> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const provider = await transactionalEntityManager.findOne(EmailProvider, {
        where: { id: providerId }
      });

      if (!provider) {
        throw new Error(`Provider with ID ${providerId} not found`);
      }

      const ip = this.emailProviderIPRepository.create({
        provider,
        ipAddress,
        isActive,
        emailCount: 0,
        failureCount: 0
      });

      return transactionalEntityManager.save(ip);
    });
  }

  public async checkIPHealth(): Promise<void> {
    const thresholdTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    // Check for IPs that have been inactive for too long
    const inactiveIPs = await this.emailProviderIPRepository
      .createQueryBuilder('ip')
      .where('ip.isActive = :isActive', { isActive: false })
      .andWhere('ip.deactivatedAt < :thresholdTime', { thresholdTime })
      .getMany();

    // Reactivate IPs that have been in cooldown
    for (const ip of inactiveIPs) {
      ip.isActive = true;
      ip.failureCount = 0;
      ip.deactivatedAt = null;
      await this.emailProviderIPRepository.save(ip);
      logger.info(`Reactivated IP ${ip.ipAddress} after cooldown`);
    }
  }

  public async getIPStats(providerId?: string): Promise<{
    totalIPs: number;
    activeIPs: number;
    ipUsage: Array<{ ip: string; usage: number; status: string }>;
  }> {
    const query = this.emailProviderIPRepository
      .createQueryBuilder('ip')
      .select([
        'ip.ipAddress as ip',
        'ip.emailCount as usage',
        'ip.isActive as isActive',
        'ip.lastUsedAt as lastUsed',
        'ip.failureCount as failures'
      ]);

    if (providerId) {
      query.where('ip.providerId = :providerId', { providerId });
    }

    const ips = await query.getRawMany();

    return {
      totalIPs: ips.length,
      activeIPs: ips.filter(ip => ip.isActive).length,
      ipUsage: ips.map(ip => ({
        ip: ip.ip,
        usage: ip.usage,
        status: ip.isActive ? 'active' : 'inactive',
        lastUsed: ip.lastUsed,
        failures: ip.failures
      }))
    };
  }
}
