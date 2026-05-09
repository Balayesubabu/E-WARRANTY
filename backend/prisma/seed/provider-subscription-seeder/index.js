import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../services/logger.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedProviderSubscriptions = async (tx) => {
    try {
        logger.info('Starting provider subscription seeding...');

        // Read and parse the CSV file
        const csvFilePath = path.join(__dirname, 'provider-subscription.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        const records = [];
        const parser = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        for await (const record of parser) {
            records.push({
                id: record.id,
                provider_id: record.provider_id,
                subscription_plan_id: record.subscription_plan_id,
                start_date: new Date(record.start_date),
                end_date: new Date(record.end_date),
                amount_paid: parseFloat(record.amount_paid),
                is_active: record.is_active === 'true',
                is_cancelled: record.is_cancelled === 'true',
                is_base_plan_active: record.is_base_plan_active === 'true',
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        // Delete existing provider subscriptions
        await tx.providerSubscription.deleteMany({});

        // Insert new provider subscriptions
        const result = await tx.providerSubscription.createMany({
            data: records
        });

        logger.info(`Successfully seeded ${result.count} provider subscriptions`);
        return result;
    } catch (error) {
        logger.error('Error seeding provider subscriptions:', error);
        throw error;
    }
};

export default seedProviderSubscriptions;
