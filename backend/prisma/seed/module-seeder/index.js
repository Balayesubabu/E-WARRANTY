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

const seedModules = async (tx) => {
    try {
        logger.info('Starting module seeding...');

        // Read and parse the CSV file
        const csvFilePath = path.join(__dirname, 'modules.csv');
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
                is_active: record.is_active === 'true',
                is_deleted: record.is_deleted === 'true',
                created_at: parseDate(record.created_at),
                updated_at: parseDate(record.updated_at)
            });
        }

        // Delete existing modules
        await tx.module.deleteMany({});

        // Insert new modules
        const result = await tx.module.createMany({
            data: records
        });

        logger.info(`Successfully seeded ${result.count} modules`);
        return result;
    } catch (error) {
        logger.error('Error seeding modules:', error);
        throw error;
    }
};

export default seedModules;
