import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Franchise } from '../../../prisma/db-models.js';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedFranchises = async (tx) => {
    try {
        logger.info('Starting franchise seeding...');

        // Read and parse the CSV file
        const records = [];
        const parser = fs
            .createReadStream(path.join(__dirname, 'franchise.csv'))
            .pipe(parse({
                columns: true,
                skip_empty_lines: true
            }));

        for await (const record of parser) {
            // Convert string values to appropriate types and trim whitespace
            const franchise = {
                id: record.id.trim(),
                provider_id: record.provider_id.trim(),
                name: record.name,
                address: record.address,
                city: record.city,
                state: record.state,
                country: record.country,
                pin_code: record.pin_code,
                email: record.email,
                phone_number: record.phone_number,
                latitude: record.latitude ? parseFloat(record.latitude) : null,
                longitude: record.longitude ? parseFloat(record.longitude) : null,
                is_active: record.is_active === 'true',
                is_deleted: record.is_deleted === 'true',
                deleted_at: record.deleted_at || null,
                deleted_by_id: record.deleted_by_id ? record.deleted_by_id.trim() : null,
                created_by_id: record.created_by_id ? record.created_by_id.trim() : null
            };
            records.push(franchise);
        }

        // Delete existing franchises
        logger.info('Deleting existing franchises...');
        await tx.franchise.deleteMany({});

        // Insert new franchises
        logger.info('Inserting new franchises...');
        const result = await tx.franchise.createMany({
            data: records
        });

        logger.info(`Successfully seeded ${result.count} franchises`);
        return records;
    } catch (error) {
        logger.error('Error seeding franchises:', error);
        throw error;
    }
};

export default seedFranchises;
