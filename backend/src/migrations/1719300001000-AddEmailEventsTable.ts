import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddEmailEventsTable1719300001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'eventType',
            type: 'enum',
            enum: [
              'sent', 'delivered', 'opened', 'clicked', 
              'bounced', 'complained', 'failed', 'deferred',
              'unsubscribed', 'blocked'
            ],
            isNullable: false,
          },
          {
            name: 'providerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'messageId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'recipient',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for faster queries
    await queryRunner.createIndex(
      'email_events',
      new TableIndex({
        name: 'IDX_EMAIL_EVENTS_EVENT_TYPE',
        columnNames: ['eventType'],
      }),
    );

    await queryRunner.createIndex(
      'email_events',
      new TableIndex({
        name: 'IDX_EMAIL_EVENTS_PROVIDER',
        columnNames: ['providerId'],
      }),
    );

    await queryRunner.createIndex(
      'email_events',
      new TableIndex({
        name: 'IDX_EMAIL_EVENTS_IP',
        columnNames: ['ipAddress'],
      }),
    );

    await queryRunner.createIndex(
      'email_events',
      new TableIndex({
        name: 'IDX_EMAIL_EVENTS_TIMESTAMP',
        columnNames: ['timestamp'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_events');
  }
}
