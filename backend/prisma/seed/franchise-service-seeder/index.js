import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedFranchiseServices = async (tx) => {
  try {
    logger.info('Starting franchise service seeding...');

    // Read and parse the CSV file
    const csvFilePath = path.join(__dirname, 'franchise-service.csv');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    const records = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      }, (err, records) => {
        if (err) reject(err);
        resolve(records);
      });
    });

    logger.info(`Found ${records.length} franchise service records to seed`);

    // Delete existing records first
    logger.info('Deleting existing franchise services...');
    await tx.franchiseService.deleteMany({});

    // Transform records
    const services = records.map((record) => {
      const isDeleted = record.service_is_deleted === 'true';
      return {
        id: record.id,
        franchise_id: record.franchise_id,
        provider_id: record.provider_id,
        service_name: record.service_name,
        service_short_description: record.service_short_description,
        service_icon: record.service_icon,
        service_is_featured: record.service_is_featured === 'true',
        service_type: record.service_type,
        service_description: record.service_description,
        service_is_active: record.service_is_active === 'true',
        service_slug: record.service_slug,
        service_price: parseFloat(record.service_price),
        service_gst_percentage: parseFloat(record.service_gst_percentage),
        service_gst_amount: parseFloat(record.service_gst_amount),
        service_total_price: parseFloat(record.service_total_price),
        service_is_deleted: isDeleted,
        service_deleted_at: isDeleted ? new Date(record.service_deleted_at) : null,
        service_deleted_by_id: record.service_deleted_by_id || null,
        created_by_id: null // Set to null since it's optional
      };
    });

    // Insert new records
    logger.info('Inserting new franchise services...');
    const result = await tx.franchiseService.createMany({
      data: services
    });

    logger.info(`Successfully seeded ${result.count} franchise service records`);
    return result.count;
  } catch (error) {
    logger.error('Error seeding franchise services:', error);
    throw error;
  }
};

export default seedFranchiseServices; 