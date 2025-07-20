import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddEmailProviderTables1719300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create email_providers table
    await queryRunner.createTable(
      new Table({
        name: 'email_providers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['smtp', 'mailcow', 'elastic_email', 'sendgrid', 'other'],
            isNullable: false,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create email_provider_ips table
    await queryRunner.createTable(
      new Table({
        name: 'email_provider_ips',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'providerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45', // Supports both IPv4 and IPv6
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'emailCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failureCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deactivatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on providerId and ipAddress for faster lookups
    await queryRunner.createIndex(
      'email_provider_ips',
      new TableIndex({
        name: 'IDX_EMAIL_PROVIDER_IP_PROVIDER',
        columnNames: ['providerId', 'ipAddress'],
        isUnique: true,
      }),
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'email_provider_ips',
      new TableForeignKey({
        columnNames: ['providerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'email_providers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const emailProviderIPsTable = await queryRunner.getTable('email_provider_ips');
    const providerForeignKey = emailProviderIPsTable.foreignKeys.find(
      fk => fk.columnNames.indexOf('providerId') !== -1,
    );
    
    if (providerForeignKey) {
      await queryRunner.dropForeignKey('email_provider_ips', providerForeignKey);
    }

    // Drop tables
    await queryRunner.dropTable('email_provider_ips');
    await queryRunner.dropTable('email_providers');
  }
}
