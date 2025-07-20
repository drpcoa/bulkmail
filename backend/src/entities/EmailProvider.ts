import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EmailProviderIP } from './EmailProviderIP';

export enum ProviderType {
  SMTP = 'smtp',
  MAILCOW = 'mailcow',
  ELASTIC_EMAIL = 'elastic_email',
  SENDGRID = 'sendgrid',
  OTHER = 'other',
}

@Entity('email_providers')
export class EmailProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ProviderType })
  type: ProviderType;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => EmailProviderIP, ip => ip.provider)
  ipAddresses: EmailProviderIP[];

  constructor(partial: Partial<EmailProvider> = {}) {
    Object.assign(this, partial);
  }
}
