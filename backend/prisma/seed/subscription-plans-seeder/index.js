import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../services/logger.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseDate = (dateStr) => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // If date is invalid, return current date
            return new Date();
        }
        return date;
    } catch (error) {
        // If any error in parsing, return current date
        return new Date();
    }
};

const seedSubscriptionPlans = async (tx) => {
    try {
        logger.info('Starting subscription plans seeding...');

        // Read and parse the CSV file
        const csvFilePath = path.join(__dirname, 'subscription-plans.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        const records = [];
        const parser = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        for await (const record of parser) {
            records.push({
                id: record.id,
                name: record.name,
                description: record.description,
                price: parseFloat(record.price),
                is_active: record.is_active === 'true',
                is_deleted: record.is_deleted === 'true',
                is_base_plan: record.is_base_plan === 'true',
                created_at: parseDate(record.created_at),
                updated_at: parseDate(record.updated_at)
            });
        }

        // Delete existing subscription plans
        await tx.subscriptionPlan.deleteMany({});

        // Insert new subscription plans
        const result = await tx.subscriptionPlan.createMany({
            data: records
        });

        logger.info(`Successfully seeded ${result.count} subscription plans`);
        return result;
    } catch (error) {
        logger.error('Error seeding subscription plans:', error);
        throw error;
    }
};

export default seedSubscriptionPlans;
