import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export type EmailEventType = 
  | 'sent'           // Email was sent
  | 'delivered'      // Email was successfully delivered
  | 'opened'         // Recipient opened the email
  | 'clicked'        // Recipient clicked a link in the email
  | 'bounced'        // Email bounced
  | 'complained'     // Recipient marked the email as spam
  | 'failed'         // Failed to send email
  | 'deferred'       // Email sending was deferred
  | 'unsubscribed'   // Recipient unsubscribed
  | 'blocked';       // Email was blocked

@Entity('email_events')
@Index(['eventType', 'timestamp'])
@Index(['providerId', 'timestamp'])
@Index(['ipAddress', 'timestamp'])
export class EmailEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: [
      'sent', 'delivered', 'opened', 'clicked', 
      'bounced', 'complained', 'failed', 'deferred',
      'unsubscribed', 'blocked'
    ],
  })
  eventType: EmailEventType;

  @Column({ type: 'uuid', nullable: true })
  providerId: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  messageId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  constructor(partial: Partial<EmailEvent> = {}) {
    Object.assign(this, partial);
  }
}
