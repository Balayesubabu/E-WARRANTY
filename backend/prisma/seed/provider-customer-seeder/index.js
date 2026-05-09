import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedProviderCustomers = async (tx) => {
  try {
    logger.info('Starting provider customer seeding...');

    // Read and parse the CSV file
    const csvFilePath = path.join(__dirname, 'provider-customer.csv');
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

    // Convert string values to appropriate types
    const providerCustomers = records.map(record => ({
      ...record,
      opening_balance: parseFloat(record.opening_balance) || 0,
      customer_credit_limit: parseFloat(record.customer_credit_limit) || 0,
      customer_credit_period: parseInt(record.customer_credit_period) || 0,
      customer_final_balance: parseFloat(record.customer_final_balance) || 0,
      is_active: record.is_active === 'true',
      is_deleted: record.is_deleted === 'true',
      deleted_at: record.deleted_at || null,
      deleted_by_id: null, // Set to null since we don't have a valid user ID for deletion
      customer_category_id: record.customer_category_id || null
    }));

    // Delete existing records
    logger.info('Deleting existing provider customers...');
    await tx.providerCustomers.deleteMany({});

    // Insert new records
    logger.info('Inserting new provider customers...');
    const result = await tx.providerCustomers.createMany({
      data: providerCustomers
    });

    logger.info(`Successfully seeded ${result.count} provider customers`);
    return result.count;
  } catch (error) {
    logger.error('Error seeding provider customers:', error);
    throw error;
  }
};

export default seedProviderCustomers; 