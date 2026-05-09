import { PrismaClient } from '@prisma/client';
import { logger } from '../../services/logger.js';

// Configuration data seeders (KEEP - these are system-level config, not demo data)
import seedModules from './module-seeder/index.js';
import seedSubModules from './sub-module-seeder/index.js';
import seedSubscriptionPlans from './subscription-plans-seeder/index.js';
import seedSubscriptionPlanModules from './subscription-plans-module-seeder/index.js';
import seedVehicleTypes from './vehicle-type-seeder/index.js';
import seedVehicleModels from './vehicle-model-seeder/index.js';
import seedWarrantyTemplateCategories from './warranty-template-category-seeder/index.js';
import { seedCoins } from './coin-seeder/index.js';
import seedSuperAdmin from './super-admin-seeder/index.js';
import { seedCanonicalRoles } from '../../utils/seedRoles.js';

// Demo data seeders - DISABLED (removed to prevent hardcoded dummy data)
// import seedUsers from './user-seeder/index.js';
// import seedProviders from './provider-seeder/index.js';
// import seedProviderSubscriptions from './provider-subscription-seeder/index.js';
// import seedProviderCustomers from './provider-customer-seeder/index.js';
// import seedCustomerVehicles from './customer-vehicle-seeder/index.js';
// import seedFranchises from './franchise-seeder/index.js';
// import seedCategories from './category-seeder/index.js';
// import seedFranchiseInventory from './franchise-inventory-seeder/index.js';
// import seedFranchiseServices from './franchise-service-seeder/index.js';
// import seedStaff from './staff-seeder/index.js';

const seed = async () => {
    try {
        logger.info('Starting database seeding (configuration data only)...');
        const prisma = new PrismaClient();
        try {
            await prisma.$transaction(async (tx) => {
                // Only clear and re-seed configuration/reference data
                // This does NOT touch user-created business data (users, providers, staff, etc.)
                logger.info('Clearing existing configuration data...');

                // Clear config tables (safe to re-seed)
                await tx.subscriptionPlanModule.deleteMany({});
                await tx.subscriptionPlan.deleteMany({});
                await tx.subModule.deleteMany({});
                await tx.module.deleteMany({});

                // Seed configuration data
                logger.info('Seeding modules...');
                await seedModules(tx);

                logger.info('Seeding sub-modules...');
                await seedSubModules(tx);

                logger.info('Seeding subscription plans...');
                await seedSubscriptionPlans(tx);

                logger.info('Seeding subscription plan modules...');
                await seedSubscriptionPlanModules(tx);

                logger.info('Seeding vehicle types...');
                await seedVehicleTypes(tx);
            }, {
                timeout: 30000,
                maxWait: 5000,
                isolationLevel: 'Serializable'
            });

            // Seed vehicle models outside transaction (reference data)
            logger.info('Seeding vehicle models...');
            const prisma2 = new PrismaClient();
            await seedVehicleModels(prisma2);
            await prisma2.$disconnect();

            // Seed warranty template categories (idempotent upsert)
            logger.info('Seeding warranty template categories...');
            await seedWarrantyTemplateCategories(prisma);

            // Seed coin packages and pricing
            logger.info('Seeding coin packages and pricing...');
            await seedCoins();

            logger.info('Seeding canonical roles (RoleName / SubRoleName)...');
            await seedCanonicalRoles();

            // Seed Super Admin user (idempotent) AFTER canonical roles
            logger.info('Seeding Super Admin...');
            await seedSuperAdmin();

            logger.info('Database seeding completed successfully (configuration only)');
        } catch (error) {
            logger.error('Error during database seeding:', error);
            throw error;
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        logger.error('Error seeding database:', error);
        throw error;
    }
};

seed().then(() => {
    logger.info('Seeding completed');
    process.exit(0);
}).catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
});
