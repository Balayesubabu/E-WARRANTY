import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedFranchiseInventory = async (tx) => {
  try {
    logger.info('Starting franchise inventory seeding...');

    // Read and parse the CSV file
    const csvFilePath = path.join(__dirname, 'franchise-inventory.csv');
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

    logger.info(`Found ${records.length} franchise inventory records to seed`);

    // Delete existing records
    logger.info('Deleting existing franchise inventory...');
    await tx.franchiseInventory.deleteMany({});

    // Transform records
    const inventoryItems = records.map((record) => {
      // Parse product_image string to array
      const productImageStr = record.product_image.replace(/[']/g, '"');
      let productImage = [];
      try {
        productImage = JSON.parse(productImageStr);
      } catch (error) {
        logger.warn(`Failed to parse product_image for item ${record.product_name}, using empty array`);
      }

      return {
        id: record.id,
        franchise_id: record.franchise_id,
        provider_id: record.provider_id,
        category_id: record.category_id,
        product_name: record.product_name,
        product_hsn_code: record.product_hsn_code,
        product_item_code: record.product_item_code,
        product_custom_code: record.product_custom_code,
        product_image: productImage,
        product_description: record.product_description,
        product_purchase_price: parseFloat(record.product_purchase_price),
        product_selling_price: parseFloat(record.product_selling_price),
        product_quantity: parseInt(record.product_quantity),
        product_mesuring_unit: record.product_mesuring_unit,
        product_gst_percentage: parseFloat(record.product_gst_percentage),
        product_gst_amount: parseFloat(record.product_gst_amount),
        product_original_price: parseFloat(record.product_original_price),
        product_total_price: parseFloat(record.product_total_price),
        product_status: record.product_status,
        product_is_active: record.product_is_active === 'true',
        product_is_deleted: record.product_is_deleted === 'true',
        product_low_stock_level: parseInt(record.product_low_stock_level),
        product_reorder_level: parseInt(record.product_reorder_level)
      };
    });

    // Insert new records
    logger.info('Inserting new franchise inventory...');
    const result = await tx.franchiseInventory.createMany({
      data: inventoryItems
    });

    logger.info(`Successfully seeded ${result.count} franchise inventory records`);
    return result.count;
  } catch (error) {
    logger.error('Error seeding franchise inventory:', error);
    throw error;
  }
};

export default seedFranchiseInventory; 