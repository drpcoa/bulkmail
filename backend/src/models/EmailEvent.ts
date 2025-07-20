import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum EmailEventType {
  SENT = 'sent',
  BOUNCE = 'bounce',
  COMPLAINT = 'complaint',
}

@Entity('email_events')
export class EmailEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  messageId!: string;

  @Column({
    type: 'enum',
    enum: EmailEventType,
  })
  type!: EmailEventType;

  @Column('jsonb', { nullable: true })
  details!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}