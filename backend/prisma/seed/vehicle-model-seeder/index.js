import { fileURLToPath } from 'url';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_SIZE = 100; // Process 100 records at a time

const seedVehicleModels = async (prisma) => {
  try {
    logger.info('Starting vehicle model seeding...');
    const csvPath = path.join(__dirname, 'car_model.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    logger.info(`Found ${records.length} vehicle models to seed`);

    // Process records in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      logger.info(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(records.length / BATCH_SIZE)}`);
      
      await Promise.all(batch.map(async (record) => {
        try {
          await prisma.vehicleModel.create({
            data: {
              make: record.make,
              model: record.model,
              type: record.type,
              year_of_making: parseInt(record.year_of_making, 10),
              created_at: new Date(record.created_at),
              updated_at: new Date(record.updated_at),
            },
          });
        } catch (error) {
          logger.error(`Error creating vehicle model ${record.make} ${record.model}:`, error);
          throw error;
        }
      }));
    }

    logger.info('Successfully seeded vehicle models');
  } catch (error) {
    logger.error('Error seeding vehicle models:', error);
    throw error;
  }
};

export default seedVehicleModels; 