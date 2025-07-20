import { AppDataSource } from '../../config/database';
import { seedSubscriptionPlans } from './subscription-plan.seeder';

const runSeeds = async () => {
  await AppDataSource.initialize();
  await seedSubscriptionPlans();
  await AppDataSource.destroy();
};

runSeeds().catch((error) => console.error('Seeding failed:', error));