import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { logger } from '../../../services/logger.js';
import bcrypt from 'bcrypt';

const seedStaff = async (tx) => {
    try {
        logger.info('Seeding staff...');

        // Read and parse the CSV file
        const fileContent = readFileSync('./prisma/seed/staff-seeder/staff.csv', 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        // Create staff records
        for (const record of records) {
            // Hash a default password for all staff members
            const hashed_password = await bcrypt.hash('Staff@123', 10);

            await tx.staff.create({
                data: {
                    id: record.id,
                    provider_id: record.provider_id,
                    franchise_id: record.franchise_id,
                    name: record.staff_name,
                    email: record.staff_email,
                    phone: record.staff_phone,
                    address: record.staff_address,
                    password: hashed_password,
                    is_active: record.staff_is_active === 'true',
                    is_deleted: record.staff_is_deleted === 'true',
                    deleted_at: record.staff_deleted_at ? new Date(record.staff_deleted_at) : null
                }
            });
        }

        logger.info('Staff seeding completed');
    } catch (error) {
        logger.error('Error seeding staff:', error);
        throw error;
    }
} 

export default seedStaff;