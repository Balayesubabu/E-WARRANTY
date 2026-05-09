import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../services/logger.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedProviders = async (tx) => {
    try {
        logger.info('Starting provider seeding...');

        // Read and parse the CSV file
        const csvFilePath = path.join(__dirname, 'provider.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        const records = [];
        const parser = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        for await (const record of parser) {
            records.push({
                id: record.id,
                user_id: record.user_id,
                company_name: record.company_name,
                company_address: record.company_address,
                company_logo: record.company_logo,
                company_website: record.company_website,
                company_description: record.company_description,
                facebook_url: record.facebook_url,
                instagram_url: record.instagram_url,
                youtube_url: record.youtube_url,
                achivements: record.achivements,
                mode_of_service_offered: record.mode_of_service_offered.split(','),
                post_code: record.post_code,
                gst_number: record.gst_number,
                is_kyc_verified: record.is_kyc_verified === 'true',
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        // Delete existing providers
        await tx.provider.deleteMany({});

        // Insert new providers
        const result = await tx.provider.createMany({
            data: records
        });

        logger.info(`Successfully seeded ${result.count} providers`);
        return result;
    } catch (error) {
        logger.error('Error seeding providers:', error);
        throw error;
    }
};

export default seedProviders;
