import { PrismaClient } from '@prisma/client';

/**
 * Cleanup script to remove seeded demo/dummy data from the database.
 * Only removes records with specific IDs that were inserted by the seed script.
 * Does NOT touch any real user-created data.
 */

const prisma = new PrismaClient();

// Known seeded demo IDs
const SEEDED_USER_IDS = [
    '550e8400-e29b-41d4-a716-446655440000', // Mayank Sharma (demo admin)
];

const SEEDED_PROVIDER_IDS = [
    '550e8400-e29b-41d4-a717-446655440000', // Sharyo Admin Company
];

const SEEDED_FRANCHISE_IDS = [
    '550e8400-e29b-41d4-a720-446655440000', // Main Branch
    '550e8400-e29b-41d4-a721-446655440000', // Andheri Branch
    '550e8400-e29b-41d4-a722-446655440000', // Bandra Branch
];

const SEEDED_STAFF_IDS = [
    '550e8400-e29b-41d4-a761-446655440000',
    '550e8400-e29b-41d4-a762-446655440000',
    '550e8400-e29b-41d4-a763-446655440000',
    '550e8400-e29b-41d4-a764-446655440000',
    '550e8400-e29b-41d4-a765-446655440000',
    '550e8400-e29b-41d4-a766-446655440000',
    '550e8400-e29b-41d4-a767-446655440000',
    '550e8400-e29b-41d4-a768-446655440000',
    '550e8400-e29b-41d4-a769-446655440000',
    '550e8400-e29b-41d4-a770-446655440000',
    '550e8400-e29b-41d4-a771-446655440000',
    '550e8400-e29b-41d4-a772-446655440000',
];

const SEEDED_CUSTOMER_IDS = [
    '550e8400-e29b-41d4-a723-446655440000', // Rahul Sharma
    '550e8400-e29b-41d4-a724-446655440000', // Priya Patel
    '550e8400-e29b-41d4-a725-446655440000', // Amit Singh
    '550e8400-e29b-41d4-a726-446655440000', // Neha Gupta
    '550e8400-e29b-41d4-a727-446655440000', // Rajesh Kumar
];

const cleanup = async () => {
    try {
        console.log('Starting cleanup of seeded demo data...\n');

        // 1. Delete seeded staff
        const staffResult = await prisma.staff.deleteMany({
            where: { id: { in: SEEDED_STAFF_IDS } }
        });
        console.log(`Removed ${staffResult.count} seeded staff records`);

        // 2. Delete customer vehicles linked to seeded customers
        const vehicleResult = await prisma.providerCustomerVehicle.deleteMany({
            where: { provider_customer_id: { in: SEEDED_CUSTOMER_IDS } }
        });
        console.log(`Removed ${vehicleResult.count} seeded customer vehicle records`);

        // 3. Delete seeded provider customers
        const customerResult = await prisma.providerCustomers.deleteMany({
            where: { id: { in: SEEDED_CUSTOMER_IDS } }
        });
        console.log(`Removed ${customerResult.count} seeded provider customer records`);

        // 4. Delete franchise inventory linked to seeded franchises
        const inventoryResult = await prisma.franchiseInventory.deleteMany({
            where: { franchise_id: { in: SEEDED_FRANCHISE_IDS } }
        });
        console.log(`Removed ${inventoryResult.count} seeded franchise inventory records`);

        // 5. Delete franchise service packages linked to seeded franchises
        const servicePackageResult = await prisma.franchiseServicePackage.deleteMany({
            where: { franchise_id: { in: SEEDED_FRANCHISE_IDS } }
        });
        console.log(`Removed ${servicePackageResult.count} seeded franchise service package records`);

        // 6. Delete franchise services linked to seeded franchises
        const serviceResult = await prisma.franchiseService.deleteMany({
            where: { franchise_id: { in: SEEDED_FRANCHISE_IDS } }
        });
        console.log(`Removed ${serviceResult.count} seeded franchise service records`);

        // 7. Delete seeded franchises
        const franchiseResult = await prisma.franchise.deleteMany({
            where: { id: { in: SEEDED_FRANCHISE_IDS } }
        });
        console.log(`Removed ${franchiseResult.count} seeded franchise records`);

        // 8. Delete categories linked to seeded provider
        const categoryResult = await prisma.category.deleteMany({
            where: { provider_id: { in: SEEDED_PROVIDER_IDS } }
        });
        console.log(`Removed ${categoryResult.count} seeded category records`);

        // 9. Delete terms and conditions linked to seeded provider
        const termsResult = await prisma.termsAndConditions.deleteMany({
            where: { provider_id: { in: SEEDED_PROVIDER_IDS } }
        });
        console.log(`Removed ${termsResult.count} seeded terms records`);

        // 10. Delete provider bank details
        const bankResult = await prisma.providerBankDetails.deleteMany({
            where: { provider_id: { in: SEEDED_PROVIDER_IDS } }
        });
        console.log(`Removed ${bankResult.count} seeded bank detail records`);

        // 11. Delete provider tax details
        const taxResult = await prisma.providerTax.deleteMany({
            where: { provider_id: { in: SEEDED_PROVIDER_IDS } }
        });
        console.log(`Removed ${taxResult.count} seeded tax records`);

        // 12. Delete provider subscriptions linked to seeded provider
        const subResult = await prisma.providerSubscription.deleteMany({
            where: { provider_id: { in: SEEDED_PROVIDER_IDS } }
        });
        console.log(`Removed ${subResult.count} seeded provider subscription records`);

        // 13. Delete seeded provider
        const providerResult = await prisma.provider.deleteMany({
            where: { id: { in: SEEDED_PROVIDER_IDS } }
        });
        console.log(`Removed ${providerResult.count} seeded provider records`);

        // 14. Delete seeded user (demo admin)
        const userResult = await prisma.user.deleteMany({
            where: { id: { in: SEEDED_USER_IDS } }
        });
        console.log(`Removed ${userResult.count} seeded user records`);

        console.log('\nCleanup completed successfully!');
        console.log('Only seeded demo data was removed. Your real data is safe.');

    } catch (error) {
        console.error('Error during cleanup:', error.message);
        // If a specific table doesn't exist or FK constraint, log and continue
        if (error.code === 'P2003') {
            console.error('Foreign key constraint error. Some dependent records may still exist.');
            console.error('Try running the cleanup again or check your database manually.');
        }
    } finally {
        await prisma.$disconnect();
    }
};

cleanup();
