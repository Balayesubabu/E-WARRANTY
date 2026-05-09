import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedCategories = async (tx) => {
  try {
    logger.info('Starting category seeding...');

    // Read and parse the CSV file
    const csvFilePath = path.join(__dirname, 'category.csv');
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

    logger.info(`Found ${records.length} category records to seed`);

    // Delete existing records
    logger.info('Deleting existing categories...');
    await tx.category.deleteMany({});

    // Transform records
    const categories = records.map((record) => {
      const isDeleted = record.is_deleted === 'true';
      return {
        id: record.id,
        provider_id: record.provider_id,
        category_name: record.category_name,
        category_description: record.category_description,
        is_active: record.is_active === 'true',
        is_deleted: isDeleted,
        deleted_at: isDeleted ? new Date(record.deleted_at) : null
      };
    });

    // Insert new records
    logger.info('Inserting new categories...');
    const result = await tx.category.createMany({
      data: categories
    });

    logger.info(`Successfully seeded ${result.count} category records`);
    return result.count;
  } catch (error) {
    logger.error('Error seeding categories:', error);
    throw error;
  }
};

export default seedCategories; 