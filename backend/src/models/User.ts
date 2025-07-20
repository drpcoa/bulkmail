import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { SubscriptionPlan } from './SubscriptionPlan';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastName!: string | null;

  @Column({ default: false })
  isAdmin!: boolean;

  @OneToOne(() => SubscriptionPlan)
  @JoinColumn()
  subscriptionPlan!: SubscriptionPlan;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}