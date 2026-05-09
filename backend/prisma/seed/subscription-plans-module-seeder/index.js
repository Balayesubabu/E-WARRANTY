import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../services/logger.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedSubscriptionPlanModules = async (tx) => {
    try {
        logger.info('Starting subscription plan modules seeding...');

        // Read and parse the CSV file
        const csvFilePath = path.join(__dirname, 'subscription-plan-modules.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        const records = [];
        const parser = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        for await (const record of parser) {
            records.push({
                id: record.id,
                subscription_plan_id: record.subscription_plan_id,
                module_id: record.module_id,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        // Delete existing subscription plan modules
        await tx.subscriptionPlanModule.deleteMany({});

        // Insert new subscription plan modules
        const result = await tx.subscriptionPlanModule.createMany({
            data: records
        });

        logger.info(`Successfully seeded ${result.count} subscription plan modules`);
        return result;
    } catch (error) {
        logger.error('Error seeding subscription plan modules:', error);
        throw error;
    }
};

export default seedSubscriptionPlanModules;
