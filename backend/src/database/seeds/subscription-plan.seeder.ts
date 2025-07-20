import { AppDataSource } from '../../config/database';
import { SubscriptionPlan } from '../../models/SubscriptionPlan';

export const seedSubscriptionPlans = async () => {
  const subscriptionPlanRepository = AppDataSource.getRepository(SubscriptionPlan);

  const defaultPlan = await subscriptionPlanRepository.findOne({ where: { name: 'Default' } });

  if (!defaultPlan) {
    const newPlan = subscriptionPlanRepository.create({
      name: 'Default',
      price: 0,
      emailCredits: 1000,
    });
    await subscriptionPlanRepository.save(newPlan);
    console.log('Default subscription plan seeded.');
  }
};