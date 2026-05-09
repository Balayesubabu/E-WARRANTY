import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../services/logger.js';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedUsers = async (tx) => {
    try {
        logger.info('Starting user seeding...');

        // Read and parse the CSV file
        const csvFilePath = path.join(__dirname, 'user.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

        const records = [];
        const parser = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        for await (const record of parser) {
            const user = {
                id: record.id,
                first_name: record.first_name,
                last_name: record.last_name,
                email: record.email,
                country_code: record.country_code,
                phone_number: record.phone_number,
                password: record.password,
                user_type: record.user_type,
                role_id: record.role_id,
                is_active: record.is_active === 'true',
                is_phone_verified: record.is_phone_verified === 'true',
                is_email_verified: record.is_email_verified === 'true',
                is_terms_and_conditions_accepted: record.is_terms_and_conditions_accepted === 'true',
                is_privacy_policy_accepted: record.is_privacy_policy_accepted === 'true',
                created_at: new Date(),
                updated_at: new Date()
            };
            records.push(user);
            logger.info(`Preparing to seed user with ID: ${user.id}`);
        }

        // Delete existing users
        logger.info('Deleting existing users...');
        await tx.user.deleteMany({});

        // Insert new users
        logger.info('Inserting new users...');
        const result = await tx.user.createMany({
            data: records
        });

        // Verify the user was created
        const createdUser = await tx.user.findUnique({
            where: { id: records[0].id }
        });
        logger.info(`Verified user creation - User exists: ${!!createdUser}, ID: ${records[0].id}`);

        logger.info(`Successfully seeded ${result.count} users`);
        return result;
    } catch (error) {
        logger.error('Error seeding users:', error);
        throw error;
    }
};

export default seedUsers; 