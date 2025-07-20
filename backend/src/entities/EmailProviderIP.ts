import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { EmailProvider } from './EmailProvider';

@Entity('email_provider_ips')
@Index(['providerId', 'ipAddress'], { unique: true })
export class EmailProviderIP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => EmailProvider, provider => provider.ipAddresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: EmailProvider;

  @Column({ type: 'varchar', length: 45 }) // Supports both IPv4 and IPv6
  ipAddress: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  emailCount: number;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deactivatedAt: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  constructor(partial: Partial<EmailProviderIP> = {}) {
    Object.assign(this, partial);
  }
}
